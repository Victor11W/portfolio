import hashlib
import importlib.util
import io
import json
from types import SimpleNamespace
from urllib.error import HTTPError, URLError
from pathlib import Path
import tarfile
import tempfile
import subprocess
import sys
import select
import unittest
from unittest.mock import patch

MODULE = Path(__file__).resolve().parents[2] / 'ops' / 'vm01_deploy.py'
spec = importlib.util.spec_from_file_location('vm01_deploy', MODULE)
vm01 = importlib.util.module_from_spec(spec)
spec.loader.exec_module(vm01)
OLD = 'a' * 40
NEW = 'b' * 40 + '-20261104T120000Z'


def archive(extra=None):
    output = io.BytesIO()
    files = {'index.html': b'<html>new</html>', 'app.bundle.js': b'new()',
             'details.bundle.js': b'details()', 'project-details.css': b'.detail{}',
             'styles.css': b'body{}', 'preferences.js': b'preferences()', '.nojekyll': b''}
    with tarfile.open(fileobj=output, mode='w:gz') as stream:
        for name, data in files.items():
            member = tarfile.TarInfo(name)
            member.size = len(data)
            stream.addfile(member, io.BytesIO(data))
        if extra:
            member = tarfile.TarInfo(extra[0])
            member.type = extra[1]
            member.linkname = '/etc/passwd'
            stream.addfile(member)
    return output.getvalue()


