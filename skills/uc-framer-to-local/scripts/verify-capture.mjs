#!/usr/bin/env node
// Checks a Framer capture folder for completeness against its manifest.
//
//   node verify-capture.mjs <capture-dir>                 all checks
//   node verify-capture.mjs <capture-dir> --only export   one phase: manifest | export | live | report
//   node verify-capture.mjs <capture-dir> --widths        print the width matrix per live URL
//
// Exits 1 when any check fails. Warnings never fail the run.

import fs from 'node:fs';
import path from 'node:path';

const AUDIT_WIDTHS = [1440, 1200, 1024, 810, 390];

// Headings the consolidated report must contain, in this order.
export const REPORT_SECTIONS = [
  'Run',
  'Route map',
  'Breakpoints',
  'Color',
  'Typography',
  'Fonts',
  'Components',
  'Pages',
  'Motion',
  'Interaction states',
  'CMS',
  'Content not in the CMS',
  'Site settings and head',
  'Keep, drop or fix',
  'Conflicts',
  'Gaps',
  'Decisions needed',
];

const MOTION_COLUMNS = ['element', 'trigger', 'from', 'to', 'duration', 'easing', 'delay', 'loop', 'source'];

// Framer writes lengths as "1200px"; accept numbers too.
const px = (v) => (typeof v === 'number' ? v : Number.parseFloat(v));

// Every width a page is captured at: each canvas width, both sides of each
// breakpoint edge, and the audit widths.
export function widthsFor(page) {
  const widths = new Set(AUDIT_WIDTHS);
  for (const bp of page.breakpoints) {
    widths.add(px(bp.canvasWidth));
    if (bp.minWidth > 0) {
      widths.add(Math.ceil(bp.minWidth));
      widths.add(Math.ceil(bp.minWidth) - 1);
    }
  }
  return [...widths].sort((a, b) => b - a);
}

const args = process.argv.slice(2);
const dir = args.find((a) => !a.startsWith('--'));
const only = args.includes('--only') ? args[args.indexOf('--only') + 1] : null;

if (!dir) {
  console.error('usage: verify-capture.mjs <capture-dir> [--only manifest|export|live|report] [--widths]');
  process.exit(2);
}

const failures = [];
const warnings = [];
const fail = (where, msg) => failures.push(`${where}: ${msg}`);
const warn = (where, msg) => warnings.push(`${where}: ${msg}`);
const at = (...p) => path.join(dir, ...p);

function readJson(rel) {
  const file = at(rel);
  if (!fs.existsSync(file)) {
    fail(rel, 'missing');
    return null;
  }
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (err) {
    fail(rel, `not valid JSON (${err.message})`);
    return null;
  }
}

// Every value in a JSON tree, depth first.
function* walk(value) {
  yield value;
  if (value && typeof value === 'object') {
    for (const child of Object.values(value)) yield* walk(child);
  }
}

// ---------------------------------------------------------------- manifest

const manifest = readJson('manifest.json');
if (!manifest) {
  report();
}

const pages = manifest.pages ?? [];
const livePages = pages.filter((p) => !p.draft);
const urls = livePages.flatMap((p) => (p.urls ?? []).map((u) => ({ ...u, page: p })));

if (args.includes('--widths')) {
  const matrix = Object.fromEntries(urls.map((u) => [u.slug, widthsFor(u.page)]));
  console.log(JSON.stringify(matrix, null, 2));
  process.exit(0);
}

