import test from 'node:test';
import assert from 'node:assert/strict';
import { createLeadHandler } from '../api/leads.js';
import { lookupCnpj } from '../lib/cnpj.js';

const fixture = () => ({
  submission_id: '00000000-0000-4000-8000-000000000001',
  page_url: 'https://lp2.idhok.com.br/?utm_campaign=isolado',
  utm: { utm_campaign: 'isolado' },
  formData: { ownerName: 'Teste isolado', storeName: 'Loja fictícia', phone: '(47) 99999-1234', email: 'teste@example.invalid',
    cnpj: '60.887.522/0001-89', instagram: '@teste', storeType: 'Loja multimarcas', hasPhysicalStore: 'Sim', mainBrands: 'Marca fictícia' },
});
const company = () => ({ cnpj_valido: true, encontrado: true, fonte: 'mock', company: {
  razao_social: 'Empresa fictícia', situacao_cadastral: 'ATIVA', endereco: { cidade: 'Cidade de teste', estado: 'SC' },
} });
function harness(overrides = {}) {
  const deliveries = [], backups = [], scheduled = [], lookups = [];
  const handler = createLeadHandler({
    environment: { N8N_GRUPO_IDHOK_WEBHOOK_URL: 'https://n8n.agenciavfx.com.br/webhook/mock-idhok' },
    lookup: async (...args) => { lookups.push(args); return company(); },
    fetchImpl: async (url, options) => { deliveries.push({ url, payload: JSON.parse(options.body) }); return { ok: true, status: 200 }; },
    logger: (line) => backups.push(JSON.parse(line)), schedule: (promise) => scheduled.push(promise), ...overrides,
  });
  const res = { headers: {}, setHeader(k, v) { this.headers[k] = v; }, status(code) { this.code = code; return this; }, json(value) { this.body = value; return this; } };
  const run = async (body = fixture(), req = {}) => { await handler({ method: 'POST', headers: {}, body, ...req }, res); return res; };
  return { run, res, deliveries, backups, scheduled, lookups };
}

test('maps every current field to the former flow without inventing score or answers', async () => {
  const h = harness(), body = fixture();
  body.formData.salespeople = '4 ou mais'; body.formData.state = 'XX'; body.leadScore = 999;
  await h.run(body); await Promise.all(h.scheduled);
  assert.equal(h.res.code, 200); assert.equal(h.res.body.submission_id, body.submission_id);
  assert.equal(h.deliveries.length, 1);
  const p = h.deliveries[0].payload;
  assert.equal(p.fullName, body.formData.ownerName); assert.equal(p.storeName, body.formData.storeName);
  assert.equal(p.email, body.formData.email); assert.equal(p.phone, body.formData.phone);
  assert.equal(p.cnpj, body.formData.cnpj); assert.equal(p.instagram, body.formData.instagram);
  assert.equal(p.storeType, body.formData.storeType); assert.equal(p.hasPhysicalStore, body.formData.hasPhysicalStore);
  assert.equal(p.message, body.formData.mainBrands); assert.equal(p.mainBrands, body.formData.mainBrands);
  assert.equal(p.state, 'SC'); assert.equal(p.city, 'Cidade de teste'); assert.equal(p.phoneE164, '+5547999991234');
  assert.equal(p.salespeople, ''); assert.equal(p.segments, ''); assert.equal(p.leadScore, null);
  assert.equal(p.lead_score, null); assert.equal(p.score_status, 'not_evaluated'); assert.equal(p.isQualifiedLead, undefined);
  assert.equal(p.utm_campaign, 'isolado'); assert.equal(p.url, body.page_url);
  assert.ok(h.backups.every((log) => log.submission_id === body.submission_id));
  assert.deepEqual(h.backups.find((log) => log.event === 'landing_form_backup').payload, p);
});

