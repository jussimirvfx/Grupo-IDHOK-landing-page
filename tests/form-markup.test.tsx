import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { LeadForm } from '../src/components/LeadForm.tsx';

test('all visible fields are required and qualification selects begin unselected', () => {
  const markup = renderToStaticMarkup(<LeadForm />);
  const fields = [...markup.matchAll(/<(input|select)\b[^>]*\bname="([^"]+)"[^>]*>/g)];
  assert.equal(fields.length, 9);
  for (const [, , name] of fields) assert.match(markup.match(new RegExp(`<(?:input|select)[^>]*name="${name}"[^>]*>`))?.[0] || '', /\brequired=""/);
  assert.match(markup, /<option value="" selected="">Selecione<\/option>/);
  assert.doesNotMatch(markup, /Pessoa física \(Consumidor final\)/);
});
