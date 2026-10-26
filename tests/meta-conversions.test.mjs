import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createConversionHandler } from '../api/meta/conversions.js';
import { trackAcceptedLead } from '../lib/meta-lead.js';

const fixture = () => ({ event_name: 'Lead', event_id: 'isolated-test-lead', event_time: Math.floor(Date.now() / 1000),
  event_source_url: 'https://lp2.idhok.com.br/', custom_data: { lead_score: 90, value: 25 },
  user_data: { em: ' TESTE@example.invalid ', ph: '+55 (47) 99999-9999', fn: 'João', ct: 'São Paulo', st: 'SP', country: 'br', fbp: 'fb.1.123.456' } });
const hash = (value) => createHash('sha256').update(value).digest('hex');
function harness(overrides = {}) {
  const logs = [], requests = [];
  const environment = { META_PIXEL_ID: '2372940856574782', META_API_ACCESS_TOKEN: 'isolated-test-secret', META_TEST_EVENT_CODE: 'TEST_ONLY', VERCEL_ENV: 'preview' };
  const handler = createConversionHandler({ environment,
    logger: { info: (value) => logs.push(JSON.parse(value)), error: (value) => logs.push(JSON.parse(value)) },
    fetchImpl: async (url, options) => {
      assert.ok(logs.some((log) => log.event === 'conversion_api_event_backup'));
      requests.push({ url, options, payload: JSON.parse(options.body) });
      return { ok: true, status: 200, json: async () => ({ events_received: 1 }) };
    }, ...overrides });
  const res = { setHeader() {}, status(code) { this.code = code; return this; }, json(body) { this.body = body; return this; }, end() {} };
  const run = async (body = fixture(), headers = {}) => { await handler({ method: 'POST', headers, body }, res); return res; };
  return { logs, requests, run, res, environment };
}

test('backs up before sending; hashes matching fields and keeps Pixel/CAPI event identity', async () => {
  const h = harness(); await h.run();
  assert.equal(h.res.code, 200); assert.equal(h.res.body.events_received, 1);
  const p = h.requests[0].payload, event = p.data[0];
  assert.equal(event.event_id, fixture().event_id); assert.equal(event.event_name, 'Lead');
  assert.deepEqual(event.user_data.em, [hash('teste@example.invalid')]);
  assert.deepEqual(event.user_data.ph, [hash('5547999999999')]);
  assert.deepEqual(event.user_data.fn, [hash('joao')]);
  assert.deepEqual(event.user_data.ct, [hash('saopaulo')]);
  assert.equal(event.user_data.fbp, fixture().user_data.fbp);
  assert.equal(event.custom_data.value, 90); assert.equal(p.test_event_code, 'TEST_ONLY');
  assert.ok(!h.requests[0].url.includes(h.environment.META_API_ACCESS_TOKEN));
  assert.ok(!JSON.stringify(h.logs).includes(h.environment.META_API_ACCESS_TOKEN));
});

test('all dry-run aliases skip Meta even with valid credentials', async () => {
  for (const flag of ['dry_run', 'dryRun', 'vfx_dry_run', 'skip_webhook', 'header']) {
    const h = harness(), b = fixture();
    if (flag !== 'header') b[flag] = true;
    await h.run(b, flag === 'header' ? { 'x-vfx-dry-run': 'true' } : {});
    assert.equal(h.res.code, 200); assert.equal(h.res.body.dry_run, true); assert.equal(h.res.body.skipped_meta, true);
    assert.equal(h.requests.length, 0); assert.equal(h.logs[0].event, 'conversion_api_event_backup');
  }
});

test('accepts exactly the five Scroll milestones and preserves their values in the backup and Meta payload', async () => {
  for (const depth of [0, 25, 50, 75, 100]) {
    const h = harness(); const b = fixture();
    b.event_name = 'Scroll'; b.custom_data = { scroll_depth: depth, scroll_percentage: depth, page_path: '/' };
    await h.run(b);
    assert.equal(h.res.code, 200);
    assert.deepEqual(h.requests[0].payload.data[0].custom_data, b.custom_data);
    assert.deepEqual(h.logs[0].custom_data, b.custom_data);
  }
  const h = harness(); const b = fixture(); b.event_name = 'Scroll'; b.custom_data = { scroll_depth: 99 };
  await h.run(b); assert.equal(h.res.code, 400); assert.equal(h.requests.length, 0);
});

