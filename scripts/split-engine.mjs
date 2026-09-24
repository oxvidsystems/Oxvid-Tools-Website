// One-time (re-runnable) refactor: splits the monolithic src/core/engine.js
// into engine-core.js (shared helpers + data, always loaded) plus nine
// engine-<category>.js files (one per tool category), each containing only
// that category's tool implementations and its own local DISPATCH map.
// ToolWorkspace.jsx then dynamically imports just the visited tool's
// category chunk instead of all 145 tools' code up front.
//
// Classification is done by static AST analysis (which top-level names does
// each DISPATCH-registered tool transitively reference?), not by guessing
// from comments, specifically because this file has real cross-category
// helpers (e.g. loadCdnScript is used by both Generators and PDF tools).
import { readFileSync, writeFileSync } from 'node:fs';
import * as acorn from 'acorn';

const SRC_PATH = new URL('../src/core/engine.js', import.meta.url);
const OUT_DIR = new URL('../src/core/', import.meta.url);
const src = readFileSync(SRC_PATH, 'utf8');
const ast = acorn.parse(src, { ecmaVersion: 'latest', sourceType: 'module' });

const decls = new Map(); // name -> { node, start, end }
let dispatchNode = null;

for (const node of ast.body) {
  if (node.type === 'FunctionDeclaration' && node.id) {
    decls.set(node.id.name, { node, start: node.start, end: node.end });
  } else if (node.type === 'VariableDeclaration') {
    for (const d of node.declarations) {
      if (d.id.type === 'Identifier') {
        if (d.id.name === 'DISPATCH') dispatchNode = d.init;
        decls.set(d.id.name, { node, start: node.start, end: node.end });
      }
    }
  }
}

function collectIdentifiers(node, out) {
  if (!node || typeof node !== 'object') return;
  if (Array.isArray(node)) {
    for (const n of node) collectIdentifiers(n, out);
    return;
  }
  if (node.type === 'Identifier') {
    out.add(node.name);
    return;
  }
  for (const key in node) {
    if (key === 'start' || key === 'end' || key === 'loc' || key === 'range') continue;
    const val = node[key];
    if (val && typeof val === 'object') collectIdentifiers(val, out);
  }
}

const refsOf = new Map();
for (const [name, info] of decls) {
  const ids = new Set();
  collectIdentifiers(info.node, ids);
  ids.delete(name);
  refsOf.set(name, new Set([...ids].filter((id) => decls.has(id))));
}

const rawToolsStart = src.indexOf('const RAW_TOOLS = [');
const bStart = src.indexOf('[', rawToolsStart);
const bEnd = src.indexOf('\n];', bStart);
const RAW_TOOLS = new Function(`return ${src.slice(bStart, bEnd + 2)}`)();
const categoryOf = new Map(RAW_TOOLS.map(([id, , category]) => [id, category]));

function identifiersInExpr(node) {
  const out = new Set();
  collectIdentifiers(node, out);
  return [...out].filter((id) => decls.has(id));
}

const entryPointCategories = new Map();
const dispatchByCategory = new Map(); // category -> [ [toolId, sourceText], ... ]
for (const prop of dispatchNode.properties) {
  const toolId = prop.key.type === 'Literal' ? prop.key.value : prop.key.name;
  const category = categoryOf.get(toolId);
  if (!category) continue;
  const entryIds = identifiersInExpr(prop.value);
  for (const id of entryIds) {
    if (!entryPointCategories.has(id)) entryPointCategories.set(id, new Set());
    entryPointCategories.get(id).add(category);
  }
  if (!dispatchByCategory.has(category)) dispatchByCategory.set(category, []);
  dispatchByCategory.get(category).push([toolId, src.slice(prop.value.start, prop.value.end)]);
}

const ALWAYS_CORE = new Set([
  'CATEGORIES', 'PLATFORM_META', 'TOOLS', 'CAT_BY_KEY', 'isLive', 'esc',
  'toolsInCategory', 'svgIcon', 'toast', 'TOOL_BY_SLUG', 'genHowTo',
  'genFeatures', 'genFaq', 'relatedTools', 'KW_COUNTRIES', 'KW_LANGS',
  'renderSoon', 'RAW_TOOLS', 'qs', 'qsa', 'h', 'download', 'copyText',
  'fmtBytes', 'fmtNum', 'clamp', 'debounce', 'slugify',
  'SOON', 'SOON_REASON', 'CAT_HOWTO', 'CAT_FEATURES',
]);
// basicIndent is genuinely dead code (defined, never called). DISPATCH is
// the old monolithic map being replaced by a per-category DISPATCH export
// in each engine-<category>.js file below — it must not be emitted anywhere
// itself, since its object literal references every category's functions.
const DEAD_CODE = new Set(['basicIndent', 'DISPATCH']);

