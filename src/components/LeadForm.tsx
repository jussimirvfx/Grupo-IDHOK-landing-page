import React, { useRef, useState } from 'react';
import { CheckCircle2, ArrowRight, ShieldCheck, RefreshCw } from 'lucide-react';
import { cnpjDisplay, cnpjMessage, isValidCnpj, isValidPhone, nationalPhone, phoneDisplay, phoneEdit, PHONE_ERROR } from '../../lib/lead-validation.js';

interface FormData {
  ownerName: string;
  storeName: string;
  phone: string;
  email: string;
  cnpj: string;
  instagram: string;
  storeType: string;
  hasPhysicalStore: string;
  mainBrands: string;
}

const initialFormData: FormData = {
  ownerName: '',
  storeName: '',
  phone: '',
  email: '',
  cnpj: '',
  instagram: '',
  storeType: '',
  hasPhysicalStore: '',
  mainBrands: '',
};

// Mask utility for CNPJ: 00.000.000/0000-00
export const formatCNPJ = cnpjDisplay;

// Mask utility for Brazilian Phone / WhatsApp: (11) 99999-9999
export const formatPhone = phoneDisplay;

export const LeadForm: React.FC = () => {
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [submittedName, setSubmittedName] = useState('');
  const [submissionError, setSubmissionError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({ cnpj: '', phone: '' });
  const submitting = useRef(false);
  const submission = useRef<{ id: string; signature: string } | null>(null);

  const setFieldError = (field: HTMLInputElement, message: string) => {
    field.setCustomValidity(message);
    setFieldErrors((previous) => ({ ...previous, [field.name]: message }));
  };

  const updateMaskedField = (field: HTMLInputElement, raw: string, pastedCursor?: number) => {
    const cursor = pastedCursor ?? field.selectionStart;
    const digitsBefore = raw.slice(0, cursor ?? raw.length).replace(/\D/g, '').length;
    const edit = field.name === 'phone' ? phoneEdit(formData.phone, raw) : {
      value: formatCNPJ(raw), accepted: true,
      error: raw.replace(/\D/g, '').length >= 14 || fieldErrors.cnpj ? cnpjMessage(formatCNPJ(raw)) : '',
    };
    field.value = edit.value;
    setFormData((previous) => ({ ...previous, [field.name]: edit.value }));
    setFieldError(field, edit.error);
    // Restore by digit position, including edits in the middle of the mask.
    if (edit.accepted && cursor !== null) {
      let position = 0, seen = 0;
      while (position < edit.value.length && seen < digitsBefore) {
        if (/\d/.test(edit.value[position])) seen++;
        position++;
      }
      field.setSelectionRange(position, position);
    }
  };

  const handlePhonePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const field = e.currentTarget;
    const start = field.selectionStart ?? 0, end = field.selectionEnd ?? field.value.length;
    const pasted = e.clipboardData.getData('text');
    updateMaskedField(field, field.value.slice(0, start) + pasted + field.value.slice(end), start + pasted.length);
  };

  const handleValidationBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const field = e.currentTarget;
    if (field.name === 'cnpj') {
      const value = formatCNPJ(field.value);
      field.value = value;
      setFormData((previous) => ({ ...previous, cnpj: value }));
      setFieldError(field, cnpjMessage(value));
    } else {
      const valid = isValidPhone(field.value);
      if (valid) {
        field.value = phoneDisplay(field.value);
        setFormData((previous) => ({ ...previous, phone: field.value }));
      }
      setFieldError(field, field.value && !valid ? PHONE_ERROR : '');
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    e.target.setCustomValidity('');
    setSubmissionError('');
    if (name === 'cnpj') {
      updateMaskedField(e.target as HTMLInputElement, value);
    } else if (name === 'phone') {
      updateMaskedField(e.target as HTMLInputElement, value);
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (submitting.current) return;
    const form = e.currentTarget;
    // Read the displayed values too, including browser autofill without onChange.
    const values = Object.fromEntries(new FormData(form).entries()) as unknown as FormData;
    for (const [name, valid, message] of [
      ['cnpj', isValidCnpj(values.cnpj), cnpjMessage(values.cnpj)],
      ['phone', isValidPhone(values.phone), PHONE_ERROR],
    ] as const) {
      const field = form.elements.namedItem(name) as HTMLInputElement;
      setFieldError(field, valid || !values[name] ? '' : message);
    }
    // Validate the visible autofill values before native constraints can use a
    // stale customValidity from an earlier edit. Keep all required/email checks.
    if (!form.reportValidity()) {
      form.querySelector<HTMLInputElement>(':invalid')?.focus({ preventScroll: true });
      return;
    }
    values.phone = phoneDisplay(values.phone);
    values.cnpj = formatCNPJ(values.cnpj);
    submitting.current = true;
    setIsSubmitting(true);
    setSubmissionError('');
    setFormData(values);
    const signature = JSON.stringify(values);
    if (!submission.current || submission.current.signature !== signature) {
      submission.current = { id: crypto.randomUUID(), signature };
    }
    const submissionId = submission.current.id;
    try {
      const search = new URLSearchParams(window.location.search);
      const response = await fetch('/api/leads', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ formData: values, submission_id: submissionId, page_url: window.location.href,
          utm: Object.fromEntries(['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'].map((key) => [key, search.get(key) || ''])) }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.ok || result.dry_run || !result.accepted || !result.backup_recorded || !result.delivery_scheduled || result.submission_id !== submissionId) {
        const messages: Record<string, string> = {
          'invalid-cnpj': 'CNPJ inválido. Verifique os dados informados.',
          'invalid-phone': 'Telefone inválido. Informe DDD e número completo.',
          'cnpj-inactive': 'Não foi possível validar o cadastro da empresa. Confira o CNPJ e tente novamente.',
          'cnpj-unavailable': 'Não foi possível validar o cadastro da empresa. Confira o CNPJ e tente novamente.',
        };
        throw new Error(messages[result?.error] || 'Não foi possível confirmar o cadastro. Tente novamente.');
      }
      setSubmittedName(values.ownerName);
      setIsSuccess(true);
    } catch (error) {
      setSubmissionError(error instanceof Error ? error.message : 'Não foi possível confirmar o cadastro. Tente novamente.');
    } finally {
      submitting.current = false;
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setFormData(initialFormData);
    setIsSuccess(false);
    setSubmissionError('');
    setFieldErrors({ cnpj: '', phone: '' });
    submission.current = null;
  };

  if (isSuccess) {
    return (
      <div className="font-zabal bg-white rounded-2xl border border-neutral-200 shadow-xl p-8 md:p-10 text-center animate-fade-in">
        <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-5 border border-emerald-100">
          <CheckCircle2 className="w-8 h-8 stroke-[2]" />
        </div>
        <h3 className="text-2xl font-serif text-neutral-900 mb-2 font-medium">
          Cadastro recebido com sucesso!
        </h3>
        <p className="text-neutral-600 text-sm md:text-base leading-relaxed max-w-md mx-auto mb-6">
          Obrigado, <strong className="text-neutral-900">{submittedName || 'Lojista'}</strong>. Seus dados foram encaminhados para a nossa equipe comercial do Grupo IDHOK. Um representante entrará em contato via WhatsApp / E-mail em breve.
        </p>
        <div className="p-4 bg-neutral-50 rounded-xl border border-neutral-200/70 text-left text-xs text-neutral-600 mb-6 space-y-1">
          <p><span className="font-semibold text-neutral-900">Loja:</span> {formData.storeName || 'Não informada'}</p>
          <p><span className="font-semibold text-neutral-900">Telefone:</span> {formData.phone || 'Não informado'}</p>
          <p><span className="font-semibold text-neutral-900">Tipo:</span> {formData.storeType || 'Loja multimarcas'}</p>
        </div>
        <button
          onClick={handleReset}
          type="button"
          className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-neutral-700 hover:text-black py-2.5 px-5 rounded-lg border border-neutral-300 hover:border-neutral-400 bg-white hover:bg-neutral-50 transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Fazer novo cadastro
        </button>
      </div>
    );
  }

  return (
    <div className="font-zabal bg-white rounded-2xl border border-neutral-200 shadow-xl overflow-hidden transition-shadow hover:shadow-2xl">
      {/* Form top bar matching reference design */}
      <div className="px-6 py-4 bg-neutral-50 border-b border-neutral-200/80 flex items-center justify-between text-xs">
        <div className="font-semibold text-neutral-900 tracking-wide uppercase">
          Cadastro de lojista
        </div>
      </div>

      <form noValidate onSubmit={handleSubmit} className="p-6 md:p-8 space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* 1. Nome completo proprietário */}
          <div>
            <label className="block text-xs font-medium text-neutral-700 mb-1.5">
              Nome completo proprietário
            </label>
            <input
              type="text"
              name="ownerName"
              required
              placeholder="Seu nome"
              value={formData.ownerName}
              onChange={handleChange}
              className="w-full text-sm px-3.5 py-2.5 bg-neutral-50/60 border border-neutral-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent transition-all placeholder:text-neutral-400"
            />
          </div>

          {/* 2. Nome da loja */}
          <div>
            <label className="block text-xs font-medium text-neutral-700 mb-1.5">
              Nome da loja
            </label>
            <input
              type="text"
              name="storeName"
              required
              placeholder="Sua loja"
              value={formData.storeName}
              onChange={handleChange}
              className="w-full text-sm px-3.5 py-2.5 bg-neutral-50/60 border border-neutral-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent transition-all placeholder:text-neutral-400"
            />
          </div>

          {/* 3. Telefone / WhatsApp */}
          <div>
            <label className="block text-xs font-medium text-neutral-700 mb-1.5">
              Telefone / WhatsApp
            </label>
            <input
              type="tel"
              name="phone"
              inputMode="tel"
              autoComplete="tel-national"
              aria-invalid={fieldErrors.phone ? true : undefined}
              aria-describedby={fieldErrors.phone ? 'idhok-phone-error' : undefined}
              required
              placeholder="(00) 00000-0000"
              value={formData.phone}
              onChange={handleChange}
              onBlur={handleValidationBlur}
              onPaste={handlePhonePaste}
              onKeyDown={(e) => {
                const field = e.currentTarget;
                if (/^\d$/.test(e.key) && !e.ctrlKey && !e.metaKey && !e.altKey && field.selectionStart === field.selectionEnd
                  && nationalPhone(field.value).length === 11 && isValidPhone(field.value)) {
                  e.preventDefault();
                  setFieldError(field, '');
                }
              }}
              className="w-full text-sm px-3.5 py-2.5 bg-neutral-50/60 border border-neutral-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent transition-all placeholder:text-neutral-400"
            />
            {fieldErrors.phone ? <p id="idhok-phone-error" role="alert" className="text-xs text-red-700 mt-1.5">{fieldErrors.phone}</p> : null}
          </div>

          {/* 4. E-mail */}
          <div>
            <label className="block text-xs font-medium text-neutral-700 mb-1.5">
              E-mail
            </label>
            <input
              type="email"
              name="email"
              required
              placeholder="seu@email.com"
              value={formData.email}
              onChange={handleChange}
              className="w-full text-sm px-3.5 py-2.5 bg-neutral-50/60 border border-neutral-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent transition-all placeholder:text-neutral-400"
            />
          </div>

          {/* 5. CNPJ (with mask and limit) */}
          <div>
            <label className="block text-xs font-medium text-neutral-700 mb-1.5">
              CNPJ
            </label>
            <input
              type="text"
              name="cnpj"
              inputMode="numeric"
              aria-invalid={fieldErrors.cnpj ? true : undefined}
              aria-describedby={fieldErrors.cnpj ? 'idhok-cnpj-error' : undefined}
              required
              maxLength={18}
              placeholder="00.000.000/0000-00"
              value={formData.cnpj}
              onChange={handleChange}
              onBlur={handleValidationBlur}
              className="w-full text-sm px-3.5 py-2.5 bg-neutral-50/60 border border-neutral-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent transition-all placeholder:text-neutral-400 font-mono tracking-tight"
            />
            {fieldErrors.cnpj ? <p id="idhok-cnpj-error" role="alert" className="text-xs text-red-700 mt-1.5">{fieldErrors.cnpj}</p> : null}
          </div>

          {/* 6. @Instagram da loja */}
          <div>
            <label className="block text-xs font-medium text-neutral-700 mb-1.5">
              @Instagram da loja
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 text-sm">@</span>
              <input
                type="text"
                name="instagram"
                placeholder="sualoja"
                value={formData.instagram.replace(/^@/, '')}
                onChange={(e) => setFormData((prev) => ({ ...prev, instagram: e.target.value }))}
                className="w-full text-sm pl-8 pr-3.5 py-2.5 bg-neutral-50/60 border border-neutral-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent transition-all placeholder:text-neutral-400"
              />
            </div>
          </div>

          {/* 7. Tipo de loja */}
          <div>
            <label className="block text-xs font-medium text-neutral-700 mb-1.5">
              Tipo de loja
            </label>
            <select
              name="storeType"
              required
              value={formData.storeType}
              onChange={handleChange}
              className="w-full text-sm px-3.5 py-2.5 bg-neutral-50/60 border border-neutral-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent transition-all text-neutral-800"
            >
              <option value="">Selecione uma opção</option>
              <option value="Loja multimarcas">Loja multimarcas</option>
              <option value="Loja online">Loja online</option>
              <option value="Boutique">Boutique</option>
              <option value="Revendedor(a) autônomo(a)">Revendedor(a) autônomo(a)</option>
              <option value="Pessoa física (Consumidor final)">Pessoa física (Consumidor final)</option>
            </select>
          </div>

          {/* 8. Loja física? */}
          <div>
            <label className="block text-xs font-medium text-neutral-700 mb-1.5">
              Loja física?
            </label>
            <select
              name="hasPhysicalStore"
              required
              value={formData.hasPhysicalStore}
              onChange={handleChange}
              className="w-full text-sm px-3.5 py-2.5 bg-neutral-50/60 border border-neutral-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent transition-all text-neutral-800"
            >
              <option value="">Selecione</option>
              <option value="Sim">Sim</option>
              <option value="Não">Não</option>
            </select>
          </div>
        </div>

        {/* 9. Principais marcas que vende na loja */}
        <div>
          <label className="block text-xs font-medium text-neutral-700 mb-1.5">
            Principais marcas que vende na loja
          </label>
          <input
            type="text"
            name="mainBrands"
            required
            placeholder="Informe as principais marcas que você revende atualmente"
            value={formData.mainBrands}
            onChange={handleChange}
            className="w-full text-sm px-3.5 py-2.5 bg-neutral-50/60 border border-neutral-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent transition-all placeholder:text-neutral-400"
          />
        </div>

        {submissionError && <p role="alert" className="text-sm text-red-700">{submissionError}</p>}

        {/* Submit CTA Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full mt-3 py-3.5 px-6 bg-neutral-900 hover:bg-black text-white text-sm font-semibold tracking-wider uppercase rounded-lg transition-all duration-200 flex items-center justify-center gap-2 shadow-sm hover:shadow-md active:scale-[0.99] cursor-pointer disabled:opacity-70"
        >
          {isSubmitting ? (
            <span>Enviando dados...</span>
          ) : (
            <>
              <span>ENVIAR CADASTRO</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>

        <div className="flex items-center justify-center gap-1.5 text-[11px] text-neutral-400 pt-1">
          <ShieldCheck className="w-3.5 h-3.5 text-neutral-400" />
          <span>Atendimento exclusivo e seguro para revendedores e multimarcas.</span>
        </div>
      </form>
    </div>
  );
};
