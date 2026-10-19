import React, { useRef } from 'react';
import {
  ArrowRight,
  Layers,
  Award,
  TrendingUp,
  Headphones,
} from 'lucide-react';
import { EmptyImageSlot } from './components/EmptyImageSlot';
import { LeadForm } from './components/LeadForm';
import { CollectionCarousel } from './components/CollectionCarousel';
import { FaqAccordion } from './components/FaqAccordion';

export default function App() {
  const formRef = useRef<HTMLDivElement>(null);

  const scrollToForm = () => {
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setTimeout(() => {
      const firstInput = formRef.current?.querySelector('input');
      firstInput?.focus();
    }, 500);
  };

  return (
    <div className="min-h-screen bg-[#FCFCFC] text-neutral-900 selection:bg-neutral-900 selection:text-white font-sans antialiased overflow-x-hidden">
      {/* =========================================================================
          DOBRA 1 | HERO
          A landing page não deve ter navbar (per instructions).
          Clean, modern, aesthetic luxury hero section.
         ========================================================================= */}
      <section className="relative pt-12 pb-20 md:pt-20 md:pb-28 px-4 sm:px-6 lg:px-8 border-b border-neutral-200/80 bg-linear-to-b from-white via-neutral-50/50 to-white">
        <div className="max-w-5xl mx-auto text-center flex flex-col items-center">
          {/* Logo Minimalista no topo sem navbar */}
          <div className="mb-10 md:mb-14">
            <span className="text-xs sm:text-sm font-semibold tracking-[0.3em] uppercase text-neutral-500 py-1.5 px-4 border border-neutral-200 rounded-full bg-white/80">
              GRUPO IDHOK
            </span>
          </div>

          {/* Headline Dobra 1: Upright font-serif for complete legibility of the 'Q' */}
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-serif text-neutral-950 font-normal tracking-tight uppercase leading-[1.08] max-w-4xl text-balance">
            GRUPO IDHOK. <br className="hidden sm:inline" />
            MODA QUE FORTALECE MULTIMARCAS.
          </h1>

          {/* Botão CTA Dobra 1 */}
          <div className="mt-10 md:mt-12">
            <button
              onClick={scrollToForm}
              type="button"
              className="inline-flex items-center justify-center gap-2 px-8 sm:px-10 py-4 bg-neutral-950 hover:bg-black text-white text-xs sm:text-sm font-semibold tracking-widest uppercase rounded-lg shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
            >
              <span>QUERO SER UM LOJISTA PARCEIRO</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* =========================================================================
          DOBRA 2 | FORMULÁRIO
          Padrão visual: escrita à esquerda e formulário à direita
         ========================================================================= */}
      <section
        id="formulario"
        ref={formRef}
        className="py-20 md:py-32 px-4 sm:px-6 lg:px-8 bg-neutral-100/50 scroll-mt-6"
      >
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          {/* Coluna Esquerda: Textos da Dobra 2 */}
          <div className="lg:col-span-5 flex flex-col justify-center lg:sticky lg:top-10 pt-2">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif text-neutral-950 font-normal leading-tight text-balance">
              Faça parte da rede de lojistas do Grupo IDHOK
            </h2>
            <p className="mt-5 text-neutral-600 text-base md:text-lg leading-relaxed text-balance">
              Preencha o formulário e nossa equipe entrará em contato assim que possível.
            </p>
          </div>

          {/* Coluna Direita: Formulário */}
          <div className="lg:col-span-7">
            <LeadForm />
          </div>
        </div>
      </section>

      {/* =========================================================================
          DOBRA 3 | COLEÇÃO
          Slots para imagens em formato carrossel com atualização automática devagar
         ========================================================================= */}
      <CollectionCarousel onCtaClick={scrollToForm} />

      {/* =========================================================================
          DOBRA 4 | NÚMEROS DE AUTORIDADE
          Padrão visual escuro elegante, alta autoridade
         ========================================================================= */}
      <section className="py-20 md:py-28 px-4 sm:px-6 lg:px-8 bg-neutral-950 text-white relative overflow-hidden">
        {/* Subtle geometric lines */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:32px_32px]" />

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-16 md:mb-20">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-normal text-white leading-tight text-balance">
              Uma história construída com quem vive o varejo de moda.
            </h2>
          </div>

          {/* 4 Numbers Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12 text-center sm:text-left divide-y sm:divide-y-0 sm:divide-x divide-neutral-800">
            {/* Stat 1 */}
            <div className="pt-6 sm:pt-0 sm:px-6 lg:first:pl-0 flex flex-col justify-between">
              <div>
                <span className="text-5xl sm:text-6xl md:text-7xl font-serif font-normal tracking-tight text-white block">
                  20 anos
                </span>
                <p className="mt-3 text-neutral-400 text-sm md:text-base font-light">
                  de história no mercado
                </p>
              </div>
            </div>

            {/* Stat 2 */}
            <div className="pt-6 sm:pt-0 sm:px-6 flex flex-col justify-between">
              <div>
                <span className="text-5xl sm:text-6xl md:text-7xl font-serif font-normal tracking-tight text-white block">
                  +700
                </span>
                <p className="mt-3 text-neutral-400 text-sm md:text-base font-light">
                  lojistas parceiros
                </p>
              </div>
            </div>

            {/* Stat 3 */}
            <div className="pt-6 sm:pt-0 sm:px-6 flex flex-col justify-between">
              <div>
                <span className="text-5xl sm:text-6xl md:text-7xl font-serif font-normal tracking-tight text-white block">
                  +200
                </span>
                <p className="mt-1 text-sm font-medium text-neutral-300 uppercase tracking-wider">
                  referências
                </p>
                <p className="mt-1 text-neutral-400 text-sm md:text-base font-light">
                  por coleção
                </p>
              </div>
            </div>

            {/* Stat 4 */}
            <div className="pt-6 sm:pt-0 sm:px-6 flex flex-col justify-between">
              <div>
                <span className="text-5xl sm:text-6xl md:text-7xl font-serif font-normal tracking-tight text-white block">
                  120 mil
                </span>
                <p className="mt-1 text-sm font-medium text-neutral-300 uppercase tracking-wider">
                  peças
                </p>
                <p className="mt-1 text-neutral-400 text-sm md:text-base font-light">
                  produzidas por coleção
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          DOBRA 5 | SOBRE O GRUPO IDHOK
          Referência visual: print da marca Angel do Grupo Fakini
          Escrita e botão à esquerda, slots de foto à direita (1 grande superior + 3 inferiores)
         ========================================================================= */}
      <section className="py-20 md:py-32 px-4 sm:px-6 lg:px-8 bg-white border-b border-neutral-200/80">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Esquerda: Conteúdo Institucional & CTA */}
          <div className="lg:col-span-5 flex flex-col justify-center">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif text-neutral-950 font-normal leading-tight text-balance">
              20 anos construindo moda ao lado de quem vende moda
            </h2>
            <p className="mt-6 text-neutral-600 text-base md:text-lg leading-relaxed text-balance">
              O Grupo IDHOK nasceu em 2006 como uma empresa familiar. Ao longo dos anos, evoluiu, ampliou sua atuação na moda feminina e construiu uma operação cada vez mais próxima do varejo multimarcas. Hoje, o grupo reúne Idhok e Essence All Curves, duas marcas com propostas próprias e um objetivo em comum: entregar moda com identidade, qualidade e valor para lojistas de diferentes regiões do Brasil.
            </p>

            {/* Botão CTA Dobra 5 */}
            <div className="mt-8">
              <button
                onClick={scrollToForm}
                type="button"
                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-neutral-900 hover:bg-black text-white text-xs sm:text-sm font-semibold tracking-wider uppercase rounded-lg transition-all duration-200 shadow-sm hover:shadow-md cursor-pointer hover:scale-[1.01] active:scale-[0.99]"
              >
                <span>QUERO SER UM LOJISTA PARCEIRO</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Direita: Grid de slots de foto vazios conforme layout de referência (Angel / Fakini) */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            {/* Slot Superior Grande (Paisagem / Fachada ou Editorial) */}
            <EmptyImageSlot
              aspectRatio="landscape"
              label="IMAGEM"
              sublabel=""
              className="bg-neutral-100 border-neutral-300 min-h-[260px] md:min-h-[320px] shadow-sm"
            />

            {/* 3 Slots Menores em Linha */}
            <div className="grid grid-cols-3 gap-3 md:gap-4">
              <EmptyImageSlot
                aspectRatio="portrait"
                label="IMAGEM"
                sublabel=""
                className="bg-neutral-100 border-neutral-300 shadow-xs"
              />
              <EmptyImageSlot
                aspectRatio="portrait"
                label="IMAGEM"
                sublabel=""
                className="bg-neutral-100 border-neutral-300 shadow-xs"
              />
              <EmptyImageSlot
                aspectRatio="portrait"
                label="IMAGEM"
                sublabel=""
                className="bg-neutral-100 border-neutral-300 shadow-xs"
              />
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          DOBRA 6 | DIFERENCIAIS
          Estilo visual com cards elegantes como a referência
         ========================================================================= */}
      <section className="py-20 md:py-32 px-4 sm:px-6 lg:px-8 bg-neutral-50/70 border-b border-neutral-200/80">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16 md:mb-20">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif text-neutral-950 font-normal leading-tight text-balance">
              Motivos para o Grupo IDHOK estar na sua vitrine
            </h2>
          </div>

          {/* 4 Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Card 01 */}
            <div className="bg-white p-7 rounded-2xl border border-neutral-200/90 shadow-xs hover:shadow-md transition-all duration-300 flex flex-col justify-between group">
              <div>
                <div className="flex items-center justify-end mb-6">
                  <div className="w-10 h-10 rounded-lg bg-neutral-100 flex items-center justify-center text-neutral-700 group-hover:bg-neutral-900 group-hover:text-white transition-all">
                    <Layers className="w-5 h-5" />
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-neutral-900 mb-3 leading-snug">
                  Duas marcas, mais possibilidades
                </h3>
                <p className="text-neutral-600 text-sm leading-relaxed">
                  Com Idhok e Essence All Curves, sua multimarcas encontra moda feminina para diferentes públicos, incluindo uma proposta especializada em plus size.
                </p>
              </div>
            </div>

            {/* Card 02 */}
            <div className="bg-white p-7 rounded-2xl border border-neutral-200/90 shadow-xs hover:shadow-md transition-all duration-300 flex flex-col justify-between group">
              <div>
                <div className="flex items-center justify-end mb-6">
                  <div className="w-10 h-10 rounded-lg bg-neutral-100 flex items-center justify-center text-neutral-700 group-hover:bg-neutral-900 group-hover:text-white transition-all">
                    <Award className="w-5 h-5" />
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-neutral-900 mb-3 leading-snug">
                  Alta qualidade dos produtos
                </h3>
                <p className="text-neutral-600 text-sm leading-relaxed">
                  Tecidos, modelagens, acabamentos e construção de coleção pensados para entregar valor percebido para quem compra e para quem vende.
                </p>
              </div>
            </div>

            {/* Card 03 */}
            <div className="bg-white p-7 rounded-2xl border border-neutral-200/90 shadow-xs hover:shadow-md transition-all duration-300 flex flex-col justify-between group">
              <div>
                <div className="flex items-center justify-end mb-6">
                  <div className="w-10 h-10 rounded-lg bg-neutral-100 flex items-center justify-center text-neutral-700 group-hover:bg-neutral-900 group-hover:text-white transition-all">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-neutral-900 mb-3 leading-snug">
                  Produto que faz sentido comercialmente
                </h3>
                <p className="text-neutral-600 text-sm leading-relaxed">
                  Peças atuais, fáceis de combinar, estilosas e com preço competitivo, ajudando o lojista a construir um mix mais estratégico.
                </p>
              </div>
            </div>

            {/* Card 04 */}
            <div className="bg-white p-7 rounded-2xl border border-neutral-200/90 shadow-xs hover:shadow-md transition-all duration-300 flex flex-col justify-between group">
              <div>
                <div className="flex items-center justify-end mb-6">
                  <div className="w-10 h-10 rounded-lg bg-neutral-100 flex items-center justify-center text-neutral-700 group-hover:bg-neutral-900 group-hover:text-white transition-all">
                    <Headphones className="w-5 h-5" />
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-neutral-900 mb-3 leading-snug">
                  Uma marca presente depois do pedido
                </h3>
                <p className="text-neutral-600 text-sm leading-relaxed">
                  Você conta com atendimento por representantes e ações de apoio ao lojista, com campanhas, materiais e conteúdos pensados para ajudar a aproveitar melhor as oportunidades dentro da loja.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          DOBRA 7 | COMO COMPRAR
          Comece sua parceria com o Grupo IDHOK em 4 passos
         ========================================================================= */}
      <section className="py-20 md:py-32 px-4 sm:px-6 lg:px-8 bg-white border-b border-neutral-200/80">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16 md:mb-20">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif text-neutral-950 font-normal leading-tight text-balance">
              Comece sua parceria com o Grupo IDHOK em 4 passos
            </h2>
          </div>

          {/* 4 Steps Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Step 01 */}
            <div className="p-7 rounded-2xl bg-neutral-50 border border-neutral-200/80 flex flex-col justify-between hover:bg-white hover:border-neutral-300 transition-all duration-200">
              <div>
                <span className="text-4xl sm:text-5xl font-serif text-neutral-900 block mb-4 font-normal">
                  01
                </span>
                <h3 className="text-lg font-semibold text-neutral-900 mb-2">
                  Cadastre sua loja
                </h3>
                <p className="text-sm text-neutral-600 leading-relaxed">
                  Preencha seus dados para que nosso time conheça melhor a sua multimarcas.
                </p>
              </div>
            </div>

            {/* Step 02 */}
            <div className="p-7 rounded-2xl bg-neutral-50 border border-neutral-200/80 flex flex-col justify-between hover:bg-white hover:border-neutral-300 transition-all duration-200">
              <div>
                <span className="text-4xl sm:text-5xl font-serif text-neutral-900 block mb-4 font-normal">
                  02
                </span>
                <h3 className="text-lg font-semibold text-neutral-900 mb-2">
                  Fale com um representante
                </h3>
                <p className="text-sm text-neutral-600 leading-relaxed">
                  Nossa equipe direciona seu atendimento para um representante comercial.
                </p>
              </div>
            </div>

            {/* Step 03 */}
            <div className="p-7 rounded-2xl bg-neutral-50 border border-neutral-200/80 flex flex-col justify-between hover:bg-white hover:border-neutral-300 transition-all duration-200">
              <div>
                <span className="text-4xl sm:text-5xl font-serif text-neutral-900 block mb-4 font-normal">
                  03
                </span>
                <h3 className="text-lg font-semibold text-neutral-900 mb-2">
                  Conheça as coleções
                </h3>
                <p className="text-sm text-neutral-600 leading-relaxed">
                  Veja as novidades da Idhok e Essence, conheça as condições comerciais e escolha as peças que fazem sentido para o seu público.
                </p>
              </div>
            </div>

            {/* Step 04 */}
            <div className="p-7 rounded-2xl bg-neutral-50 border border-neutral-200/80 flex flex-col justify-between hover:bg-white hover:border-neutral-300 transition-all duration-200">
              <div>
                <span className="text-4xl sm:text-5xl font-serif text-neutral-900 block mb-4 font-normal">
                  04
                </span>
                <h3 className="text-lg font-semibold text-neutral-900 mb-2">
                  Monte seu pedido
                </h3>
                <p className="text-sm text-neutral-600 leading-relaxed">
                  Com o apoio do representante, defina sua seleção e leve as marcas do Grupo IDHOK para a sua loja.
                </p>
              </div>
            </div>
          </div>

          {/* CTA Dobra 7 */}
          <div className="mt-12 text-center">
            <button
              onClick={scrollToForm}
              type="button"
              className="inline-flex items-center justify-center px-8 sm:px-10 py-4 bg-neutral-950 hover:bg-black text-white text-xs sm:text-sm font-semibold tracking-wider uppercase rounded-lg shadow-sm hover:shadow-md transition-all cursor-pointer"
            >
              QUERO SER UM LOJISTA PARCEIRO
            </button>
          </div>
        </div>
      </section>

      {/* =========================================================================
          DOBRA 8 | FAQ
         ========================================================================= */}
      <section className="py-20 md:py-32 px-4 sm:px-6 lg:px-8 bg-neutral-50/50 border-b border-neutral-200/80">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif text-neutral-950 font-normal tracking-tight">
              Perguntas frequentes
            </h2>
          </div>

          <FaqAccordion />
        </div>
      </section>

      {/* =========================================================================
          DOBRA 9 | CTA FINAL
          Estilo escuro de alto contraste como na referência
         ========================================================================= */}
      <section className="py-24 md:py-32 px-4 sm:px-6 lg:px-8 bg-neutral-950 text-white relative overflow-hidden">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-10">
          <div className="max-w-2xl">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif font-normal leading-tight text-balance">
              Faça parte da rede de lojistas do Grupo IDHOK
            </h2>
            <p className="mt-4 text-neutral-400 text-sm sm:text-base leading-relaxed text-balance">
              Conheça nossas marcas, descubra a coleção Urban Habitat e fale com um representante para entender as melhores possibilidades para a sua multimarcas.
            </p>
          </div>

          <div className="shrink-0">
            <button
              onClick={scrollToForm}
              type="button"
              className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 bg-white hover:bg-neutral-100 text-neutral-950 text-xs sm:text-sm font-semibold tracking-wider uppercase rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 cursor-pointer hover:scale-105 active:scale-95"
            >
              QUERO SER UM LOJISTA PARCEIRO
            </button>
          </div>
        </div>
      </section>

      {/* =========================================================================
          RODAPÉ
          LOGO à esquerda e no centro o seguinte texto de copyright:
          "2026, Mais Lojistas © Todos os direitos reservados."
         ========================================================================= */}
      <footer className="py-10 px-4 sm:px-6 lg:px-8 bg-white border-t border-neutral-200/80">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          {/* LOGO à esquerda */}
          <div className="flex items-center gap-2">
            <span className="font-serif text-lg font-semibold tracking-wider text-neutral-900">
              GRUPO IDHOK
            </span>
          </div>

          {/* Texto de copyright no centro */}
          <div className="text-xs text-neutral-500 font-normal text-center sm:pr-24">
            2026, Mais Lojistas © Todos os direitos reservados.
          </div>

          {/* Spacer to keep copyright centered */}
          <div className="hidden sm:block w-24" />
        </div>
      </footer>
    </div>
  );
}