test('acceptance completes while the webhook is pending', { timeout: 1500 }, async () => {
  let resolveDelivery;
  const h = harness({ fetchImpl: () => new Promise((resolve) => { resolveDelivery = resolve; }) });
  await h.run();
  assert.equal(h.res.body.accepted, true); assert.equal(h.res.body.delivery_scheduled, true);
  resolveDelivery({ ok: true, status: 200 }); await Promise.all(h.scheduled);
});

test('later webhook failure is logged with the same id and cannot turn acceptance into failure', async () => {
  const h = harness({ fetchImpl: async () => { throw new Error('mock network failure'); } });
  await h.run(); await Promise.all(h.scheduled);
  assert.equal(h.res.code, 200);
  assert.ok(h.backups.some((log) => log.event === 'lead_delivery_failed' && log.submission_id === fixture().submission_id));
});

test('invalid phone, CNPJ, fields and cross-origin requests make zero lookups and deliveries', async () => {
  for (const change of [
    (b) => { b.formData.phone = '(20) 99999-1234'; },
    (b) => { b.formData.phone = '(47) 89999-1234'; },
    (b) => { b.formData.cnpj = '60.887.522/0001-88'; },
    (b) => { b.formData.ownerName = ''; },
  ]) {
    const h = harness(), body = fixture(); change(body); await h.run(body);
    assert.equal(h.res.code, 400); assert.equal(h.lookups.length, 0); assert.equal(h.deliveries.length, 0);
  }
  const h = harness(); await h.run(fixture(), { headers: { origin: 'https://example.invalid', host: 'lp2.idhok.com.br' } });
  assert.equal(h.res.code, 403); assert.equal(h.lookups.length, 0);
});

test('dry-run aliases cannot accidentally call lookup, logging or a production destination', async () => {
  for (const key of ['dry_run', 'dryRun', 'vfx_dry_run', 'skip_webhook']) {
    const h = harness(), body = fixture(); body[key] = true; await h.run(body);
    assert.equal(h.res.code, 403); assert.equal(h.lookups.length, 0); assert.equal(h.deliveries.length, 0); assert.equal(h.backups.length, 0);
  }
});

test('missing destination, failed backup and failed scheduling never report acceptance', async () => {
  const missing = harness({ environment: {} }); await missing.run();
  assert.equal(missing.res.code, 503); assert.equal(missing.lookups.length, 0);
  const backup = harness({ logger: () => { throw new Error('mock backup failure'); } }); await backup.run();
  assert.equal(backup.res.code, 503); assert.equal(backup.deliveries.length, 0);
  const scheduler = harness({ schedule: () => { throw new Error('mock scheduling failure'); } }); await scheduler.run();
  await Promise.resolve(); assert.equal(scheduler.res.code, 503); assert.equal(scheduler.deliveries.length, 0);
});

test('the previous active-company requirement is preserved without delivering inactive or unavailable records', async () => {
  const inactive = harness({ lookup: async () => { const c = company(); c.company.situacao_cadastral = 'BAIXADA'; return c; } });
  await inactive.run(); assert.equal(inactive.res.code, 422); assert.equal(inactive.deliveries.length, 0);
  const unavailable = harness({ lookup: async () => ({ cnpj_valido: true, encontrado: false }) });
  await unavailable.run(); assert.equal(unavailable.res.code, 503); assert.equal(unavailable.deliveries.length, 0);
});

test('CNPJ uses the runtime OIDC token and the new project identity', async () => {
  const seen = [];
  const result = await lookupCnpj('60.887.522/0001-89', { oidcToken: 'mock-runtime-token', fetchImpl: async (url, options) => {
    seen.push({ url, options }); return { ok: true, json: async () => company() };
  } });
  assert.equal(result.encontrado, true); assert.equal(seen[0].options.headers.Authorization, 'Bearer mock-runtime-token');
  assert.equal(seen[0].options.headers['X-VFX-Landing-ID'], 'grupo-idhok-landing-page');
  await lookupCnpj('00.000.000/0000-00', { fetchImpl: () => assert.fail('Invalid CNPJ must not query providers') });
});
