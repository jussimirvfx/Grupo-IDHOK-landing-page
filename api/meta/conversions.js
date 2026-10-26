import { createHash } from 'node:crypto';
import { isIP } from 'node:net';
import { META_EVENT_NAMES, SCROLL_MILESTONES } from '../../lib/meta-events.js';

const enabled = (value) => value === true || value === 1 || /^(true|1|yes|sim|on)$/i.test(String(value || ''));
const hashFields = ['em', 'ph', 'fn', 'ln', 'ct', 'st', 'zp', 'country', 'external_id'];

const normalize = (key, value) => {
  if (['ph', 'zp'].includes(key)) return value.replace(/\D/g, '');
  if (key === 'external_id') return value.trim();
  const lower = value.trim().toLowerCase();
  return key === 'em' ? lower : lower.normalize('NFD').replace(/[\u0300-\u036f\s]/g, '');
};

export function createConversionHandler({ fetchImpl = fetch, environment = process.env, logger = console } = {}) {
  const redact = (value) => {
    if (typeof value === 'string') return environment.META_API_ACCESS_TOKEN
      ? value.replaceAll(environment.META_API_ACCESS_TOKEN, '[redacted]') : value;
    if (Array.isArray(value)) return value.map(redact);
    if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value)
      .filter(([key]) => !/access.?token|authorization/i.test(key)).map(([key, item]) => [key, redact(item)]));
    return value;
  };
  const production = environment.VERCEL_ENV ? environment.VERCEL_ENV === 'production' : environment.NODE_ENV === 'production';
  return async function handler(req, res) {
    res.setHeader('Cache-Control', 'no-store');
    const origin = req.headers?.origin;
    const host = req.headers?.['x-forwarded-host'] || req.headers?.host;
    try {
      if (origin && (!host || new URL(origin).host !== host)) throw new Error();
    } catch { return res.status(403).json({ success: false, error: 'origin-not-allowed' }); }
    if (req.method === 'OPTIONS') return res.status(204).end();
    if (req.method === 'GET') return res.status(200).json({
      success: true, route: '/api/meta/conversions', configured: Boolean(environment.META_PIXEL_ID && environment.META_API_ACCESS_TOKEN),
      test_events_enabled: !production && Boolean(environment.META_TEST_EVENT_CODE),
    });
    if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'method-not-allowed' });
    let body;
    try {
      if (typeof req.body === 'string' && Buffer.byteLength(req.body) > 65_536) return res.status(413).json({ success: false, error: 'payload-too-large' });
      body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    } catch { return res.status(400).json({ success: false, error: 'invalid-event' }); }
    if (!body || typeof body !== 'object' || Array.isArray(body) || Buffer.byteLength(JSON.stringify(body)) > 65_536) {
      return res.status(400).json({ success: false, error: 'invalid-event' });
    }
    const eventName = body.event_name;
    const eventId = body.event_id;
    if (!META_EVENT_NAMES.includes(eventName)
      || (eventName === 'Scroll' && !SCROLL_MILESTONES.includes(body.custom_data?.scroll_depth))
      || typeof eventId !== 'string' || !eventId.trim() || eventId.length > 200
      || !Number.isInteger(body.event_time) || body.event_time <= 0) {
      return res.status(400).json({ success: false, error: 'invalid-event' });
    }

    let prepared = null;
    const context = {
      project: environment.VERCEL_PROJECT_NAME || 'grupo-idhok-landing-page', route: '/api/meta/conversions',
      event_name: eventName, event_id: eventId, received_at: new Date().toISOString(),
    };
    const logError = (msg, details = {}) => {
      try {
        logger.error(JSON.stringify(redact({ ...context, level: 'error', msg, event: 'conversion_api_event_error',
          request_id: req.headers?.['x-vercel-id'] || req.headers?.['x-request-id'] || null,
          request_payload: body, prepared_meta_payload: prepared, ...details })));
      } catch { /* Logging failures must not change an accepted form. */ }
    };
    try {
      const userData = {};
      for (const key of hashFields) {
        const values = [body.user_data?.[key]].flat(2).filter((value) => typeof value === 'string' && value.trim());
        if (values.length) userData[key] = values.map((value) => /^[a-f\d]{64}$/i.test(value)
          ? value.toLowerCase() : normalize(key, value)).filter(Boolean)
          .map((value) => /^[a-f\d]{64}$/i.test(value) ? value : createHash('sha256').update(value).digest('hex'));
      }
      for (const key of ['fbp', 'fbc']) {
        const value = body.user_data?.[key];
        if (typeof value === 'string' && value.length < 500) userData[key] = value;
      }
      const ip = String(req.headers?.['x-forwarded-for'] || req.socket?.remoteAddress || '').split(',')[0].trim();
      if (isIP(ip)) userData.client_ip_address = ip;
      userData.client_user_agent = String(req.headers?.['user-agent'] || body.user_data?.client_user_agent || 'unknown');
      const customData = redact(body.custom_data && typeof body.custom_data === 'object' && !Array.isArray(body.custom_data) ? body.custom_data : {});
      if (['Lead', 'LeadQualificado'].includes(eventName) && Number.isFinite(customData.lead_score)) customData.value = customData.lead_score;
      prepared = { data: [{
        event_name: eventName, event_id: eventId, event_time: body.event_time,
        event_source_url: body.event_source_url, action_source: 'website', user_data: userData, custom_data: customData,
      }] };
      if (!production && environment.META_TEST_EVENT_CODE) prepared.test_event_code = environment.META_TEST_EVENT_CODE;
      const dryRun = enabled(req.headers?.['x-vfx-dry-run'])
        || ['dry_run', 'dryRun', 'vfx_dry_run', 'skip_webhook'].some((key) => enabled(body[key]));
      logger.info(JSON.stringify(redact({ ...context, level: 'info', msg: 'conversion_api_event_backup', event: 'conversion_api_event_backup',
        custom_data: customData, dry_run: dryRun, prepared_meta_payload: prepared,
        user_data_presence: Object.fromEntries(Object.entries(userData).map(([key, value]) => [key, Boolean(value)])),
      })));
      if (dryRun) return res.status(200).json({ success: true, dry_run: true, skipped_meta: true });
      const pixelId = environment.META_PIXEL_ID;
      if (!/^\d+$/.test(pixelId || '') || !environment.META_API_ACCESS_TOKEN) {
        logError('meta_configuration_missing');
        return res.status(202).json({ success: false, accepted: true, skipped_meta: true });
      }
      const response = await fetchImpl(`https://graph.facebook.com/v23.0/${pixelId}/events`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${environment.META_API_ACCESS_TOKEN}` },
        body: JSON.stringify(prepared), signal: AbortSignal.timeout(10_000),
      });
      const result = await response.json();
      if (!response.ok || !Number.isFinite(result.events_received) || result.events_received < 1) {
        logError('meta_request_failed', { meta_status: response.status, meta_error: result });
        return res.status(202).json({ success: false, accepted: true, meta_status: response.status });
      }
      logger.info(JSON.stringify({ ...context, event: 'conversion_api_event_delivered', events_received: result.events_received }));
      return res.status(200).json({ success: true, events_received: result.events_received });
    } catch (error) {
      logError('meta_internal_error', { error_message: error instanceof Error ? error.message : String(error) });
      return res.status(202).json({ success: false, accepted: true });
    }
  };
}

export default createConversionHandler();
