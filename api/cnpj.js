import { lookupCnpj } from '../lib/cnpj.js';
import { isValidCnpj } from '../lib/lead-validation.js';

// Read-only same-origin route. It never invokes the lead handler or webhook.
// The central API also enforces its own per-client limits. This bounded map
// adds a best-effort per-instance limit before invoking credentialed lookup.
export function createCnpjHandler({ lookup = lookupCnpj, now = Date.now } = {}) {
  const clients = new Map();
  return async (req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    if (req.method !== 'POST') return res.status(405).json({ error: 'method-not-allowed' });
    const origin = req.headers?.origin;
    const host = req.headers?.['x-forwarded-host'] || req.headers?.host;
    try {
      if (origin && (!host || new URL(origin).host !== host)) throw new Error();
    } catch { return res.status(403).json({ error: 'origin-not-allowed' }); }
    let body;
    try { body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body; }
    catch { return res.status(400).json({ cnpj_valido: false, encontrado: false, fonte: '', motivo: 'invalid-cnpj' }); }
    if (!isValidCnpj(body?.cnpj)) return res.status(400).json({ cnpj_valido: false, encontrado: false, fonte: '', motivo: 'invalid-cnpj' });
    const ip = String(req.headers?.['x-forwarded-for'] || '').split(',')[0].trim();
    const time = now();
    for (const [key, entry] of clients) if (time - entry.start >= 60_000) clients.delete(key);
    const entry = clients.get(ip) || { start: time, count: 0 };
    if (entry.count >= 10 || (!clients.has(ip) && clients.size >= 500)) {
      res.setHeader('Retry-After', '60');
      return res.status(429).json({ cnpj_valido: true, encontrado: false, fonte: '', motivo: 'rate-limited' });
    }
    entry.count++;
    clients.set(ip, entry);
    const result = await lookup(body.cnpj, { oidcToken: req.headers?.['x-vercel-oidc-token'], clientIp: ip });
    return res.status(200).json(result);
  };
}

export default createCnpjHandler();
