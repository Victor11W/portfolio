import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';

export const PUBLIC_URL = 'https://victor.woelffel.com/';
const ROOT_FILES = new Set(['index.html', 'app.bundle.js', 'details.bundle.js', 'styles.css', 'project-details.css', 'preferences.js', '.nojekyll']);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
export const sha256 = data => createHash('sha256').update(data).digest('hex');

export function publicationHtml(html) {
  const output = html.replaceAll('https://perso.telecom-paristech.fr/vwoelffel-23/', PUBLIC_URL);
  for (const expected of [
    `<link rel="canonical" href="${PUBLIC_URL}">`,
    `<meta property="og:url" content="${PUBLIC_URL}">`,
    `<meta property="og:image" content="${PUBLIC_URL}assets/social-card.png">`,
  ]) if (!output.includes(expected)) throw new Error('Missing production metadata: ' + expected);
  return output;
}

export async function siteManifest(directory) {
  const files = [];
  async function visit(folder) {
    if ((await fs.lstat(folder)).isSymbolicLink()) throw new Error('Linked directory refused');
    for (const entry of await fs.readdir(folder)) {
      const filename = path.join(folder, entry);
      const stat = await fs.lstat(filename);
      const relative = path.relative(directory, filename).split(path.sep).join('/');
      if (stat.isSymbolicLink()) throw new Error('Linked asset refused: ' + relative);
      if (relative.split('/').some(part => part.startsWith('.')) && relative !== '.nojekyll') throw new Error('Hidden asset refused: ' + relative);
      if (!ROOT_FILES.has(relative) && relative !== 'assets' && !relative.startsWith('assets/')) throw new Error('Unexpected public file: ' + relative);
      if (stat.isDirectory()) await visit(filename);
      else if (stat.isFile()) {
        const data = await fs.readFile(filename);
        files.push({path: relative, bytes: data.length, sha256: sha256(data)});
      } else throw new Error('Special file refused: ' + relative);
    }
  }
  await visit(directory);
  for (const name of ['index.html', 'app.bundle.js', 'details.bundle.js', 'styles.css', 'project-details.css', 'preferences.js']) {
    if (!files.some(file => file.path === name && file.bytes > 0)) throw new Error('Missing required asset: ' + name);
  }
  return files.sort((left, right) => left.path < right.path ? -1 : left.path > right.path ? 1 : 0);
}

export async function packageSite(commit, project = root) {
  if (!/^[0-9a-f]{40}$/.test(commit || '')) throw new Error('Expected the full Git commit SHA');
  const dist = path.join(project, 'dist');
  if ((await fs.lstat(dist)).isSymbolicLink()) throw new Error('dist cannot be a link');
  const index = path.join(dist, 'index.html');
  await fs.writeFile(index, publicationHtml(await fs.readFile(index, 'utf8')));
  const files = await siteManifest(dist);
  const output = path.join(project, 'outputs', 'ci-package');
  await fs.mkdir(output, {recursive: true});
  const archive = path.join(output, 'site.tar.gz');
  const tar = process.platform === 'win32' ? path.join(process.env.SystemRoot || 'C:/Windows', 'System32', 'tar.exe') : 'tar';
  execFileSync(tar, ['-czf', archive, '-C', dist, '.'], {cwd: project, stdio: 'inherit', windowsHide: true});
  const bytes = await fs.readFile(archive);
  const result = {schema: 1, commit, publicUrl: PUBLIC_URL, files, archive: {bytes: bytes.length, sha256: sha256(bytes)}};
  await fs.writeFile(path.join(output, 'manifest.json'), JSON.stringify(result, null, 2) + '\n');
  console.log(`Packaged ${files.length} public files for ${commit}`);
  return result;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  packageSite(process.argv[2]).catch(error => {console.error(error.message); process.exitCode = 1;});
}