test('production excludes test codes and preserves pre-hashed identifiers without hashing twice', async () => {
  const h = harness({ environment: { META_PIXEL_ID: '2372940856574782', META_API_ACCESS_TOKEN: 'isolated-test-secret', VERCEL_ENV: 'production', META_TEST_EVENT_CODE: 'MUST_NOT_SEND' } });
  const b = fixture(); b.user_data.em = hash('teste@example.invalid'); await h.run(b);
  assert.equal(h.requests[0].payload.test_event_code, undefined);
  assert.deepEqual(h.requests[0].payload.data[0].user_data.em, [b.user_data.em]);
});

test('Meta failures return 202 and log recoverable payloads with the token redacted everywhere', async () => {
  for (const networkFailure of [false, true]) {
    const h = harness({ fetchImpl: async () => {
      if (networkFailure) throw new Error('connection failed isolated-test-secret');
      return { ok: false, status: 400, json: async () => ({ error: { message: 'bad isolated-test-secret', access_token: 'isolated-test-secret' } }) };
    } });
    await h.run(); assert.equal(h.res.code, 202); assert.equal(h.res.body.accepted, true);
    const error = h.logs.find((log) => log.event === 'conversion_api_event_error');
    assert.equal(error.request_payload.event_id, fixture().event_id);
    assert.equal(error.prepared_meta_payload.data[0].user_data.em[0], hash('teste@example.invalid'));
    assert.ok(!JSON.stringify(h.logs).includes('isolated-test-secret'));
  }
});

test('missing configuration or broken backup never sends to Meta and never returns 500', async () => {
  const h = harness({ environment: {} }); await h.run(); assert.equal(h.res.code, 202); assert.equal(h.requests.length, 0);
  const broken = harness({ logger: { info() { throw new Error('mock backup failure'); }, error() {} } });
  await broken.run(); assert.equal(broken.res.code, 202); assert.equal(broken.requests.length, 0);
});

test('invalid and cross-origin events do not reach Meta', async () => {
  const h = harness(); const b = fixture(); b.event_name = 'unexpected'; await h.run(b);
  assert.equal(h.res.code, 400); assert.equal(h.requests.length, 0);
  await h.run(fixture(), { origin: 'https://example.invalid', host: 'lp2.idhok.com.br' });
  assert.equal(h.res.code, 403); assert.equal(h.requests.length, 0);
});

test('accepted leads always track Lead; qualification requires score, complete status and no disqualification', async () => {
  const form = { ownerName: 'Teste', email: 'teste@example.invalid', phone: '(47) 99999-9999' };
  const result = { accepted: true, lead_score: 100, isQualifiedLead: true, score_status: 'qualified', disqualification_reasons: [], tracking_data: { city: 'Cidade', state: 'SC', zip: '12345678' } };
  for (const [change, expected] of [
    [{}, ['Lead', 'LeadQualificado']],
    [{ lead_score: 49 }, ['Lead']],
    [{ isQualifiedLead: false, score_status: 'disqualified' }, ['Lead']],
    [{ score_status: 'pending_company_data' }, ['Lead']],
    [{ disqualification_reasons: ['Sem loja física'] }, ['Lead']],
    [{ accepted: false }, []],
  ]) {
    const calls = [];
    await trackAcceptedLead({ trackLead: (data) => calls.push(['Lead', data]), trackLeadQualificado: (data) => calls.push(['LeadQualificado', data]) }, form, { ...result, ...change });
    assert.deepEqual(calls.map(([event]) => event), expected);
    if (calls.length) { assert.equal(calls[0][1].value, calls[0][1].lead_score); assert.equal(calls[0][1].phone, '+5547999999999'); }
  }
  const failure = await trackAcceptedLead({ trackLead: () => { throw new Error('mock tracking failure'); }, trackLeadQualificado: () => {} }, form, result);
  assert.equal(failure[0].status, 'rejected'); assert.equal(failure[1].status, 'fulfilled');
});
