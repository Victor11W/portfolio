import fs from 'node:fs/promises';
import {createReadStream} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawn} from 'node:child_process';
import {pipeline} from 'node:stream/promises';
import {sha256, PUBLIC_URL} from './package.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const packageDirectory = path.resolve(process.env.VM01_PACKAGE_DIR || path.join(root, 'outputs', 'ci-package'));

async function ssh(command, input) {
  const key = process.env.VM01_SSH_KEY_FILE;
  if (!key) throw new Error('VM01_SSH_KEY_FILE is required');
  const child = spawn('ssh', [
    '-T', '-o', 'BatchMode=yes', '-o', 'ConnectTimeout=15',
    '-o', 'StrictHostKeyChecking=yes', '-o', 'IdentitiesOnly=yes',
    '-o', 'UserKnownHostsFile=' + path.join(root, 'ops', 'vm01_known_hosts'),
    '-i', key, 'victor@victor.woelffel.com', command,
  ], {stdio: ['pipe', 'pipe', 'inherit']});
  let output = '';
  child.stdout.on('data', chunk => {
    output += chunk.toString('utf8');
    if (output.length > 2 * 1024 * 1024) child.kill();
  });
  const completed = new Promise((resolve, reject) => {
    child.once('error', reject);
    child.once('exit', code => resolve(code));
  });
  child.stdin.on('error', () => {});
  const sending = input ? pipeline(createReadStream(input), child.stdin).catch(() => {}) : Promise.resolve(child.stdin.end());
  const [code] = await Promise.all([completed, sending]);
  let result;
  try { result = JSON.parse(output); } catch { throw new Error('SSH did not return a deployment result (exit ' + code + ')'); }
  if (code !== 0) {
    const error = new Error(result.error || 'SSH failed with exit ' + code);
    error.serverResult = result;
    throw error;
  }
  return result;
}

async function deploy() {
  const commit = process.argv[2];
  if (!/^[0-9a-f]{40}$/.test(commit || '')) throw new Error('Expected the workflow commit SHA');
  const data = JSON.parse(await fs.readFile(path.join(packageDirectory, 'manifest.json'), 'utf8'));
  if (data.schema !== 1 || data.commit !== commit || data.publicUrl !== PUBLIC_URL) throw new Error('Artifact does not match this commit and site');
  const archive = path.join(packageDirectory, 'site.tar.gz');
  const bytes = await fs.readFile(archive);
  if (bytes.length !== data.archive.bytes || sha256(bytes) !== data.archive.sha256) throw new Error('Artifact archive checksum mismatch');
  const status = await ssh('status');
  const expectedHelper = sha256(await fs.readFile(path.join(root, 'ops', 'vm01_deploy.py')));
  if (status.protocol !== 1 || status.helper_sha256 !== expectedHelper) throw new Error('VM01 deployment helper differs from this reviewed version; install it using the personal SSH account');
  const release = commit + '-' + new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
  const uploaded = await ssh(`upload ${release} ${data.archive.sha256} ${data.archive.bytes}`, archive);
  const expectedFiles = new Map(data.files.map(file => [file.path, file]));
  const sameFiles = Array.isArray(uploaded.files) && uploaded.files.length === expectedFiles.size && new Set(uploaded.files.map(file => file.path)).size === expectedFiles.size && uploaded.files.every(file => {
    const expected = expectedFiles.get(file.path);
    return expected && expected.bytes === file.bytes && expected.sha256 === file.sha256;
  });
  if (uploaded.release !== release || uploaded.archive_sha256 !== data.archive.sha256 || !sameFiles) throw new Error('Transferred file list or checksums differ from the build; production was not changed');
  let activated;
  try {
    activated = await ssh('activate ' + release);
  } catch (error) {
    if (error.serverResult?.rolled_back) console.error('Previous release restored by VM01.');
    else {
      try {
        const recovered = await ssh('recover');
        console.error('Recovery confirmed; current release: ' + recovered.current);
      } catch { console.error('Could not confirm recovery over SSH. Check VM01 with the personal account before retrying.'); }
    }
    throw error;
  }
  if (activated.current !== '/var/www/victor.woelffel.com/releases/' + release || activated.pending) throw new Error('Unexpected active release');
  const report = {url: PUBLIC_URL, commit, release, current: activated.current, previous: activated.previous, verifiedFiles: activated.verified_files};
  console.log(JSON.stringify(report, null, 2));
  if (process.env.GITHUB_STEP_SUMMARY) await fs.appendFile(process.env.GITHUB_STEP_SUMMARY,
    `Published [Victor's portfolio](${PUBLIC_URL})\n\nCommit: \`${commit}\`\n\nActive: \`${report.current}\`\n\nPrevious: \`${report.previous}\`\n\nHTTPS files verified: ${report.verifiedFiles}\n`);
}

deploy().catch(error => {console.error(error.message); process.exitCode = 1;});
