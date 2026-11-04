#!/usr/bin/python3
"""Restricted SSH deployment endpoint. No shell, sudo or service changes."""
import contextlib
import fcntl
import hashlib
import json
import os
from pathlib import Path, PurePosixPath
import re
import shlex
import signal
import sys
import tarfile
import tempfile
from urllib.error import HTTPError
from urllib.parse import quote
from urllib.request import HTTPRedirectHandler, Request, build_opener
import uuid

BASE = Path('/var/www/victor.woelffel.com')
PUBLIC_URL = 'https://victor.woelffel.com/'
RELEASE = re.compile(r'[0-9a-f]{40}-[0-9]{8}T[0-9]{6}Z\Z')
STORED_RELEASE = re.compile(r'[0-9a-f]{40}(?:-[0-9]{8}T[0-9]{6}Z)?\Z')
MAX_ARCHIVE = 64 * 1024 * 1024
MAX_CONTENT = 256 * 1024 * 1024
ROOT_FILES = {'index.html', 'app.bundle.js', 'styles.css', 'preferences.js', '.nojekyll'}
REQUIRED = {'index.html', 'app.bundle.js', 'styles.css', 'preferences.js'}


class DeployError(Exception):
    def __init__(self, message, rolled_back=False):
        super().__init__(message)
        self.rolled_back = rolled_back


def digest(data):
    return hashlib.sha256(data).hexdigest()


def public_path(name):
    path = PurePosixPath(name)
    if path.is_absolute() or '..' in path.parts or '\\' in name:
        raise DeployError('Unsafe archive path')
    if any(ord(char) < 32 for char in name):
        raise DeployError('Control character in archive path')
    if not path.parts:
        return ''
    normalized = path.as_posix()
    if any(part.startswith('.') for part in path.parts) and normalized != '.nojekyll':
        raise DeployError('Hidden files are not publishable')
    if normalized not in ROOT_FILES and path.parts[0] != 'assets':
        raise DeployError('File outside the static site allowlist')
    return normalized


def manifest(root):
    rows = []
    for file in sorted(root.rglob('*')):
        if file.is_symlink() or not (file.is_file() or file.is_dir()):
            raise DeployError('Unsupported file type')
        relative = public_path(file.relative_to(root).as_posix())
        if file.is_file():
            data = file.read_bytes()
            rows.append({'path': relative, 'bytes': len(data), 'sha256': digest(data)})
    if not REQUIRED.issubset({row['path'] for row in rows}):
        raise DeployError('Incomplete static site')
    return sorted(rows, key=lambda row: row['path'])


class NoRedirect(HTTPRedirectHandler):
    def redirect_request(self, request, file, code, message, headers, new_url):
        return None