class DeploymentTests(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory()
        self.base = Path(self.temporary.name)
        (self.base / 'releases' / OLD).mkdir(parents=True)
        (self.base / 'releases' / OLD / 'index.html').write_text('old site')
        (self.base / 'current').symlink_to(self.base / 'releases' / OLD)
        self.deployment = vm01.Deployment(self.base)

    def tearDown(self):
        self.temporary.cleanup()

    def upload(self, data=None):
        data = archive() if data is None else data
        return self.deployment.upload(NEW, hashlib.sha256(data).hexdigest(), len(data), io.BytesIO(data))

    def test_upload_keeps_production_unchanged_and_compares_bytes(self):
        result = self.upload()
        self.assertEqual(self.deployment.current().name, OLD)
        self.assertEqual(len(result['files']), 7)
        self.assertEqual((self.base / 'releases' / NEW / 'app.bundle.js').read_bytes(), b'new()')

    def test_project_detail_resources_are_required_and_nonempty(self):
        self.upload()
        candidate = self.base / 'releases' / NEW
        for name in ('details.bundle.js', 'project-details.css'):
            with self.subTest(name=name):
                file = candidate / name
                original = file.read_bytes()
                try:
                    file.unlink()
                    with self.assertRaisesRegex(vm01.DeployError, 'Incomplete static site'):
                        vm01.manifest(candidate)
                    file.write_bytes(b'')
                    with self.assertRaisesRegex(vm01.DeployError, 'Incomplete static site'):
                        vm01.manifest(candidate)
                finally:
                    file.write_bytes(original)
        self.assertEqual(len(vm01.manifest(candidate)), 7)
        self.assertEqual(self.deployment.current().name, OLD)

    def test_upload_rejects_wrong_checksum_and_truncation(self):
        data = archive()
        for body, checksum, size in [(data, '0' * 64, len(data)), (data[:-1], hashlib.sha256(data).hexdigest(), len(data))]:
            with self.subTest(size=len(body)), self.assertRaises(vm01.DeployError):
                self.deployment.upload(NEW, checksum, size, io.BytesIO(body))
        self.assertFalse((self.base / 'releases' / NEW).exists())

    def test_archive_traversal_absolute_paths_and_links_are_rejected(self):
        for name, kind in [('../outside', tarfile.REGTYPE), ('/tmp/outside', tarfile.REGTYPE),
                           ('assets/link', tarfile.SYMTYPE), ('assets/hard', tarfile.LNKTYPE), ('.env', tarfile.REGTYPE)]:
            with self.subTest(name=name), self.assertRaises(vm01.DeployError):
                self.upload(archive((name, kind)))
        self.assertFalse((self.base / 'releases' / NEW).exists())

    def test_existing_release_cannot_be_overwritten(self):
        self.upload()
        with self.assertRaises(vm01.DeployError):
            self.upload()

    def test_unexpected_commands_and_release_paths_are_rejected(self):
        for command in ['id', 'bash', 'status; id', 'activate ../../etc', 'upload ../site deadbeef 1', '']:
            with self.subTest(command=command), self.assertRaises(vm01.DeployError):
                vm01.dispatch(command, self.deployment, io.BytesIO())

    def test_successful_atomic_activation_records_previous_release(self):
        self.upload()
        self.deployment.verify_public = lambda *args: 6
        result = self.deployment.activate(NEW)
        self.assertEqual(self.deployment.current().name, NEW)
        self.assertEqual(result['verified_files'], 6)
        self.assertEqual((self.base / '.previous-release').read_text().strip(), str(self.base / 'releases' / OLD))
        self.assertFalse(self.deployment.pending.exists())

    def test_https_content_redirect_and_network_failures_restore_previous_site(self):
        self.upload()
        for reason in ['HTTPS content mismatch', 'Incorrect HTTP to HTTPS redirect', 'TLS verification failed', 'Network unavailable']:
            with self.subTest(reason=reason):
                def failure(*args):
                    raise RuntimeError(reason)
                self.deployment.verify_public = failure
                with self.assertRaises(vm01.DeployError) as error:
                    self.deployment.activate(NEW)
                self.assertTrue(error.exception.rolled_back)
                self.assertEqual(self.deployment.current().name, OLD)
                self.assertFalse(self.deployment.pending.exists())
                self.assertFalse((self.base / '.previous-release').exists())

    def test_candidate_tampering_prevents_activation(self):
        self.upload()
        (self.base / 'releases' / NEW / 'app.bundle.js').write_text('tampered')
        with self.assertRaises(vm01.DeployError):
            self.deployment.activate(NEW)
        self.assertEqual(self.deployment.current().name, OLD)

    def test_interruption_after_switch_rolls_back(self):
        self.upload()
        def interrupted(*args):
            raise KeyboardInterrupt()
        self.deployment.verify_public = interrupted
        with self.assertRaises(vm01.DeployError) as error:
            self.deployment.activate(NEW)
        self.assertTrue(error.exception.rolled_back)
        self.assertEqual(self.deployment.current().name, OLD)

    def test_recovery_of_a_hard_interruption_restores_previous_pointer(self):
        self.upload()
        self.deployment.write_state(self.deployment.pending, json.dumps({'previous': OLD, 'candidate': NEW}))
        self.deployment.switch(self.base / 'releases' / NEW)
        result = vm01.dispatch('recover', self.deployment, io.BytesIO())
        self.assertTrue(result['recovered'])
        self.assertEqual(self.deployment.current().name, OLD)

    def test_recovery_refuses_to_overwrite_an_unrelated_later_release(self):
        self.upload()
        other = 'c' * 40
        (self.base / 'releases' / other).mkdir()
        (self.base / 'releases' / other / 'index.html').write_text('later')
        self.deployment.write_state(self.deployment.pending, json.dumps({'previous': OLD, 'candidate': NEW}))
        self.deployment.switch(self.base / 'releases' / other)
        with self.assertRaises(vm01.DeployError):
            vm01.dispatch('recover', self.deployment, io.BytesIO())
        self.assertEqual(self.deployment.current().name, other)

    def test_current_pointer_cannot_escape_the_site(self):
        (self.base / 'current').unlink()
        (self.base / 'current').symlink_to(self.base)
        with self.assertRaises(vm01.DeployError):
            self.deployment.status()

    def test_deploy_lock_serializes_a_second_publisher(self):
        program = "import fcntl; f=open(" + repr(str(self.base / '.deploy.lock')) + ", 'a'); print('waiting', flush=True); fcntl.flock(f, fcntl.LOCK_EX); print('entered', flush=True)"
        with self.deployment.locked():
            child = subprocess.Popen([sys.executable, '-c', program], stdout=subprocess.PIPE, text=True)
            self.assertEqual(child.stdout.readline().strip(), 'waiting')
            self.assertEqual(select.select([child.stdout], [], [], 0.15)[0], [])
        output, _ = child.communicate(timeout=5)
        self.assertIn('entered', output)
        self.assertEqual(child.returncode, 0)

    def verifier(self, wrong_file=False, redirect=301, location=None, network_error=False):
        root = self.base / 'releases' / NEW
        class Response(io.BytesIO):
            status = 200
        def open_request(request, timeout):
            url = request.full_url if isinstance(request, vm01.Request) else request
            if network_error:
                raise URLError('TLS or network failure')
            if url.startswith('http://'):
                raise HTTPError(url, redirect, 'redirect', {'Location': location or url.replace('http://', 'https://', 1)}, None)
            relative = url.split('victor.woelffel.com/', 1)[1].split('?', 1)[0]
            return Response(b'incorrect content' if wrong_file else (root / relative).read_bytes())
        return SimpleNamespace(open=open_request)

    def test_real_verification_accepts_matching_files_and_exact_redirect(self):
        self.upload()
        with patch.object(vm01, 'build_opener', return_value=self.verifier()):
            result = self.deployment.activate(NEW)
        self.assertEqual(result['verified_files'], 6)
        self.assertEqual(self.deployment.current().name, NEW)

    def test_real_verification_rolls_back_wrong_bytes_redirects_and_network_errors(self):
        self.upload()
        cases = [dict(wrong_file=True), dict(redirect=302), dict(location='https://unrelated.invalid/'), dict(network_error=True)]
        for options in cases:
            with self.subTest(options=options), patch.object(vm01, 'build_opener', return_value=self.verifier(**options)):
                with self.assertRaises(vm01.DeployError) as error:
                    self.deployment.activate(NEW)
                self.assertTrue(error.exception.rolled_back)
                self.assertEqual(self.deployment.current().name, OLD)


if __name__ == '__main__':
    unittest.main()
