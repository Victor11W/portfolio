import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawn} from 'node:child_process';
import {createHash} from 'node:crypto';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const publicUrl = 'https://perso.telecom-paristech.fr/vwoelffel-23/';
const destination = 'vwoelffel-23@perso-vwoelffel-23.lxc.enst.fr';
const gateway = 'vwoelffel-23@ssh.enst.fr';
const args = process.argv.slice(2);
if (args.some(arg => arg !== '--dry-run') || args.length > 1) {
  console.error('Usage: node scripts/deploy.mjs [--dry-run]');
  process.exitCode = 1;
} else {
  try {
    await publish(args.includes('--dry-run'));
  } catch (error) {
    console.error('\nPublication interrompue : ' + error.message);
    process.exitCode = 1;
  }
}

function run(command, commandArgs, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, commandArgs, {
      cwd: root, stdio: 'inherit', windowsHide: true, ...options,
    });
    child.once('error', reject);
    child.once('exit', code => code === 0 ? resolve() : reject(new Error(command + ' : code ' + code)));
  });
}

async function inspectStatic(directory) {
  let files = 0;
  for (const item of await fs.readdir(directory, {withFileTypes: true})) {
    const filename = path.join(directory, item.name);
    const stat = await fs.lstat(filename);
    if (stat.isSymbolicLink()) throw new Error('Lien symbolique refuse dans dist : ' + filename);
    if (stat.isDirectory()) files += await inspectStatic(filename);
    else if (stat.isFile()) files++;
    else throw new Error('Fichier non regulier dans dist : ' + filename);
  }
  return files;
}

async function publish(dryRun) {
  console.log('Verification, tests et construction du portfolio.');
  await run(process.execPath, ['scripts/check.mjs']);
  await run(process.execPath, ['--test']);
  await run(process.execPath, ['scripts/build.mjs']);
  const dist = path.join(root, 'dist');
  if ((await fs.lstat(dist)).isSymbolicLink()) throw new Error('dist ne doit pas etre un lien.');
  const fileCount = await inspectStatic(dist);
  if (!(await fs.stat(path.join(dist, 'index.html'))).size) throw new Error('index.html est vide.');
  const outputs = path.join(root, 'outputs');
  await fs.mkdir(outputs, {recursive: true});
  const output = await fs.mkdtemp(path.join(outputs, 'deploy-'));
  const archive = path.join(output, 'portfolio.tar.gz');
  const tar = process.platform === 'win32'
    ? path.join(process.env.SystemRoot || 'C:/Windows', 'System32', 'tar.exe')
    : 'tar';
  await run(tar, ['-czf', archive, '-C', dist, '.']);
  const bytes = await fs.readFile(archive);
  const sha256 = createHash('sha256').update(bytes).digest('hex');
  const encoded = bytes.toString('base64').match(/.{1,76}/g).join('\n');
  const script = remoteScript(encoded, sha256);
  const scriptPath = path.join(output, 'publish.sh');
  await fs.writeFile(scriptPath, script);
  await fs.writeFile(path.join(output, 'deployment.json'), JSON.stringify({
    publicUrl, destination, gateway, sha256, fileCount, createdAt: new Date().toISOString(), dryRun,
  }, null, 2) + '\n');
  if (dryRun) {
    console.log('\nPreparation terminee. Aucune connexion SSH effectuee.');
    console.log('Archive : ' + archive);
    console.log('Script distant : ' + scriptPath);
    return;
  }
  const gitSsh = path.join(process.env.ProgramFiles || 'C:/Program Files', 'Git', 'usr', 'bin', 'ssh.exe');
  const useGitSsh = process.platform === 'win32' && await fs.access(gitSsh).then(() => true, () => false);
  const ssh = useGitSsh ? gitSsh : 'ssh';
  const environment = {...process.env};
  if (useGitSsh) environment.SHELL = '/bin/bash';
  console.log('\nPublication vers ' + publicUrl);
  console.log('Saisis ton mot de passe uniquement a la demande SSH ci-dessous.');
  await new Promise((resolve, reject) => {
    const child = spawn(ssh, [
      '-T', '-o', 'ConnectTimeout=15', '-o', 'StrictHostKeyChecking=yes',
      '-o', 'UpdateHostKeys=no', '-o', 'NumberOfPasswordPrompts=2',
      '-J', gateway, destination, 'sh', '-s',
    ], {cwd: root, env: environment, stdio: ['pipe', 'inherit', 'inherit']});
    child.once('error', reject);
    child.stdin.once('error', () => {});
    child.once('exit', code => code === 0 ? resolve() : reject(new Error('SSH : code ' + code)));
    child.stdin.end(script);
  });
  console.log('\nPortfolio publie et verifie : ' + publicUrl);
}