class Deployment:
    def __init__(self, base=BASE, public_url=PUBLIC_URL):
        self.base = Path(base)
        self.url = public_url
        self.releases = self.base / 'releases'
        if self.base.is_symlink() or self.releases.is_symlink() or not self.releases.is_dir():
            raise DeployError('Invalid deployment root')
        self.metadata = self.base / '.deploy-manifests'
        self.incoming = self.base / '.deploy-incoming'
        for directory in (self.metadata, self.incoming):
            if directory.is_symlink():
                raise DeployError('Invalid private deployment directory')
            directory.mkdir(mode=0o700, exist_ok=True)
        self.pending = self.base / '.deploy-pending.json'

    @contextlib.contextmanager
    def locked(self):
        with (self.base / '.deploy.lock').open('a') as lock:
            fcntl.flock(lock, fcntl.LOCK_EX)
            yield

    def release_path(self, name, new=False):
        if not (RELEASE if new else STORED_RELEASE).fullmatch(name):
            raise DeployError('Invalid release identifier')
        return self.releases / name

    def current(self):
        pointer = self.base / 'current'
        if not pointer.is_symlink():
            raise DeployError('Current release is not a symlink')
        target = pointer.resolve(strict=True)
        if target.parent != self.releases.resolve() or target.is_symlink():
            raise DeployError('Current release is outside this site')
        self.release_path(target.name)
        if not (target / 'index.html').is_file():
            raise DeployError('Current release is incomplete')
        return target

    def write_state(self, target, data):
        temporary = self.base / ('.state-' + uuid.uuid4().hex)
        try:
            with temporary.open('x', encoding='utf-8') as stream:
                os.chmod(temporary, 0o600)
                stream.write(data)
                stream.flush()
                os.fsync(stream.fileno())
            os.replace(temporary, target)
        finally:
            temporary.unlink(missing_ok=True)

    def switch(self, target):
        next_pointer = self.base / ('.current-next-' + uuid.uuid4().hex)
        try:
            next_pointer.symlink_to(target)
            os.replace(next_pointer, self.base / 'current')
        finally:
            next_pointer.unlink(missing_ok=True)

    def recover_pending(self):
        if not self.pending.exists():
            return False
        state = json.loads(self.pending.read_text())
        previous = self.release_path(state['previous'])
        candidate = self.release_path(state['candidate'], new=True)
        if previous.is_symlink() or not (previous / 'index.html').is_file():
            raise DeployError('Recovery target is invalid')
        current = self.current()
        if current == candidate:
            self.switch(previous)
        elif current != previous:
            raise DeployError('Pending deployment conflicts with the current release')
        self.pending.unlink()
        return True

    def status(self):
        return {'protocol': 1, 'current': str(self.current()),
                'pending': self.pending.exists(),
                'helper_sha256': digest(Path(__file__).read_bytes())}

    def upload(self, release, expected_hash, size, stream):
        candidate = self.release_path(release, new=True)
        if not re.fullmatch(r'[0-9a-f]{64}', expected_hash):
            raise DeployError('Invalid archive checksum')
        if not 0 < size <= MAX_ARCHIVE:
            raise DeployError('Invalid archive size')
        with self.locked():
            self.recover_pending()
            if candidate.exists() or candidate.is_symlink():
                raise DeployError('Release already exists')
            with tempfile.TemporaryDirectory(dir=self.incoming) as temporary:
                archive_path = Path(temporary) / 'site.tar.gz'
                checksum = hashlib.sha256()
                with archive_path.open('xb') as archive_file:
                    remaining = size
                    while remaining:
                        chunk = stream.read(min(65536, remaining))
                        if not chunk:
                            raise DeployError('Truncated archive')
                        archive_file.write(chunk)
                        checksum.update(chunk)
                        remaining -= len(chunk)
                    if stream.read(1):
                        raise DeployError('Archive exceeds its declared size')
                if checksum.hexdigest() != expected_hash:
                    raise DeployError('Archive checksum mismatch')
                with tarfile.open(archive_path, 'r:gz') as archive:
                    members = []
                    seen = set()
                    total = 0
                    for member in archive:
                        relative = public_path(member.name)
                        if not (member.isfile() or member.isdir()):
                            raise DeployError('Archive links and special files are forbidden')
                        if relative in seen:
                            raise DeployError('Duplicate archive path')
                        seen.add(relative)
                        total += member.size
                        if total > MAX_CONTENT or len(seen) > 5000:
                            raise DeployError('Static site exceeds deployment limits')
                        if relative or not member.isdir():
                            members.append((member, relative))
                    candidate.mkdir(mode=0o755)
                    for member, relative in members:
                        output = candidate / relative
                        if member.isdir():
                            output.mkdir(mode=0o755, parents=True, exist_ok=True)
                        else:
                            output.parent.mkdir(mode=0o755, parents=True, exist_ok=True)
                            with archive.extractfile(member) as source, output.open('xb') as target:
                                while True:
                                    chunk = source.read(65536)
                                    if not chunk:
                                        break
                                    target.write(chunk)
                            output.chmod(0o644)
                files = manifest(candidate)
                self.write_state(self.metadata / (release + '.json'), json.dumps({
                    'archive_sha256': expected_hash, 'files': files,
                }))
                return {'release': release, 'files': files, 'archive_sha256': expected_hash}

    def verify_public(self, candidate, files, release):
        checked = 0
        opener = build_opener(NoRedirect)
        for row in files:
            if row['path'].startswith('.'):
                continue
            url = self.url + quote(row['path']) + '?deployment=' + release
            request = Request(url, headers={'Accept-Encoding': 'identity', 'Cache-Control': 'no-cache'})
            with opener.open(request, timeout=20) as response:
                if response.status != 200 or digest(response.read()) != row['sha256']:
                    raise DeployError('HTTPS content mismatch: ' + row['path'])
            checked += 1
        http_url = self.url.replace('https://', 'http://', 1) + '?deployment=' + release
        expected_location = self.url + '?deployment=' + release
        try:
            opener.open(http_url, timeout=20)
        except HTTPError as response:
            if response.code != 301 or response.headers.get('Location') != expected_location:
                raise DeployError('Incorrect HTTP to HTTPS redirect')
        else:
            raise DeployError('HTTP did not redirect to HTTPS')
        return checked

    def activate(self, release):
        candidate = self.release_path(release, new=True)
        with self.locked():
            recovered = self.recover_pending()
            if candidate.is_symlink() or not candidate.is_dir():
                raise DeployError('Candidate release is unavailable')
            recorded = json.loads((self.metadata / (release + '.json')).read_text())
            files = manifest(candidate)
            if files != recorded['files']:
                raise DeployError('Candidate differs from the verified upload')
            candidate.chmod(0o755)
            for entry in candidate.rglob('*'):
                entry.chmod(0o755 if entry.is_dir() else 0o644)
            previous = self.current()
            if previous == candidate:
                return {**self.status(), 'verified_files': self.verify_public(candidate, files, release)}
            self.write_state(self.pending, json.dumps({'previous': previous.name, 'candidate': release}))
            try:
                self.switch(candidate)
                count = self.verify_public(candidate, files, release)
                self.write_state(self.base / '.previous-release', str(previous) + '\n')
                self.pending.unlink()
            except BaseException as error:
                self.switch(previous)
                self.pending.unlink(missing_ok=True)
                raise DeployError('Verification failed; previous release restored: ' + str(error), rolled_back=True) from error
            return {**self.status(), 'previous': str(previous), 'verified_files': count,
                    'recovered_pending_deployment': recovered}