function checkManifest() {
  if (!manifest.site?.url) fail('manifest.json', 'site.url missing');
  if (!manifest.site?.projectId) fail('manifest.json', 'site.projectId missing');
  if (!pages.length) fail('manifest.json', 'pages is empty');
  if (!Array.isArray(manifest.sitemap)) fail('manifest.json', 'sitemap missing');

  for (const p of pages) {
    const where = `manifest.json pages[${p.slug}]`;
    if (!p.nodeId || !p.path || !p.slug) fail(where, 'needs nodeId, path and slug');
    if (!p.breakpoints?.length) {
      fail(where, 'no breakpoints');
      continue;
    }
    if (p.breakpoints.filter((b) => b.isPrimary).length !== 1) fail(where, 'needs exactly one primary breakpoint');
    for (const b of p.breakpoints) {
      if (Number.isNaN(px(b.canvasWidth))) fail(where, `breakpoint ${b.name} has no canvasWidth`);
      if (typeof b.minWidth !== 'number') fail(where, `breakpoint ${b.name} has no minWidth`);
    }
    if (!p.draft && !p.urls?.length) fail(where, 'published page maps to no live URL');
  }

  const mapped = new Set(urls.map((u) => u.url));
  for (const loc of manifest.sitemap ?? []) {
    if (!mapped.has(loc)) fail('manifest.json', `sitemap URL ${loc} maps to no page`);
  }
}

// ------------------------------------------------------------------ export

