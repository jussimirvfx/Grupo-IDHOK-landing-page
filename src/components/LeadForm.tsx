import React, { useState } from 'react';
import { CheckCircle2, ArrowRight, ShieldCheck, RefreshCw } from 'lucide-react';

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
export const formatCNPJ = (value: string): string => {
  const digits = value.replace(/\D/g, '').slice(0, 14);
  if (digits.length <= 2) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
  if (digits.length <= 8) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`;
  if (digits.length <= 12) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`;
  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12, 14)}`;
};

// Mask utility for Brazilian Phone / WhatsApp: (11) 99999-9999
export const formatPhone = (value: string): string => {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length === 0) return '';
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
};

export const LeadForm: React.FC = () => {
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [submittedName, setSubmittedName] = useState('');

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    if (name === 'cnpj') {
      setFormData((prev) => ({ ...prev, cnpj: formatCNPJ(value) }));
    } else if (name === 'phone') {
      setFormData((prev) => ({ ...prev, phone: formatPhone(value) }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Save locally for persistence / preview demonstration
    try {
      const existing = JSON.parse(localStorage.getItem('idhok_leads') || '[]');
      const newLead = {
        ...formData,
        timestamp: new Date().toISOString(),
      };
      localStorage.setItem('idhok_leads', JSON.stringify([newLead, ...existing]));
    } catch {
      // ignore
    }

    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);
      setSubmittedName(formData.ownerName);
    }, 700);
  };

  const handleReset = () => {
    setFormData(initialFormData);
    setIsSuccess(false);
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

      <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-5">
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
              required
              placeholder="(00) 00000-0000"
              value={formData.phone}
              onChange={handleChange}
              className="w-full text-sm px-3.5 py-2.5 bg-neutral-50/60 border border-neutral-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent transition-all placeholder:text-neutral-400"
            />
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
              required
              maxLength={18}
              placeholder="00.000.000/0000-00"
              value={formData.cnpj}
              onChange={handleChange}
              className="w-full text-sm px-3.5 py-2.5 bg-neutral-50/60 border border-neutral-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent transition-all placeholder:text-neutral-400 font-mono tracking-tight"
            />
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
