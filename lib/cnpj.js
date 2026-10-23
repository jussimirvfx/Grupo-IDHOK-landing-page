import { isValidCnpj } from './lead-validation.js';

// Preserve the former LP's server-side registration check and central provider.
const CENTRAL_CNPJ_URL = 'https://validador-cnpj.vfxaceleradordevendas.com.br/api/v1/cnpj';

export async function lookupCnpj(value, { oidcToken = process.env.VERCEL_OIDC_TOKEN, clientIp, fetchImpl = fetch } = {}) {
  const cnpj = String(value ?? '').replace(/\D/g, '');
  if (!isValidCnpj(cnpj)) return { cnpj_valido: false, encontrado: false };
  if (!oidcToken) return { cnpj_valido: true, encontrado: false };
  try {
    const response = await fetchImpl(CENTRAL_CNPJ_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${oidcToken}`,
        'Content-Type': 'application/json',
        'X-VFX-Landing-ID': 'grupo-idhok-landing-page',
        ...(clientIp ? { 'X-VFX-Client-IP': clientIp } : {}),
      },
      body: JSON.stringify({ cnpj }),
      signal: AbortSignal.timeout(35_000),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) return { cnpj_valido: true, encontrado: false };
    const company = result.company;
    return {
      cnpj_valido: result.cnpj_valido === true,
      encontrado: result.encontrado === true && Boolean(company?.razao_social || company?.nome_fantasia),
      fonte: result.fonte || '',
      company,
    };
  } catch {
    return { cnpj_valido: true, encontrado: false };
  }
}