def dispatch(command, deployment, stream):
    arguments = shlex.split(command)
    if arguments == ['status']:
        return deployment.status()
    if arguments == ['recover']:
        with deployment.locked():
            recovered = deployment.recover_pending()
            return {**deployment.status(), 'recovered': recovered}
    if len(arguments) == 4 and arguments[0] == 'upload' and arguments[3].isdigit():
        return deployment.upload(arguments[1], arguments[2], int(arguments[3]), stream)
    if len(arguments) == 2 and arguments[0] == 'activate':
        return deployment.activate(arguments[1])
    raise DeployError('Only status, upload, activate and recover are permitted')


def interrupted(signum, frame):
    raise DeployError('Deployment interrupted by signal ' + str(signum))


def main():
    os.umask(0o022)
    for signum in (signal.SIGINT, signal.SIGTERM, signal.SIGHUP, signal.SIGALRM):
        signal.signal(signum, interrupted)
    signal.alarm(240)
    try:
        result = dispatch(os.environ.get('SSH_ORIGINAL_COMMAND', ''), Deployment(), sys.stdin.buffer)
        print(json.dumps(result), flush=True)
        return 0
    except Exception as error:
        print(json.dumps({'error': str(error), 'rolled_back': getattr(error, 'rolled_back', False)}), flush=True)
        return 1


if __name__ == '__main__':
    sys.exit(main())
