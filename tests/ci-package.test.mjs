import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {publicationHtml, siteManifest, sha256} from '../scripts/ci/package.mjs';

const oldBase = 'https://perso.telecom-paristech.fr/vwoelffel-23/';
const html = `<link rel="canonical" href="${oldBase}"><meta property="og:url" content="${oldBase}"><meta property="og:image" content="${oldBase}assets/social-card.png"><p>Personal content stays intact.</p>`;

test('production metadata changes the site URL while preserving the page content', () => {
  const output = publicationHtml(html);
  assert.ok(output.includes('<p>Personal content stays intact.</p>'));
  assert.ok(!output.includes(oldBase));
  assert.equal(publicationHtml(output), output);
  assert.throws(() => publicationHtml('<html>metadata missing</html>'));
});

async function fixture(t) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'portfolio-ci-test-'));
  t.after(async () => {
    const actual = await fs.realpath(root);
    const temporary = await fs.realpath(os.tmpdir());
    if (path.dirname(actual) !== temporary || !path.basename(actual).startsWith('portfolio-ci-test-')) throw new Error('Unexpected cleanup target');
    await fs.rm(actual, {recursive: true, force: true});
  });
  for (const name of ['index.html', 'app.bundle.js', 'details.bundle.js', 'styles.css', 'project-details.css', 'preferences.js']) await fs.writeFile(path.join(root, name), name);
  await fs.mkdir(path.join(root, 'assets'));
  await fs.writeFile(path.join(root, 'assets', 'demo.js'), 'demo');
  return root;
}

test('public manifest records exact byte counts and SHA-256 for assets', async t => {
  const root = await fixture(t);
  const result = await siteManifest(root);
  assert.equal(result.length, 7);
  assert.deepEqual(result.find(file => file.path === 'assets/demo.js'), {path: 'assets/demo.js', bytes: 4, sha256: sha256(Buffer.from('demo'))});
});

test('unexpected repository files and hidden credentials cannot be packaged', async t => {
  const root = await fixture(t);
  await fs.writeFile(path.join(root, '.env'), 'not-a-real-secret');
  await assert.rejects(siteManifest(root), /Hidden/);
  await fs.unlink(path.join(root, '.env'));
  await fs.writeFile(path.join(root, 'AGENTS.md'), 'not public');
  await assert.rejects(siteManifest(root), /Unexpected/);
});

test('missing required files stop packaging', async t => {
  const root = await fixture(t);
  await fs.unlink(path.join(root, 'app.bundle.js'));
  await assert.rejects(siteManifest(root), /Missing required/);
});

test('project detail resources must be present and nonempty before packaging', async t => {
  const root = await fixture(t);
  for (const name of ['details.bundle.js', 'project-details.css']) {
    const file = path.join(root, name);
    await fs.unlink(file);
    await assert.rejects(siteManifest(root), /Missing required/);
    await fs.writeFile(file, '');
    await assert.rejects(siteManifest(root), /Missing required/);
    await fs.writeFile(file, name);
  }
  assert.equal((await siteManifest(root)).length, 7);
});