function checkExport() {
  for (const c of manifest.collections ?? []) {
    const rel = `export/cms/${c.slug}.json`;
    const cms = readJson(rel);
    if (!cms) continue;
    const items = cms.items ?? [];
    if (items.length !== c.itemCount) fail(rel, `${items.length} items, the project has ${c.itemCount}`);
    if (cms.collection?.itemCount !== undefined && cms.collection.itemCount !== items.length) {
      fail(rel, `collection.itemCount ${cms.collection.itemCount} disagrees with ${items.length} items`);
    }
    for (const f of cms.fields ?? []) {
      if (f.type === 'enum' && !f.enumCases?.length) fail(rel, `enum field ${f.name} has no enumCases`);
      if (/collectionReference/i.test(f.type) && !f.referenceTarget) fail(rel, `reference field ${f.name} has no referenceTarget`);
    }
    const noAlt = [...walk(items)].filter((v) => v && typeof v === 'object' && 'assetId' in v && !v.alt).length;
    if (noAlt) warn(rel, `${noAlt} images have no alt text; list them under Decisions needed`);
  }

  const localIds = new Set();
  for (const c of manifest.components ?? []) {
    const rel = `export/components/${c.slug}.json`;
    const comp = readJson(rel);
    if (!comp) continue;
    localIds.add(c.nodeId);
    if (!comp.propertyControls) fail(rel, 'propertyControls missing');
    if (!comp.variants?.length) fail(rel, 'no variants');
  }
  const external = readJson('export/components/_external-and-code-components.json');
  const externalIds = new Set(Object.keys(external?.usedComponents ?? {}));
  for (const [id, c] of Object.entries(external?.usedComponents ?? {})) {
    if (!c.propertyControls) fail('export/components/_external-and-code-components.json', `${id} has no propertyControls`);
  }

  for (const p of pages) {
    const rel = `export/pages/${p.slug}.json`;
    const page = readJson(rel);
    if (!page) continue;
    const bps = page.page?.breakpoints ?? [];
    if (bps.length !== p.breakpoints.length) fail(rel, `${bps.length} breakpoints, the manifest has ${p.breakpoints.length}`);
    for (const b of bps) {
      if (Number.isNaN(px(b.canvasWidth))) fail(rel, `breakpoint ${b.name} has no canvasWidth`);
      if (!b.isPrimary && !b.mediaQuery) fail(rel, `breakpoint ${b.name} has no mediaQuery`);
    }
    const overrides = page.breakpointOverrides ?? [];
    if (overrides.length < bps.length - 1) fail(rel, `${overrides.length} breakpoint override sets for ${bps.length - 1} non-primary breakpoints`);
    for (const inst of page.componentInstances ?? []) {
      if (inst.component && !localIds.has(inst.component) && !externalIds.has(inst.component)) {
        fail(rel, `instance ${inst.id} uses ${inst.component}, which has no component file`);
      }
    }
  }

  const assets = readJson('export/assets.json');
  if (assets) {
    const listed = new Set((assets.assets ?? []).map((a) => a.url));
    const seen = new Set();
    for (const sub of ['pages', 'components', 'cms']) {
      const folder = at('export', sub);
      if (!fs.existsSync(folder)) continue;
      for (const name of fs.readdirSync(folder).filter((n) => n.endsWith('.json'))) {
        const text = fs.readFileSync(path.join(folder, name), 'utf8');
        for (const m of text.matchAll(/https:\/\/framerusercontent\.com\/[^"'\s)\\?]+/g)) seen.add(m[0]);
      }
    }
    const missing = [...seen].filter((u) => !listed.has(u));
    if (missing.length) fail('export/assets.json', `${missing.length} asset URLs used in the export are not listed, e.g. ${missing[0]}`);
  }

  const settings = readJson('export/site-settings.json');
  if (settings) {
    for (const key of ['title', 'description', 'socialImage', 'favicon']) {
      if (!settings.rootMetadata?.[key]) warn('export/site-settings.json', `rootMetadata.${key} is empty`);
    }
    for (const key of ['redirects', 'locales']) {
      if (!(key in settings)) fail('export/site-settings.json', `${key} missing (may be empty, must be present)`);
    }
  }

  const text = readJson('export/styles/text-styles.json');
  if (text && !text.textStylePresets?.length) fail('export/styles/text-styles.json', 'no text style presets');
  readJson('export/styles/color-styles.json');
  readJson('export/fonts.json');
  checkScripts('export');
}

// -------------------------------------------------------------------- live

function checkLive() {
  const metadata = readJson('live/metadata.json');

  for (const u of urls) {
    const where = `live (${u.url})`;
    const meta = metadata?.[u.path];
    if (metadata && !meta) fail('live/metadata.json', `no entry for ${u.path}`);
    if (meta && !meta.title) fail('live/metadata.json', `${u.path} has no title`);
    if (meta && !meta.breakpoints?.length) fail('live/metadata.json', `${u.path} has no breakpoints`);
    if (meta?.breakpoints?.length && meta.breakpoints.length !== u.page.breakpoints.length) {
      warn('live/metadata.json', `${u.path} has ${meta.breakpoints.length} live breakpoints, the export has ${u.page.breakpoints.length}; record it under Conflicts`);
    }

    const rel = `live/computed/${u.slug}.json`;
    const computed = readJson(rel);
    if (computed) {
      for (const w of widthsFor(u.page)) {
        const view = computed.widths?.[w];
        if (!view) fail(rel, `no computed styles at width ${w}`);
        else if (view.error) fail(rel, `width ${w} recorded an error: ${view.error}`);
        else if (!view.sections?.length) fail(rel, `width ${w} has no sections`);
      }
    }

    const shots = at('live', 'screenshots');
    const missing = widthsFor(u.page).filter((w) => !fs.existsSync(path.join(shots, `${u.slug}-${w}.png`)));
    if (missing.length) fail(where, `missing screenshots at ${missing.join(', ')}`);
  }

  // One motion and one hover run per page template, on its representative URL.
  for (const p of livePages) {
    const rep = p.representativeUrl && urls.find((u) => u.url === p.representativeUrl);
    if (!rep) {
      fail(`manifest.json pages[${p.slug}]`, 'representativeUrl missing or not among its urls');
      continue;
    }
    for (const kind of ['anim', 'hover']) {
      const rel = `live/raw/${kind}-${rep.slug}.json`;
      const data = readJson(rel);
      if (data?.truncated && !data.summary) fail(rel, 'truncated without a summary');
    }
  }

  const hasPageEffect = pages.some((p) => p.breakpoints.some((b) => b.pageEffects));
  if (hasPageEffect) {
    const t = readJson('live/raw/transition.json');
    if (t && !t.frames?.length) fail('live/raw/transition.json', 'no animation-paused frames');
    if (t && !t.cssRules?.length) fail('live/raw/transition.json', 'no view-transition, @keyframes or @property rules');
  }

  checkScripts('live');
}

// Scripts must rerun on another machine: no absolute paths. A path only
// counts at the start of a string or token, so URLs and relative paths like
// src/tmp/ pass.
const ABSOLUTE_PATH = /(?:^|[\s"'`=(,])(?:\/(?:Users|home|var\/folders|tmp|private)\/|[A-Za-z]:[\\/]+(?:Users|Temp)[\\/])/m;

function checkScripts(phase) {
  const folder = at(phase, 'scripts');
  if (!fs.existsSync(folder) || !fs.readdirSync(folder).length) {
    fail(`${phase}/scripts`, 'missing: save every script the capture ran');
    return;
  }
  for (const name of fs.readdirSync(folder)) {
    const text = fs.readFileSync(path.join(folder, name), 'utf8');
    if (ABSOLUTE_PATH.test(text)) fail(`${phase}/scripts/${name}`, 'contains an absolute machine path');
  }
}

// ------------------------------------------------------------------ report

function checkReport() {
  const rel = 'CAPTURE.md';
  if (!fs.existsSync(at(rel))) {
    fail(rel, 'missing');
    return;
  }
  const md = fs.readFileSync(at(rel), 'utf8').replace(/<!--[\s\S]*?-->/g, '');
  const sections = new Map();
  let current = null;
  for (const line of md.split('\n')) {
    const h = line.match(/^## (?:\d+\.\s*)?(.+?)\s*$/);
    if (h) {
      current = h[1];
      sections.set(current, []);
    } else if (current) {
      sections.get(current).push(line);
    }
  }

  let last = -1;
  for (const name of REPORT_SECTIONS) {
    const index = [...sections.keys()].indexOf(name);
    if (index === -1) {
      fail(rel, `section "${name}" missing`);
      continue;
    }
    if (index < last) fail(rel, `section "${name}" is out of order`);
    last = index;
    // A table header and its divider are not content.
    const lines = sections.get(name).map((l) => l.trim()).filter(Boolean);
    const content = lines.filter((l, i) => !(l.startsWith('|') && (lines[i + 1]?.startsWith('|---') || l.startsWith('|---'))));
    if (!content.length) fail(rel, `section "${name}" is empty (write "None." if there is nothing)`);
    const body = content.join('\n');
    if (/\bTODO\b/.test(body)) fail(rel, `section "${name}" has a TODO`);
  }

  // Motion: every row fills every column.
  const motion = (sections.get('Motion') ?? []).filter((l) => l.trim().startsWith('|'));
  if (motion.length >= 2) {
    const head = motion[0].split('|').slice(1, -1).map((c) => c.trim().toLowerCase());
    for (const col of MOTION_COLUMNS) if (!head.includes(col)) fail(rel, `Motion table has no "${col}" column`);
    for (const row of motion.slice(2)) {
      const cells = row.split('|').slice(1, -1).map((c) => c.trim());
      if (cells.some((c) => c === '')) fail(rel, `Motion row has an empty cell: ${row.trim()}`);
    }
  }

  // Interaction states: every component with a gesture variant has a row.
  const states = (sections.get('Interaction states') ?? []).join('\n');
  for (const c of manifest.components ?? []) {
    const comp = readJson(`export/components/${c.slug}.json`);
    if (!comp) continue;
    if ((comp.variants ?? []).some((v) => v.gesture) && !states.includes(c.name)) {
      fail(rel, `component "${c.name}" has gesture variants but no row under Interaction states`);
    }
  }
}

// ------------------------------------------------------------------- run

const phases = { manifest: checkManifest, export: checkExport, live: checkLive, report: checkReport };
if (only && !phases[only]) {
  console.error(`--only must be one of ${Object.keys(phases).join(', ')}`);
  process.exit(2);
}
if (only) phases[only]();
else for (const run of Object.values(phases)) run();
report();

function report() {
  for (const w of warnings) console.log(`warn  ${w}`);
  for (const f of failures) console.log(`FAIL  ${f}`);
  console.log(`\n${failures.length} failed, ${warnings.length} warnings`);
  process.exit(failures.length ? 1 : 0);
}
