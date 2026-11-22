#!/usr/bin/env node
/*
 * make-index.mjs
 *
 * ONLY needed if the bank is NOT on GitHub (or the repository is private). Math test builder reads
 * a public GitHub repository directly, so on GitHub you do not need this script or any index file.
 *
 * Writes index.json, the list of files that the program reads when you add the bank by its address.
 * Every folder on the top level is its own bank. Files in the root and in the folders questions and
 * tests belong to the main bank. A bank.json file in a folder (or in the root) can give the bank a
 * name and a description:  { "name": "Algebra", "description": "Equations and functions" }
 *
 * Needs Node.js 18 or newer. No other packages.
 *
 * Usage
 *   node tools/make-index.mjs                 writes ./index.json (upload it with the files)
 *   node tools/make-index.mjs --out _site     copies the files to _site/ and writes _site/index.json
 *   --name "Bank name"          the name of the main bank (when there is only one bank)
 *   --description "Text"        its description
 *
 * Folders that start with a dot, node_modules, tools and _site are skipped.
 */
import { readFileSync, writeFileSync, readdirSync, statSync, mkdirSync, copyFileSync, existsSync } from 'node:fs';
import { join, relative, dirname, sep } from 'node:path';

const args = process.argv.slice(2);
let src = '.', out = '', name, description;
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--src') src = args[++i];
  else if (args[i] === '--out') out = args[++i];
  else if (args[i] === '--name') name = args[++i];
  else if (args[i] === '--description') description = args[++i];
  else fail('Unknown option ' + args[i]);
}

const SKIP = new Set(['node_modules', 'tools', '_site']);
const RESERVED = new Set(['questions', 'tests', 'tools', '_site', 'node_modules']);
const NOT_BANK_FILE = /^(index|package|package-lock|bank)\.json$/i;
const found = [];
(function walk(dir) {
  for (const e of readdirSync(dir).sort()) {
    if (e.startsWith('.') || SKIP.has(e)) continue;
    const p = join(dir, e);
    if (statSync(p).isDirectory()) walk(p);
    else found.push(p);
  }
})(src);

const groups = new Map();
const get = (id) => {
  if (!groups.has(id)) groups.set(id, { id, files: [], meta: {} });
  return groups.get(id);
};
let nq = 0, nt = 0, bad = 0;
const ids = new Map();
for (const p of found) {
  const rel = relative(src, p).split(sep).join('/');
  const parts = rel.split('/');
  const top = parts.length > 1 && !RESERVED.has(parts[0]) ? parts[0] : '';
  const file = parts[parts.length - 1];
  if (/^bank\.json$/i.test(file) && ((top && parts.length === 2) || (!top && parts.length === 1))) {
    try { get(top).meta = JSON.parse(readFileSync(p, 'utf8')) || {}; } catch (e) { console.error('Skipped ' + rel + ': not valid JSON.'); }
    continue;
  }
  if (!/\.(mtbq|mtbt|json)$/i.test(file) || NOT_BANK_FILE.test(file)) continue;
  let j;
  try { j = JSON.parse(readFileSync(p, 'utf8')); } catch (e) { console.error('Skipped ' + rel + ': not valid JSON.'); bad++; continue; }
  if (j && j.app === 'mtb-bank-enc') { console.error('Skipped ' + rel + ': encrypted files are not supported inside an index.'); bad++; continue; }
  const qs = Array.isArray(j) ? j : j && (j.questions || j.pool);
  const ts = j && !Array.isArray(j) && Array.isArray(j.tests) ? j.tests : [];
  if (!Array.isArray(qs) && !ts.length) { console.error('Skipped ' + rel + ': no questions or tests in it.'); bad++; continue; }
  (Array.isArray(qs) ? qs : []).forEach((q) => {
    nq++;
    if (q && q.id != null) {
      if (ids.has(q.id)) console.error('Note: the question id ' + q.id + ' is in both ' + ids.get(q.id) + ' and ' + rel + '. Only the first one is used.');
      else ids.set(q.id, rel);
    }
  });
  nt += ts.length;
  get(top).files.push(rel);
}

let old = {};
const oldPath = join(src, 'index.json');
if (existsSync(oldPath)) { try { old = JSON.parse(readFileSync(oldPath, 'utf8')) || {}; } catch (e) { /* ignore */ } }

const list = [...groups.values()].filter((g) => g.files.length);
let index;
if (list.length > 1 || (list.length === 1 && list[0].id !== '')) {
  index = {
    app: 'mtb-bank-index',
    v: 1,
    banks: list.map((g) => ({
      id: g.id || 'main',
      name: g.meta.name || (g.id ? g.id.replace(/[-_]+/g, ' ').replace(/^./, (c) => c.toUpperCase()) : (name ?? old.name ?? 'Main bank')),
      description: g.meta.description || '',
      files: g.files,
    })),
  };
} else {
  const g = list[0] || { files: [], meta: {} };
  index = {
    app: 'mtb-bank-index',
    v: 1,
    name: name ?? g.meta.name ?? old.name ?? 'My question bank',
    description: description ?? g.meta.description ?? old.description ?? '',
    files: g.files,
  };
}

const all = list.flatMap((g) => g.files);
if (out) {
  for (const rel of all) {
    const to = join(out, rel);
    mkdirSync(dirname(to), { recursive: true });
    copyFileSync(join(src, rel), to);
  }
  mkdirSync(out, { recursive: true });
  writeFileSync(join(out, 'index.json'), JSON.stringify(index, null, 1));
  writeFileSync(join(out, '.nojekyll'), '');
  console.log('Wrote ' + join(out, 'index.json'));
} else {
  writeFileSync(join(src, 'index.json'), JSON.stringify(index, null, 1) + '\n');
  console.log('Wrote ' + join(src, 'index.json'));
}
console.log(list.length + ' bank' + (list.length === 1 ? '' : 's') + ', ' + all.length + ' file' + (all.length === 1 ? '' : 's') + ', ' + nq + ' question' + (nq === 1 ? '' : 's') + ', ' + nt + ' test' + (nt === 1 ? '' : 's') + (bad ? ', ' + bad + ' skipped' : '') + '.');

function fail(msg) {
  console.error(msg);
  process.exit(1);
}
