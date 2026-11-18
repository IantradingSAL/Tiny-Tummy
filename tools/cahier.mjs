#!/usr/bin/env node
/*
 * Tiny Tummy — cahier des charges: build, version archive and rollback.
 *
 *   node tools/cahier.mjs build              build cahier/*.md → PDF + Word, archive
 *                                            it as cahier/versions/<version>/ and make
 *                                            it the current version
 *   node tools/cahier.mjs build --src <dir>  same, from sources in another folder
 *   node tools/cahier.mjs rollback V1.0      make an archived version current again
 *                                            (nothing is deleted; roll forward the same way)
 *   node tools/cahier.mjs list               show every version and which is current
 *
 * The version and date come from each .md's front matter (version: / date:).
 * The current version is always published at fixed names in cahier/, so the
 * home page download link never changes:
 *   cahier/TINYTUMMY_CAHIER_DES_CHARGES_FR.{pdf,docx}
 *   cahier/TINYTUMMY_SPECIFICATION_EN.{pdf,docx}
 * `build` needs pandoc and Playwright; `rollback` and `list` need only Node.
 */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIR = path.join(ROOT, 'cahier');
const MANIFEST = path.join(DIR, 'versions.json');
const DOCS = {
  fr: { base: 'TINYTUMMY_CAHIER_DES_CHARGES_FR', label: 'Cahier des charges', page: 'page', of: 'sur' },
  en: { base: 'TINYTUMMY_SPECIFICATION_EN', label: 'Specification', page: 'page', of: 'of' },
};
const EXTS = ['md', 'pdf', 'docx'];

const rel = (p) => path.relative(ROOT, p).split(path.sep).join('/');
const fail = (msg) => { console.error('✗ ' + msg); process.exit(1); };

function readManifest() {
  if (!fs.existsSync(MANIFEST)) return { current: null, versions: [] };
  return JSON.parse(fs.readFileSync(MANIFEST, 'utf8'));
}
function writeManifest(m) {
  m.versions.sort((a, b) => cmpVersion(b.version, a.version));
  fs.writeFileSync(MANIFEST, JSON.stringify(m, null, 2) + '\n');
}
function cmpVersion(a, b) {
  const pa = a.replace(/^V/i, '').split('.').map(Number);
  const pb = b.replace(/^V/i, '').split('.').map(Number);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const d = (pa[i] || 0) - (pb[i] || 0);
    if (d) return d;
  }
  return 0;
}
function frontMatter(file) {
  const t = fs.readFileSync(file, 'utf8');
  const m = t.match(/^---\n([\s\S]*?)\n---/);
  if (!m) fail(`${rel(file)}: missing front matter (version:, date:)`);
  const get = (k) => (m[1].match(new RegExp('^' + k + ':\\s*"?([^"\\n]+)"?', 'm')) || [])[1];
  const version = get('version'), date = get('date');
  if (!/^V\d+\.\d+$/.test(version || '')) fail(`${rel(file)}: version must look like V1.2`);
  if (!/^\d{2}\/\d{2}\/\d{4}$/.test(date || '')) fail(`${rel(file)}: date must look like 18/11/2026`);
  return { version, date };
}
const isoDate = (d) => d.split('/').reverse().join('-');

/* Publish an archived version at the fixed "current" names. */
function publishCurrent(version, { restoreSources = false } = {}) {
  const vdir = path.join(DIR, 'versions', version);
  for (const { base } of Object.values(DOCS)) {
    for (const ext of EXTS) {
      const src = path.join(vdir, `${base}.${ext}`);
      if (!fs.existsSync(src)) fail(`missing ${rel(src)}`);
      if (ext === 'md' && !restoreSources) continue;
      fs.copyFileSync(src, path.join(DIR, `${base}.${ext}`));
    }
  }
}

const PDF_CSS = `
@page { size: A4; margin: 18mm 17mm 20mm; }
body { font-family: 'Quicksand','Segoe UI',system-ui,sans-serif; color:#22333d; font-size:10.5pt; line-height:1.55; max-width:none; margin:0; padding:0; }
h1,h2,h3 { font-family:'Baloo 2','Quicksand',sans-serif; color:#17455e; line-height:1.2; page-break-after:avoid; }
h1 { font-size:20pt; margin:22pt 0 8pt; border-bottom:3px solid #f0b64b; padding-bottom:4pt; }
h1:first-of-type { margin-top:0; }
h2 { font-size:14pt; margin:16pt 0 6pt; }
h3 { font-size:12pt; margin:14pt 0 4pt; }
p, li { orphans:3; widows:3; }
strong { color:#17455e; }
table { border-collapse:collapse; width:100%; margin:8pt 0 12pt; font-size:9.5pt; page-break-inside:avoid; }
th { background:#17455e; color:#fff; text-align:left; padding:5pt 7pt; }
td { border-bottom:1px solid #e7e1d2; padding:5pt 7pt; vertical-align:top; }
tr:nth-child(even) td { background:#fbf8f1; }
code { font-size:9pt; background:#f3efe4; padding:0 3pt; border-radius:3px; }
hr { border:none; border-top:1px solid #e7e1d2; margin:16pt 0; }
header#title-block-header { display:none; }
.cover { background:#123c56; color:#fff; border-radius:10px; padding:18pt 20pt; margin-bottom:16pt; display:flex; align-items:center; gap:16pt; }
.cover img { height:48px; }
.cover b { color:#f0b64b; font-size:13pt; }
`;

