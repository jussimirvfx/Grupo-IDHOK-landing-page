import { nationalPhone } from './lead-validation.js';

export async function trackAcceptedLead(tracking, form, result, advancedMatching = (_lead) => {}) {
  if (!tracking || !result.accepted || !Number.isFinite(result.lead_score)) return [];
  const lead = {
    name: form.ownerName, email: form.email, phone: '+55' + nationalPhone(form.phone),
    city: result.tracking_data?.city, state: result.tracking_data?.state, zip: result.tracking_data?.zip, country: 'br',
    value: result.lead_score, lead_score: result.lead_score, currency: 'BRL',
    content_name: 'Cadastro de lojista — Grupo IDHOK', content_category: 'Lead Generation',
  };
  try { advancedMatching(lead); } catch { /* Matching cannot prevent the conversion event. */ }
  const events = [Promise.resolve().then(() => tracking.trackLead(lead))];
  if (result.isQualifiedLead === true && result.score_status === 'qualified' && result.lead_score >= 50
    && Array.isArray(result.disqualification_reasons) && result.disqualification_reasons.length === 0) {
    events.push(Promise.resolve().then(() => tracking.trackLeadQualificado(lead)));
  }
  return Promise.allSettled(events);
}
