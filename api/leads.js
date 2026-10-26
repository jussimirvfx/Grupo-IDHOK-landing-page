import { waitUntil } from '@vercel/functions';
import { lookupCnpj } from '../lib/cnpj.js';
import { cnpjDisplay, isValidCnpj, isValidPhone, nationalPhone, phoneDisplay, STORE_TYPES } from '../lib/lead-validation.js';
import { calculateLeadScore } from '../lib/lead-score.js';

const fields = ['ownerName', 'storeName', 'phone', 'email', 'cnpj', 'instagram', 'storeType', 'hasPhysicalStore', 'mainBrands'];
const required = fields;
const truthy = (value) => value === true || value === 1 || /^(true|1|yes|sim|on)$/i.test(String(value || ''));

export function createLeadHandler({ lookup = lookupCnpj, fetchImpl = fetch, schedule = waitUntil, logger = console.info, environment = process.env } = {}) {
  return async function handler(req, res) {
    res.setHeader('Cache-Control', 'no-store');
    if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'method-not-allowed' });
    const origin = req.headers?.origin;
    const host = req.headers?.['x-forwarded-host'] || req.headers?.host;
    if (origin && host) {
      try { if (new URL(origin).host !== host) return res.status(403).json({ ok: false, error: 'origin-not-allowed' }); }
      catch { return res.status(403).json({ ok: false, error: 'origin-not-allowed' }); }
    }
    let body;
    try { body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body; }
    catch { return res.status(400).json({ ok: false, error: 'invalid-form' }); }
    // A test flag must never accidentally deliver to the production flow.
    if ([body?.dry_run, body?.dryRun, body?.vfx_dry_run, body?.skip_webhook, req.headers?.['x-vfx-dry-run']].some(truthy)) {
      return res.status(403).json({ ok: false, error: 'dry-run-disabled', skipped_delivery: true, skipped_lookup: true });
    }
    const input = body?.formData;
    if (!input || fields.some((key) => typeof input[key] !== 'string' || input[key].length > 2000) || required.some((key) => !input[key].trim())
      || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email.trim()) || !/^@?[a-zA-Z0-9._]+$/.test(input.instagram.trim())
      || !STORE_TYPES.includes(input.storeType)
      || !['Sim', 'Não'].includes(input.hasPhysicalStore) || !/^[a-zA-Z0-9-]{16,80}$/.test(body?.submission_id || '')) {
      return res.status(400).json({ ok: false, error: 'invalid-form' });
    }
    if (!isValidPhone(input.phone)) return res.status(400).json({ ok: false, error: 'invalid-phone' });
    if (!isValidCnpj(input.cnpj)) return res.status(400).json({ ok: false, error: 'invalid-cnpj' });
    let destination;
    try {
      destination = new URL(environment.N8N_GRUPO_IDHOK_WEBHOOK_URL);
      if (destination.protocol !== 'https:' || destination.hostname !== 'n8n.agenciavfx.com.br' || !destination.pathname.startsWith('/webhook/')) throw new Error();
    } catch { return res.status(503).json({ ok: false, error: 'delivery-unconfigured' }); }

    const form = Object.fromEntries(fields.map((key) => [key, input[key].trim()]));
    form.phone = phoneDisplay(form.phone);
    form.cnpj = cnpjDisplay(form.cnpj);
    const submissionId = body.submission_id;
    const record = (event, details) => logger(JSON.stringify({ event, project: 'grupo-idhok-landing-page', submission_id: submissionId, ...details }));
    try { record('landing_form_intake_backup', { payload: form }); }
    catch { return res.status(503).json({ ok: false, error: 'backup-unconfirmed' }); }

    let registration;
    try { registration = await lookup(form.cnpj, { oidcToken: req.headers?.['x-vercel-oidc-token'], clientIp: String(req.headers?.['x-forwarded-for'] || '').split(',')[0].trim() }); }
    catch { registration = null; }
    if (!registration?.cnpj_valido || !registration.encontrado || !registration.company?.endereco?.estado) {
      try { record('lead_validation_pending', { recovery_required: true }); } catch { /* Intake already exists. */ }
      return res.status(503).json({ ok: false, error: 'cnpj-unavailable', backup_recorded: true, submission_id: submissionId });
    }
    if (!['ATIVA', '2', '02'].includes(String(registration.company.situacao_cadastral).trim().toUpperCase())) {
      return res.status(422).json({ ok: false, error: 'cnpj-inactive', backup_recorded: true });
    }
    const utm = Object.fromEntries(['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'].map((key) => [key, typeof body.utm?.[key] === 'string' ? body.utm[key].slice(0, 500) : '']));
    const score = calculateLeadScore(form, registration.company);
    try { record('lead_score_calculated', { score }); }
    catch { return res.status(503).json({ ok: false, error: 'backup-unconfirmed', backup_recorded: true }); }
    const payload = {
      fullName: form.ownerName, email: form.email, phone: form.phone,
      phoneE164: '+55' + nationalPhone(form.phone), storeName: form.storeName, cnpj: form.cnpj,
      city: registration.company.endereco.cidade || '', state: registration.company.endereco.estado,
      storeType: form.storeType, hasPhysicalStore: form.hasPhysicalStore, instagram: form.instagram,
      message: form.mainBrands, mainBrands: form.mainBrands,
      salespeople: '', segments: '', leadScore: score.total, lead_score: score.total,
      score_status: score.status, isQualifiedLead: score.qualified,
      score_breakdown: score.items, disqualification_reasons: score.reasons,
      url: typeof body.page_url === 'string' ? body.page_url.slice(0, 2000) : '', ...utm,
      timestamp: new Date().toISOString(), source: 'landing-page-essence-reflexos', submission_id: submissionId,
      cnpj_validation_status: 'cadastral_valid', cnpj_provider: registration.fonte || '',
      cnpj_digits: form.cnpj.replace(/\D/g, ''), encontrado: true,
      fonte: registration.fonte || '', company: registration.company,
    };
    try { record('landing_form_backup', { payload }); }
    catch { return res.status(503).json({ ok: false, error: 'backup-unconfirmed', backup_recorded: true }); }

    let scheduled = false;
    const delivery = Promise.resolve().then(async () => {
      if (!scheduled) return;
      let status;
      try {
        const response = await fetchImpl(destination.href, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload), signal: AbortSignal.timeout(25_000) });
        status = response.status;
        record(response.ok ? 'lead_delivery_completed' : 'lead_delivery_failed', { status });
      } catch {
        try { record('lead_delivery_failed', { ...(status ? { status } : {}), recovery_required: true }); } catch { /* Keep the original acceptance. */ }
      }
    });
    try { schedule(delivery); scheduled = true; }
    catch { return res.status(503).json({ ok: false, error: 'delivery-not-scheduled', backup_recorded: true }); }
    return res.status(200).json({ ok: true, accepted: true, backup_recorded: true, delivery_scheduled: true, submission_id: submissionId,
      lead_score: score.total, score_status: score.status, isQualifiedLead: score.qualified,
      score_breakdown: score.items, disqualification_reasons: score.reasons,
      tracking_data: { city: payload.city, state: payload.state, zip: registration.company.endereco.cep || '', country: 'br' } });
  };
}

export default createLeadHandler();