const categorySets = new Map();
for (const name of decls.keys()) categorySets.set(name, new Set());
for (const [name, cats] of entryPointCategories) {
  for (const c of cats) categorySets.get(name).add(c);
}
for (const name of ALWAYS_CORE) {
  if (decls.has(name)) categorySets.get(name).add('__core__');
}

let changed = true;
let iterations = 0;
while (changed && iterations < 50) {
  changed = false;
  iterations++;
  for (const [name, refs] of refsOf) {
    const myCats = categorySets.get(name);
    if (myCats.size === 0) continue;
    for (const dep of refs) {
      const depCats = categorySets.get(dep);
      const before = depCats.size;
      for (const c of myCats) depCats.add(c);
      if (depCats.size !== before) changed = true;
    }
  }
}

const CATEGORY_KEYS = ['pdf', 'image', 'text', 'dev', 'calc', 'seo', 'finance', 'gen', 'color'];
const bucketOf = new Map(); // name -> 'core' | category key
for (const [name, cats] of categorySets) {
  if (DEAD_CODE.has(name)) continue;
  if (cats.size === 0 || cats.has('__core__') || cats.size > 1) bucketOf.set(name, 'core');
  else bucketOf.set(name, [...cats][0]);
}

// Group names into their bucket, preserving original source order, and
// de-duplicating statement nodes shared by multiple names (e.g. `let a=1,b=2;`).
const namesByBucket = new Map();
for (const key of ['core', ...CATEGORY_KEYS]) namesByBucket.set(key, []);
for (const [name, bucket] of bucketOf) namesByBucket.get(bucket).push(name);
for (const key of namesByBucket.keys()) {
  namesByBucket.get(key).sort((a, b) => decls.get(a).start - decls.get(b).start);
}

function emitStatements(names) {
  const seenStarts = new Set();
  const parts = [];
  for (const name of names) {
    const { start, end } = decls.get(name);
    if (seenStarts.has(start)) continue;
    seenStarts.add(start);
    parts.push(src.slice(start, end));
  }
  return parts.join('\n\n');
}

// --- engine-core.js ---
const coreNames = namesByBucket.get('core');
const coreBody = emitStatements(coreNames);
const coreExports = coreNames.filter((n) => n !== 'toastTimer'); // internal-only
writeFileSync(
  new URL('engine-core.js', OUT_DIR),
  `/* Oxvid Tools engine — shared core: helpers, tool/category data, and the
   generic render engines (calculator/text/image workspaces) used across
   multiple categories. Extracted by scripts/split-engine.mjs; re-run it if
   engine.js's tool implementations change. */\n\n${coreBody}\n\nexport {\n${coreExports
    .map((n) => `  ${n},`)
    .join('\n')}\n};\n`,
);

// --- per-category files ---
for (const category of CATEGORY_KEYS) {
  const names = namesByBucket.get(category);
  const body = emitStatements(names);

  const usedCoreDeps = new Set();
  for (const name of names) {
    for (const dep of refsOf.get(name) || []) {
      if (bucketOf.get(dep) === 'core') usedCoreDeps.add(dep);
    }
  }

  const dispatchEntries = (dispatchByCategory.get(category) || [])
    .map(([id, text]) => `  '${id}': ${text},`)
    .join('\n');

  const importLine = usedCoreDeps.size
    ? `import {\n${[...usedCoreDeps].sort().map((n) => `  ${n},`).join('\n')}\n} from './engine-core.js';\n\n`
    : '';

  writeFileSync(
    new URL(`engine-${category}.js`, OUT_DIR),
    `/* Oxvid Tools engine — ${category} category. Extracted by
   scripts/split-engine.mjs; re-run it if engine.js's tool implementations
   change. Loaded on demand by ToolWorkspace.jsx only when a tool from this
   category is visited. */\n\n${importLine}${body}\n\nexport const DISPATCH = {\n${dispatchEntries}\n};\n`,
  );
}

console.log('split-engine: wrote engine-core.js +', CATEGORY_KEYS.length, 'category files');
for (const key of ['core', ...CATEGORY_KEYS]) {
  console.log(` ${key}: ${namesByBucket.get(key).length} names`);
}