function remoteScript(encoded, sha256) {
  return `set -eu
umask 022
web=/srv/www/vwoelffel-23
test -d "$web"
test ! -L "$web"
test -w "$web"
test -f "$web/index.html"
if test -n "$(find "$web" -type l -print -quit)"; then
  printf 'Publication refusee : un lien symbolique existe dans le dossier web.\n' >&2
  exit 1
fi
if ! grep -Fq '<link rel="canonical" href="${publicUrl}">' "$web/index.html" && ! grep -Fq '<title>Site en construction</title>' "$web/index.html"; then
  printf 'Publication refusee : la page existante ne correspond pas au portfolio attendu.\n' >&2
  exit 1
fi
deployment_base="$HOME/.local/share/portfolio-deployments"
mkdir -p "$deployment_base"
deployment_stage=$(mktemp -d "$deployment_base/release.XXXXXX")
printf 'Preparation distante : %s\n' "$deployment_stage"
base64 -d > "$deployment_stage/portfolio.tar.gz" <<'VICTOR_PORTFOLIO_BASE64'
${encoded}
VICTOR_PORTFOLIO_BASE64
printf '%s  %s\n' '${sha256}' "$deployment_stage/portfolio.tar.gz" | sha256sum -c -
mkdir "$deployment_stage/site"
tar -xzf "$deployment_stage/portfolio.tar.gz" -C "$deployment_stage/site" --no-same-owner --no-same-permissions
test -s "$deployment_stage/site/index.html"
tar -czf "$deployment_stage/previous-web.tar.gz" -C "$web" .
cp -p "$web/index.html" "$deployment_stage/previous-index.html"
rollback_needed=1
trap 'deployment_status=$?; trap - 0; if test "$deployment_status" -ne 0 && test "$rollback_needed" -eq 1; then tar -xzf "$deployment_stage/previous-web.tar.gz" -C "$web"; printf "Version precedente restauree. Sauvegarde : %s/previous-web.tar.gz\n" "$deployment_stage" >&2; fi; exit "$deployment_status"' 0
# Retire withdrawn assets outside the public root after taking a backup.
for retired in assets/CV_Victor_Woelffel_FR.pdf assets/portrait-victor.jpg; do
  if test -f "$web/$retired"; then
    mkdir -p "$deployment_stage/retired/assets"
    mv "$web/$retired" "$deployment_stage/retired/$retired"
  fi
done
tar -xzf "$deployment_stage/portfolio.tar.gz" -C "$web" --exclude='./index.html' --no-same-owner --no-same-permissions
next_index=$(mktemp "$web/.index-next.XXXXXX")
cp "$deployment_stage/site/index.html" "$next_index"
chmod 644 "$next_index"
mv "$next_index" "$web/index.html"
python3 - "$deployment_stage/site" <<'VERIFY_PORTFOLIO'
from pathlib import Path
from hashlib import sha256
from urllib.request import Request, urlopen
from urllib.parse import quote
from urllib.error import HTTPError
import sys
release = Path(sys.argv[1])
web = Path('/srv/www/vwoelffel-23')
base = '${publicUrl}'
checked = 0
for source in sorted(release.rglob('*')):
    if not source.is_file():
        continue
    relative = source.relative_to(release)
    expected = sha256(source.read_bytes()).hexdigest()
    assert sha256((web / relative).read_bytes()).hexdigest() == expected, str(relative)
    if source.name.startswith('.'):
        continue
    url = base + ('' if str(relative) == 'index.html' else quote(relative.as_posix()))
    request = Request(url, headers={'Cache-Control': 'no-cache', 'Accept-Encoding': 'identity'})
    with urlopen(request, timeout=20) as response:
        assert response.status == 200, (relative, response.status)
        assert sha256(response.read()).hexdigest() == expected, ('HTTP content differs', relative)
    checked += 1
for retired in ('assets/CV_Victor_Woelffel_FR.pdf', 'assets/portrait-victor.jpg'):
    assert not (web / retired).exists(), ('Withdrawn file in public root', retired)
    try:
        with urlopen(Request(base + retired, headers={'Cache-Control': 'no-cache'}), timeout=20) as response:
            raise AssertionError(('Withdrawn file publicly accessible', retired))
    except HTTPError as error:
        assert error.code in (404, 410), ('Unexpected retired-file status', retired, error.code)
print('Fichiers publics verifies :', checked, flush=True)
print('Fichiers retires : inaccessibles en HTTPS', flush=True)
VERIFY_PORTFOLIO
rollback_needed=0
trap - 0
printf 'Sauvegarde precedente : %s/previous-web.tar.gz\n' "$deployment_stage"
printf 'URL publique : ${publicUrl}\n'
`;
}
