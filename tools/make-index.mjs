#!/usr/bin/env node
/*
 * make-index.mjs
 *
 * Scans this folder for question files (.mtbq), test files (.mtbt) and .json files made with
 * Export in the math test builder, and writes index.json, the list of files that the program
 * reads when you add the bank by its address.
 *
 * Needs Node.js 18 or newer. No other packages.
 *
 * Usage
 *   node tools/make-index.mjs                 writes ./index.json (commit it)
 *   node tools/make-index.mjs --out _site     copies the files to _site/ and writes _site/index.json
 *                                             (used by the GitHub Actions workflow, nothing to commit)
 *   --name "Bank name"          the name of the bank (otherwise the name in the current index.json)
 *   --description "Text"        a short description shown next to the name
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

const SKIP = new Set(['node_modules', 'tools', '_site', 'index.json', 'package.json', 'package-lock.json']);
const found = [];
(function walk(dir) {
  for (const e of readdirSync(dir).sort()) {
    if (e.startsWith('.') || SKIP.has(e)) continue;
    const p = join(dir, e);
    const st = statSync(p);
    if (st.isDirectory()) walk(p);
    else if (/\.(mtbq|mtbt|json)$/i.test(e)) found.push(p);
  }
})(src);

let nq = 0, nt = 0, bad = 0;
const ids = new Map();
const files = [];
for (const p of found) {
  const rel = relative(src, p).split(sep).join('/');
  let j;
  try {
    j = JSON.parse(readFileSync(p, 'utf8'));
  } catch (e) {
    console.error('Skipped ' + rel + ': not valid JSON.');
    bad++;
    continue;
  }
  if (j && j.app === 'mtb-bank-enc') {
    console.error('Skipped ' + rel + ': encrypted files are not supported inside an index.');
    bad++;
    continue;
  }
  const qs = Array.isArray(j) ? j : j && (j.questions || j.pool);
  const ts = j && !Array.isArray(j) && Array.isArray(j.tests) ? j.tests : [];
  if (!Array.isArray(qs) && !ts.length) {
    console.error('Skipped ' + rel + ': no questions or tests in it.');
    bad++;
    continue;
  }
  (Array.isArray(qs) ? qs : []).forEach((q) => {
    nq++;
    if (q && q.id != null) {
      if (ids.has(q.id)) console.error('Note: the question id ' + q.id + ' is in both ' + ids.get(q.id) + ' and ' + rel + '. Only the first one is used.');
      else ids.set(q.id, rel);
    }
  });
  nt += ts.length;
  files.push(rel);
}

let old = {};
const oldPath = join(src, 'index.json');
if (existsSync(oldPath)) {
  try { old = JSON.parse(readFileSync(oldPath, 'utf8')) || {}; } catch (e) { /* ignore */ }
}
const index = {
  app: 'mtb-bank-index',
  v: 1,
  name: name ?? old.name ?? 'My question bank',
  description: description ?? old.description ?? '',
  files,
};

if (out) {
  for (const rel of files) {
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
console.log(files.length + ' file' + (files.length === 1 ? '' : 's') + ', ' + nq + ' question' + (nq === 1 ? '' : 's') + ', ' + nt + ' test' + (nt === 1 ? '' : 's') + (bad ? ', ' + bad + ' skipped' : '') + '.');

function fail(msg) {
  console.error(msg);
  process.exit(1);
}