async function buildPdf(htmlFile, pdfFile, footer) {
  const require = createRequire(import.meta.url);
  let chromium;
  try { ({ chromium } = require('playwright')); }
  catch { fail('Playwright is needed to build the PDF (npm i -D playwright)'); }
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('file://' + htmlFile, { waitUntil: 'load' });
  await page.pdf({
    path: pdfFile, format: 'A4', printBackground: true,
    displayHeaderFooter: true,
    headerTemplate: '<span></span>',
    footerTemplate: `<div style="font-family:sans-serif;font-size:8px;color:#64808e;width:100%;padding:0 17mm;display:flex;justify-content:space-between">
      <span>${footer}</span><span><span class="pageNumber"></span> / <span class="totalPages"></span></span></div>`,
    margin: { top: '18mm', bottom: '20mm', left: '17mm', right: '17mm' },
  });
  await browser.close();
}

async function build(srcDir) {
  const metas = {};
  for (const [lang, d] of Object.entries(DOCS)) {
    const f = path.join(srcDir, `${d.base}.md`);
    if (!fs.existsSync(f)) fail(`missing ${f}`);
    metas[lang] = frontMatter(f);
  }
  if (metas.fr.version !== metas.en.version || metas.fr.date !== metas.en.date)
    fail(`FR (${metas.fr.version} ${metas.fr.date}) and EN (${metas.en.version} ${metas.en.date}) must carry the same version and date`);
  const { version, date } = metas.fr;
  const vdir = path.join(DIR, 'versions', version);
  fs.mkdirSync(vdir, { recursive: true });
  const logo = path.join(ROOT, 'images', 'tt-logo.png');
  const tmp = fs.mkdtempSync(path.join(fs.realpathSync(path.join(ROOT, 'cahier')), '.build-'));
  try {
    fs.writeFileSync(path.join(tmp, 'style.css'), PDF_CSS);
    for (const [lang, d] of Object.entries(DOCS)) {
      const md = path.join(vdir, `${d.base}.md`);
      if (path.resolve(srcDir, `${d.base}.md`) !== md) fs.copyFileSync(path.join(srcDir, `${d.base}.md`), md);
      execFileSync('pandoc', [md, '-o', path.join(vdir, `${d.base}.docx`)]);
      const cover = `<div class="cover">${fs.existsSync(logo) ? `<img src="file://${logo}">` : ''}<div><b>Tiny Tummy</b><br>${d.label} · ${version} · ${date}</div></div>`;
      fs.writeFileSync(path.join(tmp, 'cover.html'), cover);
      const html = path.join(tmp, `${lang}.html`);
      execFileSync('pandoc', [md, '-s', '-o', html, '--css', path.join(tmp, 'style.css'),
        '-B', path.join(tmp, 'cover.html'), '--metadata', 'pagetitle=' + `Tiny Tummy — ${d.label} ${version}`]);
      await buildPdf(html, path.join(vdir, `${d.base}.pdf`), `Tiny Tummy — ${d.label} ${version} — ${date}`);
      console.log(`✓ ${version} ${lang.toUpperCase()}: ${rel(vdir)}/${d.base}.{md,docx,pdf}`);
    }
  } finally { fs.rmSync(tmp, { recursive: true, force: true }); }

  const m = readManifest();
  const files = (base) => Object.fromEntries(['pdf', 'docx'].map((e) => [e, `cahier/versions/${version}/${base}.${e}`]));
  const entry = { version, date: isoDate(date), fr: files(DOCS.fr.base), en: files(DOCS.en.base) };
  m.versions = m.versions.filter((v) => v.version !== version).concat(entry);
  m.current = version;
  writeManifest(m);
  publishCurrent(version);
  console.log(`✓ ${version} is now the current version (home page + fixed download links)`);
}

function rollback(version) {
  if (!version) fail('usage: node tools/cahier.mjs rollback V1.0');
  version = version.toUpperCase().startsWith('V') ? 'V' + version.slice(1) : 'V' + version;
  const m = readManifest();
  if (!m.versions.some((v) => v.version === version))
    fail(`${version} is not archived. Known: ${m.versions.map((v) => v.version).join(', ')}`);
  const from = m.current;
  publishCurrent(version, { restoreSources: true });
  m.current = version;
  m.history = (m.history || []).concat({ at: new Date().toISOString(), from, to: version });
  writeManifest(m);
  console.log(`✓ current version: ${from} → ${version}. The sources in cahier/ are now ${version}'s;`);
  console.log(`  ${from} stays archived and can be restored with: node tools/cahier.mjs rollback ${from}`);
}

function list() {
  const m = readManifest();
  for (const v of m.versions) console.log(`${v.version === m.current ? '●' : ' '} ${v.version}  ${v.date}`);
}

const [cmd, ...args] = process.argv.slice(2);
if (cmd === 'build') {
  const i = args.indexOf('--src');
  await build(i >= 0 ? path.resolve(args[i + 1]) : DIR);
} else if (cmd === 'rollback') rollback(args[0]);
else if (cmd === 'list') list();
else { console.log('usage: node tools/cahier.mjs build [--src dir] | rollback <version> | list'); process.exit(cmd ? 1 : 0); }
