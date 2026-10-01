// Runs verify-capture.mjs against a fixture manifest. The script runs on
// import, so each case spawns it the way a user would.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const script = path.join(here, '..', 'skills', 'uc-framer-to-local', 'scripts', 'verify-capture.mjs');
const fixture = path.join(here, 'fixture');

const run = (dir, ...args) => spawnSync(process.execPath, [script, dir, ...args], { encoding: 'utf8' });

test('a complete manifest passes the manifest phase', () => {
  const r = run(fixture, '--only', 'manifest');
  assert.equal(r.status, 0, r.stdout);
});

test('--widths covers both sides of every breakpoint edge plus the audit widths', () => {
  const r = run(fixture, '--widths');
  assert.equal(r.status, 0, r.stderr);
  const widths = JSON.parse(r.stdout);
  assert.deepEqual(widths.home, [1440, 1200, 1199, 1024, 810, 809, 390]);
  assert.deepEqual(widths['work-alpha'], [1440, 1280, 1279, 1200, 1024, 810, 390]);
});

test('a sitemap URL with no page fails', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'uc-framer-'));
  const manifest = JSON.parse(fs.readFileSync(path.join(fixture, 'manifest.json'), 'utf8'));
  manifest.sitemap.push('https://example.framer.website/about');
  fs.writeFileSync(path.join(dir, 'manifest.json'), JSON.stringify(manifest));
  const r = run(dir, '--only', 'manifest');
  assert.equal(r.status, 1);
  assert.match(r.stdout, /sitemap URL https:\/\/example\.framer\.website\/about maps to no page/);
});

test('an empty capture folder fails every later phase instead of passing', () => {
  const r = run(fixture, '--only', 'export');
  assert.equal(r.status, 1);
  assert.match(r.stdout, /export\/scripts: missing/);
});
