import test from 'node:test';
import assert from 'node:assert/strict';
import { cnpjDisplay, cnpjMessage, isValidCnpj, isValidPhone, nationalPhone, phoneEdit } from '../lib/lead-validation.js';
import { createLeadHandler } from '../api/leads.js';
import { createCnpjHandler } from '../api/cnpj.js';
import { lookupCnpj } from '../lib/cnpj.js';

const valid = ['47987654321', '4732345678', '+55 (47) 98765-4321', '+55 (47) 3234-5678', '5547987654321', '554732345678', '55987654321', '5532345678', '(55) 98765-4321', '(55) 3234-5678'];
const invalid = ['47887654321', '4787654321', '473234567', '47323456789', '20987654321', '+44 47987654321', '+1 4732345678', '+55 473234567', '479876543211', '(55) 3234-56789', '(55) 47323-4567', '11111111111', '3333333333', '47abc987654321', '47/987654321', null, 47987654321, {}, []];
const response = () => ({ headers: {}, setHeader(k, v) { this.headers[k] = v; }, status(code) { this.code = code; return this; }, json(body) { this.body = body; return this; } });

test('CNPJ checksum and mask match the required three vectors', () => {
  assert.equal(isValidCnpj('60887522000189'), true);
  assert.equal(isValidCnpj('60887522000188'), false);
  assert.equal(isValidCnpj('00000000000000'), false);
  assert.equal(cnpjDisplay('60887522000189999'), '60.887.522/0001-89');
  assert.equal(cnpjMessage('60887522000189'), '');
  assert.match(cnpjMessage('6088'), /14 números/);
});

test('phone shared rule rejects malformed input and distinguishes DDI 55 from DDD 55', () => {
  for (const value of valid) assert.equal(isValidPhone(value), true, value);
  for (const value of invalid) assert.equal(isValidPhone(value), false, String(value));
  assert.equal(nationalPhone('5532345678'), '5532345678');
  assert.equal(nationalPhone('554732345678'), '4732345678');
  assert.equal(phoneEdit('(47) 98765-4321', '47987654321111').accepted, false);
});

test('all invalid phones are rejected before any lookup, backup, delivery or conversion', async () => {
  for (const phone of invalid) {
    let effects = 0;
    const handler = createLeadHandler({ lookup: async () => { effects++; }, fetchImpl: async () => { effects++; }, schedule: () => { effects++; }, logger: () => { effects++; } });
    const res = response();
    await handler({ method: 'POST', headers: {}, body: { submission_id: '00000000-0000-4000-8000-000000000002', formData: { ownerName: 'Teste isolado', storeName: 'Loja fictícia', phone, email: 'teste@example.invalid', cnpj: '60.887.522/0001-89', instagram: '', storeType: 'Loja multimarcas', hasPhysicalStore: 'Sim', mainBrands: 'Fictícia' } } }, res);
    assert.equal(res.code, 400, String(phone)); assert.equal(effects, 0);
  }
});

test('read-only CNPJ and lead handlers pass runtime OIDC, never browser Authorization', async () => {
  const seen = [];
  const lookup = (value, options) => lookupCnpj(value, { ...options, fetchImpl: async (url, init) => {
    seen.push(init.headers);
    return { ok: true, json: async () => ({ cnpj_valido: true, encontrado: true, fonte: 'mock', company: { razao_social: 'Empresa fictícia', situacao_cadastral: 'ATIVA', endereco: { cidade: 'Cidade fictícia', estado: 'SC' } } }) };
  } });
  const headers = { 'x-vercel-oidc-token': 'runtime-test', authorization: 'Bearer browser-forged' };
  const read = createCnpjHandler({ lookup }); const res = response();
  await read({ method: 'POST', headers, body: { cnpj: '60887522000189' } }, res);
  assert.equal(res.body.encontrado, true);
  const handler = createLeadHandler({ lookup, environment: { N8N_GRUPO_IDHOK_WEBHOOK_URL: 'https://n8n.agenciavfx.com.br/webhook/mock-idhok' }, fetchImpl: async () => ({ ok: true, status: 200 }), schedule: () => {}, logger: () => {} });
  await handler({ method: 'POST', headers, body: { submission_id: '00000000-0000-4000-8000-000000000003', formData: { ownerName: 'Teste isolado', storeName: 'Loja fictícia', phone: valid[0], email: 'teste@example.invalid', cnpj: '60887522000189', instagram: '', storeType: 'Loja multimarcas', hasPhysicalStore: 'Sim', mainBrands: 'Fictícia' } } }, response());
  assert.equal(seen.length, 2);
  for (const h of seen) assert.equal(h.Authorization, 'Bearer runtime-test');
});

test('CNPJ route rejects invalid, cross-origin and excessive requests without provider calls', async () => {
  let lookups = 0;
  const handler = createCnpjHandler({ lookup: async () => { lookups++; return {}; } });
  const bad = response(); await handler({ method: 'POST', headers: {}, body: { cnpj: '00000000000000' } }, bad);
  assert.equal(bad.code, 400); assert.equal(lookups, 0);
  const origin = response(); await handler({ method: 'POST', headers: { origin: 'https://example.invalid', host: 'lp2.idhok.com.br' }, body: { cnpj: '60887522000189' } }, origin);
  assert.equal(origin.code, 403); assert.equal(lookups, 0);
  for (let i = 0; i < 11; i++) {
    const res = response(); await handler({ method: 'POST', headers: { 'x-forwarded-for': '192.0.2.1' }, body: { cnpj: '60887522000189' } }, res);
    assert.equal(res.code, i === 10 ? 429 : 200);
  }
  assert.equal(lookups, 10);
});
