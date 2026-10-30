export const BRAZILIAN_DDDS = new Set([11,12,13,14,15,16,17,18,19,21,22,24,27,28,31,32,33,34,35,37,38,41,42,43,44,45,46,47,48,49,51,53,54,55,61,62,63,64,65,66,67,68,69,71,73,74,75,77,79,81,82,83,84,85,86,87,88,89,91,92,93,94,95,96,97,98,99]);

export function nationalPhone(value) {
  if (typeof value !== 'string' || !/^\+?[\d\s().-]*$/.test(value.trim())) return '';
  const text = value.trim();
  const digits = text.replace(/\D/g, '');
  if (text.startsWith('+')) return digits.startsWith('55') && [12, 13].includes(digits.length) ? digits.slice(2) : '';
  // A masked national number cannot become international after an extra digit.
  return !text.startsWith('(') && digits.startsWith('55') && [12, 13].includes(digits.length) ? digits.slice(2) : digits;
}

export function isValidPhone(value) {
  if (typeof value !== 'string') return false;
  const digits = nationalPhone(value);
  if (!BRAZILIAN_DDDS.has(Number(digits.slice(0, 2))) || /^(\d)\1+$/.test(digits)) return false;
  return digits.length === 11 ? digits[2] === '9' : digits.length === 10 && /^[2-5]/.test(digits.slice(2));
}

function maskNational(digits) {
  if (!digits) return '';
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  const split = digits.length === 11 ? 7 : 6;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, split)}-${digits.slice(split)}`;
}

export function phoneDisplay(value) {
  return maskNational(nationalPhone(value));
}

// Typing +55 key by key: returns the national digits while the DDI is still
// compatible with 55, so the draft is not read as DDD 55 or rejected.
function ddiDraft(value) {
  const text = value.trim();
  if (!/^\+[\d\s().-]*$/.test(text)) return null;
  const digits = text.replace(/\D/g, '');
  return '55'.startsWith(digits.slice(0, 2)) ? digits.slice(2) : null;
}

export const PHONE_ERROR = 'Telefone inválido. Informe DDD e número completo.';
export const PHONE_LIMIT_ERROR = 'Informe até 11 números, incluindo o DDD.';

export function phoneEdit(previous, value) {
  const draft = ddiDraft(value);
  // A complete valid +55 number falls through and collapses to the national mask.
  if (draft !== null && !isValidPhone(value)) {
    if (draft.length > 11) return { value: previous, error: PHONE_LIMIT_ERROR, accepted: false };
    const ddi = value.replace(/\D/g, '').slice(0, 2);
    return { value: `+${ddi}${draft ? ` ${maskNational(draft)}` : ''}`, error: draft.length === 11 ? PHONE_ERROR : '', accepted: true };
  }
  const digits = nationalPhone(value);
  if (!digits && /[\d+]|[^\d\s().-]/.test(value)) return { value: previous, error: PHONE_ERROR, accepted: false };
  if (digits.length > 11) return { value: previous, error: PHONE_LIMIT_ERROR, accepted: false };
  return { value: phoneDisplay(value), error: digits.length === 11 && !isValidPhone(value) ? PHONE_ERROR : '', accepted: true };
}

export function cnpjDisplay(value) {
  const digits = String(value ?? '').replace(/\D/g, '').slice(0, 14);
  if (digits.length <= 2) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
  if (digits.length <= 8) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`;
  if (digits.length <= 12) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`;
  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`;
}

export function cnpjMessage(value) {
  const digits = String(value ?? '').replace(/\D/g, '');
  if (!digits) return '';
  if (digits.length !== 14) return 'Informe os 14 números do CNPJ.';
  return isValidCnpj(value) ? '' : 'CNPJ inválido. Confira os números informados.';
}

export function isValidCnpj(value) {
  if (typeof value !== 'string' || !/^[\d./-]+$/.test(value)) return false;
  const digits = value.replace(/\D/g, '');
  if (digits.length !== 14 || /^(\d)\1{13}$/.test(digits)) return false;
  const digit = (base, weights) => {
    const rest = [...base].reduce((sum, n, i) => sum + Number(n) * weights[i], 0) % 11;
    return rest < 2 ? 0 : 11 - rest;
  };
  const first = digit(digits.slice(0, 12), [5,4,3,2,9,8,7,6,5,4,3,2]);
  const second = digit(`${digits.slice(0, 12)}${first}`, [6,5,4,3,2,9,8,7,6,5,4,3,2]);
  return digits.endsWith(`${first}${second}`);
}

export const STORE_TYPES = ['Boutique', 'Multimarcas', 'Loja de shopping', 'Loja online', 'Revendedor(a) autônomo(a)', 'Magazine'];
