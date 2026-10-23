export const BRAZILIAN_DDDS = new Set([11,12,13,14,15,16,17,18,19,21,22,24,27,28,31,32,33,34,35,37,38,41,42,43,44,45,46,47,48,49,51,53,54,55,61,62,63,64,65,66,67,68,69,71,73,74,75,77,79,81,82,83,84,85,86,87,88,89,91,92,93,94,95,96,97,98,99]);

export function nationalPhone(value) {
  const digits = String(value ?? '').replace(/\D/g, '');
  return digits.startsWith('55') && [12, 13].includes(digits.length) ? digits.slice(2) : digits;
}

export function isValidPhone(value) {
  if (typeof value !== 'string') return false;
  const digits = nationalPhone(value);
  if (!BRAZILIAN_DDDS.has(Number(digits.slice(0, 2))) || /^(\d)\1+$/.test(digits)) return false;
  return digits.length === 11 ? digits[2] === '9' : digits.length === 10 && /^[2-5]/.test(digits.slice(2));
}

export function phoneDisplay(value) {
  const digits = nationalPhone(value);
  const split = digits.length === 11 ? 7 : 6;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, split)}-${digits.slice(split)}`;
}

export function isValidCnpj(value) {
  if (typeof value !== 'string') return false;
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

export const STORE_TYPES = ['Loja multimarcas', 'Loja online', 'Boutique', 'Revendedor(a) autônomo(a)', 'Pessoa física (Consumidor final)'];
