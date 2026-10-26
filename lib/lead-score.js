const storeRules = {
  Boutique: { points: 40 },
  Multimarcas: { points: 40 },
  'Loja de shopping': { points: 5 },
  'Loja online': { points: 10, disqualifies: true },
  'Revendedor(a) autônomo(a)': { points: 1, disqualifies: true },
  Magazine: { points: 5, disqualifies: true },
};

const priorityStates = new Set('SP RJ MG RS PR SC GO DF BA PE CE ES MT MS PB RN AL SE PI MA TO PA AM RO AC RR AP'.split(' '));

function openingDate(company) {
  const value = company?.data_inicio_atividade ?? company?.data_abertura ?? company?.abertura ?? company?.data_fundacao;
  if (typeof value !== 'string') return null;
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value);
  const date = match ? new Date(Date.UTC(Number(match[3]), Number(match[2]) - 1, Number(match[1]))) : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  if (match && (date.getUTCFullYear() !== Number(match[3]) || date.getUTCMonth() !== Number(match[2]) - 1 || date.getUTCDate() !== Number(match[1]))) return null;
  return date;
}

export function calculateLeadScore(form, company, now = new Date()) {
  const items = [];
  const reasons = [];
  const store = storeRules[form.storeType];
  if (!store) throw new Error('invalid-store-type');
  items.push({ criterion: 'Tipo de loja', answer: form.storeType, points: store.points });
  if (store.disqualifies) reasons.push(`Tipo de loja: ${form.storeType}`);

  const physical = form.hasPhysicalStore === 'Sim';
  items.push({ criterion: 'Loja física', answer: form.hasPhysicalStore, points: physical ? 34 : 5 });
  if (!physical) reasons.push('Não possui loja física');

  const state = String(company?.endereco?.estado || '').toUpperCase();
  items.push({ criterion: 'Estado pelo CNPJ', answer: state || 'Indisponível', points: priorityStates.has(state) ? 1 : 0 });

  const opened = openingDate(company);
  let ageStatus = 'available';
  const suppliedYears = company?.tempo_cnpj_anos;
  const years = opened && opened <= now ? now.getUTCFullYear() - opened.getUTCFullYear() -
    (now.getUTCMonth() < opened.getUTCMonth() || (now.getUTCMonth() === opened.getUTCMonth() && now.getUTCDate() < opened.getUTCDate()) ? 1 : 0)
    : !opened && Number.isFinite(suppliedYears) && suppliedYears >= 0 ? Math.floor(suppliedYears) : null;
  if (years === null) {
    ageStatus = 'pending_company_data';
    items.push({ criterion: 'Tempo de CNPJ', answer: 'Data de abertura indisponível', points: 0 });
  } else {
    const band = years < 1 ? ['Menos de 1 ano', 10] : years < 3 ? ['De 1 a 2 anos', 15] : years < 5 ? ['De 3 a 4 anos', 20] : ['Mais de 5 anos', 25];
    items.push({ criterion: 'Tempo de CNPJ', answer: band[0], points: band[1] });
    if (years < 1) reasons.push('CNPJ com menos de 1 ano');
  }
  const total = Math.min(100, items.reduce((sum, item) => sum + item.points, 0));
  const companyComplete = ageStatus === 'available' && priorityStates.has(state);
  return { total, items, qualified: reasons.length === 0 && companyComplete,
    status: reasons.length ? 'disqualified' : companyComplete ? 'qualified' : 'pending_company_data', reasons };
}
