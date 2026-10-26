import test, { beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import React from 'react';

const dom = new JSDOM('<!doctype html><html><body></body></html>', { url: 'https://lp2.idhok.com.br/' });
for (const key of ['window', 'document', 'navigator', 'HTMLElement', 'HTMLInputElement', 'Event', 'FormData', 'MutationObserver']) {
  Object.defineProperty(globalThis, key, { configurable: true, value: (dom.window as any)[key] });
}
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
window.matchMedia = () => ({ matches: true, addEventListener() {}, removeEventListener() {} }) as any;
(globalThis as any).IntersectionObserver = class { observe() {} disconnect() {} };
(globalThis as any).cancelAnimationFrame = () => {};
HTMLElement.prototype.scrollIntoView = () => {};
const { render, cleanup, fireEvent, act } = await import('@testing-library/react');
const { default: userEvent } = await import('@testing-library/user-event');
const { LeadForm } = await import('../src/components/LeadForm.tsx');
const { default: App } = await import('../src/App.tsx');
const requests: any[] = [];
let user: ReturnType<typeof userEvent.setup>;

beforeEach(() => {
  user = userEvent.setup({ document, delay: null });
  requests.length = 0;
  globalThis.fetch = async (url, options) => {
    assert.equal(url, '/api/leads');
    const body = JSON.parse(String(options?.body)); requests.push(body);
    return { ok: true, json: async () => ({ ok: true, accepted: true, backup_recorded: true, delivery_scheduled: true, submission_id: body.submission_id,
      lead_score: 100, score_status: 'qualified', isQualifiedLead: true, score_breakdown: [], disqualification_reasons: [] }) } as Response;
  };
});
afterEach(() => { cleanup(); dom.reconfigure({ url: 'https://lp2.idhok.com.br/' }); });
const input = (name: string) => document.querySelector(`[name="${name}"]`) as HTMLInputElement;
const pause = () => act(async () => { await new Promise((resolve) => setTimeout(resolve, 550)); });

test('CNPJ validates the 14th digit immediately, stays silent when valid and keeps focus', async () => {
  render(<LeadForm />);
  const cnpj = input('cnpj'); await user.type(cnpj, '6088752200018');
  assert.equal(cnpj.validationMessage, '');
  await user.type(cnpj, '8');
  assert.equal(cnpj.value, '60.887.522/0001-88');
  assert.match(cnpj.validationMessage, /CNPJ inválido/); assert.equal(document.activeElement, cnpj);
  await user.keyboard('{Backspace}9');
  assert.equal(cnpj.value, '60.887.522/0001-89'); assert.equal(cnpj.validationMessage, '');
  assert.equal(document.querySelector('#idhok-cnpj-error'), null); assert.equal(document.activeElement, cnpj);
  await user.clear(cnpj); await user.type(cnpj, '00000000000000');
  assert.match(cnpj.validationMessage, /CNPJ inválido/);
  await user.clear(cnpj); await user.type(cnpj, '608'); await user.tab();
  assert.match(cnpj.validationMessage, /14 números/);
  await user.clear(cnpj); await user.tab();
  assert.equal(document.querySelector('#idhok-cnpj-error'), null);
  assert.equal(requests.length, 0);
});

test('phone typing, paste, DDI and DDD 55 preserve every digit without silent truncation', async () => {
  render(<LeadForm />);
  const phone = input('phone');
  await user.type(phone, '47987654321'); await user.type(phone, '8');
  assert.equal(phone.value, '(47) 98765-4321'); assert.equal(phone.validationMessage, '');
  await user.paste('99');
  assert.equal(phone.value, '(47) 98765-4321'); assert.match(phone.validationMessage, /até 11/);
  assert.equal(document.activeElement, phone);
  await user.clear(phone); await user.type(phone, '4732345678'); await user.type(phone, '9');
  assert.equal(phone.value, '(47) 32345-6789'); assert.match(phone.validationMessage, /Telefone inválido/);
  await user.clear(phone); await user.type(phone, '55473234567'); await user.tab();
  assert.equal(phone.value, '(55) 47323-4567'); assert.match(phone.validationMessage, /Telefone inválido/);
  await user.clear(phone); await user.type(phone, '5532345678'); await user.tab();
  assert.equal(phone.value, '(55) 3234-5678'); assert.equal(phone.validationMessage, '');
  await user.click(phone); await user.keyboard('{Control>}a{/Control}'); await user.paste('+55 (47) 98765-4321');
  assert.equal(phone.value, '(47) 98765-4321'); assert.equal(phone.validationMessage, '');
  await user.keyboard('{Control>}a{/Control}'); await user.paste('554732345678');
  assert.equal(phone.value, '(47) 3234-5678'); assert.equal(phone.validationMessage, '');
  await user.keyboard('{Control>}a{/Control}'); await user.paste('+44 47987654321');
  assert.equal(phone.value, '(47) 3234-5678'); assert.match(phone.validationMessage, /Telefone inválido/);
  await user.clear(phone); await user.paste('47987654321999');
  assert.equal(phone.value, ''); assert.match(phone.validationMessage, /até 11/);
  await user.type(phone, '47987654321');
  assert.equal(phone.validationMessage, ''); assert.equal(document.activeElement, phone);
  await user.keyboard('{Control>}a{/Control}{Backspace}');
  assert.equal(phone.value, '');
});

test('editing inside the phone mask retains the cursor and deletion can clear the input', async () => {
  render(<LeadForm />);
  const phone = input('phone'); await user.type(phone, '47987654321');
  phone.setSelectionRange(6, 7); await user.keyboard('1');
  assert.equal(phone.value, '(47) 91765-4321'); assert.equal(phone.selectionStart, 7);
  await user.keyboard('{Backspace}'); assert.equal(document.activeElement, phone);
  await user.clear(phone); await user.type(phone, '4'); await user.keyboard('{Backspace}');
  assert.equal(phone.value, '');
});

test('submit reads autofill visible values and normalizes exactly what is sent to the API', async () => {
  render(<LeadForm />);
  for (const [name, value] of Object.entries({ ownerName: 'Teste isolado', storeName: 'Loja fictícia', email: 'teste@example.invalid', cnpj: '60887522000189', instagram: 'teste', mainBrands: 'Marcas fictícias' })) {
    await user.type(input(name), value);
  }
  await user.selectOptions(input('storeType'), 'Multimarcas');
  await user.selectOptions(input('hasPhysicalStore'), 'Sim');
  const phone = input('phone');
  await user.type(phone, '4787654321'); await user.tab();
  assert.match(phone.validationMessage, /Telefone inválido/);
  // Native autofill may bypass React's onChange entirely.
  Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(phone, '+55 (47) 98765-4321');
  await act(async () => { fireEvent.submit(phone.form!); });
  assert.equal(requests.length, 1); assert.equal(requests[0].formData.phone, '(47) 98765-4321');
  assert.equal(requests[0].formData.cnpj, '60.887.522/0001-89');
  assert.ok(document.body.textContent?.includes('Cadastro recebido com sucesso!'));
});

test('localhost logs the full score from the CNPJ response without calling the lead delivery API', async (t) => {
  dom.reconfigure({ url: 'http://localhost:3001/' });
  const info = t.mock.method(console, 'info', () => {});
  const table = t.mock.method(console, 'table', () => {});
  t.mock.method(console, 'group', () => {});
  t.mock.method(console, 'groupEnd', () => {});
  globalThis.fetch = async (url, options) => {
    assert.equal(url, '/api/cnpj');
    requests.push(JSON.parse(String(options?.body)));
    return { ok: true, json: async () => ({ cnpj_valido: true, encontrado: true, company: {
      situacao_cadastral: 'Ativa', data_abertura: '01/01/2020', endereco: { cidade: 'Teste', estado: 'SC' },
    } }) } as Response;
  };
  render(<LeadForm />);
  for (const [name, value] of Object.entries({ ownerName: 'Teste local', storeName: 'Loja fictícia', phone: '47987654321',
    email: 'teste@example.invalid', cnpj: '60887522000189', instagram: 'teste', mainBrands: 'Marcas fictícias' })) {
    await user.type(input(name), value);
  }
  await user.selectOptions(input('storeType'), 'Multimarcas');
  await user.selectOptions(input('hasPhysicalStore'), 'Sim');
  await act(async () => { fireEvent.submit(input('phone').form!); });
  assert.deepEqual(requests, [{ cnpj: '60.887.522/0001-89' }]);
  assert.deepEqual(table.mock.calls[0].arguments[0].map((item: any) => item.Pontos), [40, 34, 1, 25]);
  assert.ok(info.mock.calls.some((call) => call.arguments[0] === 'Pontuação:' && call.arguments[1] === 100));
  assert.ok(info.mock.calls.some((call) => call.arguments[0] === 'Status:' && call.arguments[1] === 'Qualificado'));
  assert.ok(!document.body.textContent?.includes('Cadastro recebido com sucesso!'));

  globalThis.fetch = async () => { throw new Error('local lookup unavailable'); };
  const warning = t.mock.method(console, 'warn', () => {});
  await act(async () => { fireEvent.submit(input('phone').form!); });
  assert.equal(warning.mock.callCount(), 1);
  assert.ok(info.mock.calls.some((call) => call.arguments[0] === 'Pontuação:' && call.arguments[1] === 74));
  assert.ok(info.mock.calls.some((call) => call.arguments[0] === 'Status:' && call.arguments[1] === 'Pendente de dados do CNPJ'));
});

test('invalid submit makes no request and later field selection keeps focus and text', async () => {
  render(<LeadForm />);
  const phone = input('phone'), store = input('storeName');
  await user.type(input('cnpj'), '60887522000189'); await user.type(phone, '4787654321');
  await act(async () => { fireEvent.submit(phone.form!); });
  assert.equal(requests.length, 0); assert.match(phone.validationMessage, /Telefone inválido/);
  assert.equal(document.activeElement, input('ownerName'));
  await user.type(store, 'Preservado'); await pause();
  assert.equal(document.activeElement, store); assert.equal(store.value, 'Preservado');
});

test('required cadastral confirmation shows a single safe form error, without CNPJ helper text', async () => {
  render(<LeadForm />);
  for (const [name, value] of Object.entries({ ownerName: 'Teste isolado', storeName: 'Loja fictícia', phone: '47987654321', email: 'teste@example.invalid', cnpj: '60887522000189', instagram: 'teste', mainBrands: 'Fictícias' })) await user.type(input(name), value);
  await user.selectOptions(input('storeType'), 'Multimarcas');
  await user.selectOptions(input('hasPhysicalStore'), 'Sim');
  globalThis.fetch = async () => ({ ok: false, json: async () => ({ ok: false, error: 'cnpj-inactive' }) }) as Response;
  await act(async () => { fireEvent.submit(input('phone').form!); });
  assert.equal(document.querySelector('#idhok-cnpj-error'), null);
  assert.ok(document.body.textContent?.includes('Não foi possível validar o cadastro da empresa.'));
  assert.ok(!document.body.textContent?.includes('Cadastro recebido com sucesso!'));
});

test('CTA focuses the first input only when the visitor has not selected another field', async () => {
  const view = render(<App />);
  const cta = view.getAllByRole('button').find((button) => /representante|parceiro|quero/i.test(button.textContent || ''));
  assert.ok(cta, 'A real page CTA is available');
  await user.click(cta); await pause();
  assert.equal(document.activeElement, input('ownerName'));
  await user.click(cta); await user.type(input('storeName'), 'Escolhi este campo'); await pause();
  assert.equal(document.activeElement, input('storeName')); assert.equal(input('storeName').value, 'Escolhi este campo');
});
