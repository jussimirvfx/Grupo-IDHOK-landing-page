import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdir, mkdtemp, writeFile, rm } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import path from 'node:path';
import { transform } from 'esbuild';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { LeadForm } from '../src/components/LeadForm.tsx';

test('the initial form markup, fields, copy and classes match the published design exactly', async () => {
  const original = execFileSync('git', ['show', '27e97baee738107a1f408b0426b1395e56ef08d7:src/components/LeadForm.tsx'], { encoding: 'utf8' });
  const compiled = await transform(original, { loader: 'tsx', format: 'esm', jsx: 'automatic' });
  const cache = path.resolve('node_modules/.cache'); await mkdir(cache, { recursive: true });
  const temporary = await mkdtemp(path.join(cache, 'idhok-markup-'));
  try {
    const file = path.join(temporary, 'original.mjs'); await writeFile(file, compiled.code);
    const { LeadForm: OriginalForm } = await import(pathToFileURL(file).href);
    assert.equal(renderToStaticMarkup(<LeadForm />), renderToStaticMarkup(<OriginalForm />));
  } finally { await rm(temporary, { recursive: true, force: true }); }
});
