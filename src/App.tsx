import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowRight,
  Layers,
  Award,
  TrendingUp,
  Headphones,
} from 'lucide-react';
import { LeadForm } from './components/LeadForm';
import { CollectionCarousel } from './components/CollectionCarousel';
import { FaqAccordion } from './components/FaqAccordion';

const WHATSAPP_URL = 'https://wa.me/';
const COUNT_UP_DURATION = 1300;

type AnimatedNumberProps = {
  value: number;
  prefix?: string;
  suffix?: string;
};

function AnimatedNumber({ value, prefix = '', suffix = '' }: AnimatedNumberProps) {
  const elementRef = useRef<HTMLSpanElement>(null);
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    let animationFrame = 0;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const observer = new IntersectionObserver(
      ([entry]) => {
        cancelAnimationFrame(animationFrame);

        if (!entry.isIntersecting) {
          setDisplayValue(0);
          return;
        }

        if (prefersReducedMotion) {
          setDisplayValue(value);
          return;
        }

        const startTime = performance.now();
        const animate = (currentTime: number) => {
          const progress = Math.min((currentTime - startTime) / COUNT_UP_DURATION, 1);
          const easedProgress = 1 - Math.pow(1 - progress, 3);
          setDisplayValue(Math.round(value * easedProgress));

          if (progress < 1) {
            animationFrame = requestAnimationFrame(animate);
          }
        };

        animationFrame = requestAnimationFrame(animate);
      },
      { threshold: 0.35 },
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
      cancelAnimationFrame(animationFrame);
    };
  }, [value]);

  const formatNumber = (number: number) => number.toLocaleString('pt-BR');
  const finalLabel = `${prefix}${formatNumber(value)}${suffix}`;

  return (
    <span ref={elementRef} aria-label={finalLabel}>
      <span aria-hidden="true">{prefix}{formatNumber(displayValue)}{suffix}</span>
    </span>
  );
}

export default function App() {
  const formRef = useRef<HTMLDivElement>(null);
  const [heroSlide, setHeroSlide] = useState(0);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const interval = window.setInterval(() => {
      setHeroSlide((current) => (current === 0 ? 1 : 0));
    }, 2000);

    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    const animatedSections = document.querySelectorAll<HTMLElement>('section, footer');
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      animatedSections.forEach((section) => section.classList.add('is-visible'));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          entry.target.classList.toggle('is-visible', entry.isIntersecting);
        });
      },
      { threshold: 0.08, rootMargin: '0px 0px -8% 0px' },
    );

    animatedSections.forEach((section) => observer.observe(section));

    return () => observer.disconnect();
  }, []);

  const scrollToForm = () => {
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setTimeout(() => {
      const firstInput = formRef.current?.querySelector('input');
      firstInput?.focus();
    }, 500);
  };

  return (
    <div className="reveal-page min-h-screen bg-[#FBF4EC] text-neutral-900 selection:bg-neutral-900 selection:text-white font-sans antialiased overflow-x-hidden">
      {/* =========================================================================
          DOBRA 1 | HERO
          A landing page não deve ter navbar (per instructions).
          Clean, modern, aesthetic luxury hero section.
         ========================================================================= */}
      <section className="relative min-h-screen min-h-svh py-12 md:py-16 px-4 sm:px-6 lg:px-8 border-b border-neutral-900/20 bg-neutral-950 flex items-center overflow-hidden">
        <div className="absolute inset-0" aria-hidden="true">
          <img
            src="/images/hero.jpg"
            alt=""
            className={`absolute inset-0 w-full h-full object-cover object-center transition-opacity duration-[1600ms] ease-in-out motion-reduce:transition-none ${
              heroSlide === 0 ? 'opacity-100' : 'opacity-0'
            }`}
          />
          <img
            src="/images/hero-02.jpg"
            alt=""
            className={`absolute inset-0 w-full h-full object-cover object-center transition-opacity duration-[1600ms] ease-in-out motion-reduce:transition-none ${
              heroSlide === 1 ? 'opacity-100' : 'opacity-0'
            }`}
          />
        </div>
        <div className="absolute inset-0 bg-black/50" aria-hidden="true" />

        <div className="relative z-10 w-full max-w-5xl mx-auto text-center flex flex-col items-center">
          {/* Logo Minimalista no topo sem navbar */}
          <div className="mb-10 md:mb-14">
            <img
              src="/images/logo-idhok-essence.png"
              alt="IDHOK e Essence All Curves"
              className="w-64 sm:w-80 md:w-96 max-w-full h-auto object-contain brightness-0 invert drop-shadow-[0_2px_12px_rgba(0,0,0,0.35)]"
            />
          </div>

          {/* Headline Dobra 1: Upright font-serif for complete legibility of the 'Q' */}
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-serif text-[#FFFFFF] font-normal tracking-tight uppercase leading-[1.08] max-w-4xl text-balance drop-shadow-[0_3px_18px_rgba(0,0,0,0.55)]">
            GRUPO IDHOK. <br className="hidden sm:inline" />
            MODA QUE FORTALECE MULTIMARCAS.
          </h1>

          {/* Botão CTA Dobra 1 */}
          <div className="mt-10 md:mt-12">
            <button
              onClick={scrollToForm}
              type="button"
              className="inline-flex items-center justify-center gap-2 px-8 sm:px-10 py-4 bg-white hover:bg-neutral-100 text-neutral-950 text-xs sm:text-sm font-semibold tracking-widest uppercase rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
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
        className="relative overflow-hidden py-20 md:py-32 px-4 sm:px-6 lg:px-8 bg-neutral-950 scroll-mt-6"
      >
        <img
          src="/images/form-background.png"
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover object-[24%_center] md:object-center"
        />
        <div className="absolute inset-0 bg-black/55" aria-hidden="true" />

        <div className="relative z-10 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12">
          <div className="lg:col-start-6 lg:col-span-7">
          <div className="text-center mb-10 md:mb-12">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif text-white font-normal leading-tight text-balance drop-shadow-[0_2px_12px_rgba(0,0,0,0.45)] mx-auto">
              Faça parte da rede de lojistas do Grupo IDHOK
            </h2>
            <p className="mt-5 text-white text-base md:text-lg leading-relaxed text-balance drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)] mx-auto">
              Preencha o formulário e nossa equipe entrará em contato assim que possível.
            </p>
          </div>

          <div>
            <LeadForm />
          </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          DOBRA 3 | COLEÇÃO
          Grade estática 4x2 com os looks da coleção Urban Habitat
         ========================================================================= */}
      <CollectionCarousel onCtaClick={scrollToForm} />

      {/* =========================================================================
          DOBRA 4 | NÚMEROS DE AUTORIDADE
          Padrão visual escuro elegante, alta autoridade
         ========================================================================= */}
      <section className="py-20 md:py-28 px-4 sm:px-6 lg:px-8 bg-neutral-950 text-white relative overflow-hidden">
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-16 md:mb-20">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-normal text-white leading-tight text-balance">
              Uma história construída com quem vive o varejo de moda.
            </h2>
          </div>

          {/* 4 Numbers Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-0 sm:gap-8 md:gap-12 text-center sm:text-left divide-y sm:divide-y-0 sm:divide-x divide-neutral-800">
            {/* Stat 1 */}
            <div className="pb-3 sm:pb-0 sm:px-6 lg:first:pl-0 flex flex-col justify-between">
              <div>
                <span className="text-3xl sm:text-4xl md:text-5xl font-serif font-normal tracking-tight text-white block">
                  <AnimatedNumber value={20} suffix=" anos" />
                </span>
                <p className="mt-3 text-neutral-400 text-sm md:text-base font-light">
                  de história no mercado
                </p>
              </div>
            </div>

            {/* Stat 2 */}
            <div className="py-3 sm:py-0 sm:px-6 flex flex-col justify-between">
              <div>
                <span className="text-3xl sm:text-4xl md:text-5xl font-serif font-normal tracking-tight text-white block">
                  <AnimatedNumber value={1000} prefix="+" />
                </span>
                <p className="mt-3 text-neutral-400 text-sm md:text-base font-light">
                  lojistas parceiros
                </p>
              </div>
            </div>

            {/* Stat 3 */}
            <div className="py-3 sm:py-0 sm:px-6 flex flex-col justify-between">
              <div>
                <div className="flex items-baseline justify-center gap-2 sm:block">
                  <span className="text-3xl sm:text-4xl md:text-5xl font-serif font-normal tracking-tight text-white block">
                    <AnimatedNumber value={200} prefix="+" />
                  </span>
                  <p className="text-sm font-medium text-neutral-300 uppercase tracking-wider sm:mt-1">
                    REFER<span className="stat-special-letter stat-special-letter-circumflex">Ê</span>NCIAS
                  </p>
                </div>
                <p className="mt-3 sm:mt-1 text-neutral-400 text-sm md:text-base font-light">
                  por coleção
                </p>
              </div>
            </div>

            {/* Stat 4 */}
            <div className="pt-3 sm:pt-0 sm:px-6 flex flex-col justify-between">
              <div>
                <div className="flex items-baseline justify-center gap-2 sm:block">
                  <span className="text-3xl sm:text-4xl md:text-5xl font-serif font-normal tracking-tight text-white block">
                    <AnimatedNumber value={120} suffix=" mil" />
                  </span>
                  <p className="text-sm font-medium text-neutral-300 uppercase tracking-wider sm:mt-1">
                    PE<span className="stat-special-letter stat-special-letter-cedilla">Ç</span>AS
                  </p>
                </div>
                <p className="mt-3 sm:mt-1 text-neutral-400 text-sm md:text-base font-light">
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

          {/* Direita: Fachada principal e três imagens editoriais */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            <div className="overflow-hidden rounded-2xl bg-neutral-100 shadow-sm aspect-[16/9]">
              <img
                src="/images/fabrica-grupo-idhok.jpg"
                alt="Fábrica do Grupo IDHOK"
                className="h-full w-full object-cover object-center"
              />
            </div>

            {/* 3 imagens menores em linha */}
            <div className="grid grid-cols-3 gap-3 md:gap-4">
              <div className="overflow-hidden rounded-xl bg-neutral-100 shadow-xs aspect-[4/5]">
                <img
                  src="/images/historia-look-01.jpg"
                  alt="Look editorial do Grupo IDHOK com conjunto listrado"
                  className="h-full w-full object-cover object-center"
                />
              </div>
              <div className="overflow-hidden rounded-xl bg-neutral-100 shadow-xs aspect-[4/5]">
                <img
                  src="/images/historia-look-02.jpg"
                  alt="Look editorial do Grupo IDHOK em couro marrom"
                  className="h-full w-full object-cover object-center"
                />
              </div>
              <div className="overflow-hidden rounded-xl bg-neutral-100 shadow-xs aspect-[4/5]">
                <img
                  src="/images/historia-look-03.jpg"
                  alt="Look editorial do Grupo IDHOK em couro cinza"
                  className="h-full w-full object-cover object-center"
                />
              </div>
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
            <div className="bg-white p-4 md:p-7 rounded-2xl border border-neutral-200/90 shadow-xs hover:shadow-md transition-all duration-300 flex flex-col justify-between group">
              <div className="flex items-start gap-3 md:block">
                <div className="flex shrink-0 items-center justify-start md:justify-end mb-0 md:mb-6">
                  <div className="w-10 h-10 rounded-lg bg-neutral-100 flex items-center justify-center text-neutral-700 group-hover:bg-neutral-900 group-hover:text-white transition-all">
                    <Layers className="w-5 h-5" />
                  </div>
                </div>
                <div>
                  <h3 className="text-sm md:text-lg font-semibold text-neutral-900 mb-1.5 md:mb-3 leading-snug">
                    Duas marcas, mais possibilidades
                  </h3>
                  <p className="text-neutral-600 text-xs md:text-sm leading-relaxed">
                    Com Idhok e Essence All Curves, sua multimarcas encontra moda feminina para diferentes públicos, incluindo uma proposta especializada em plus size.
                  </p>
                </div>
              </div>
            </div>

            {/* Card 02 */}
            <div className="bg-white p-4 md:p-7 rounded-2xl border border-neutral-200/90 shadow-xs hover:shadow-md transition-all duration-300 flex flex-col justify-between group">
              <div className="flex items-start gap-3 md:block">
                <div className="flex shrink-0 items-center justify-start md:justify-end mb-0 md:mb-6">
                  <div className="w-10 h-10 rounded-lg bg-neutral-100 flex items-center justify-center text-neutral-700 group-hover:bg-neutral-900 group-hover:text-white transition-all">
                    <Award className="w-5 h-5" />
                  </div>
                </div>
                <div>
                  <h3 className="text-sm md:text-lg font-semibold text-neutral-900 mb-1.5 md:mb-3 leading-snug">
                    Alta qualidade dos produtos
                  </h3>
                  <p className="text-neutral-600 text-xs md:text-sm leading-relaxed">
                    Tecidos, modelagens, acabamentos e construção de coleção pensados para entregar valor percebido para quem compra e para quem vende.
                  </p>
                </div>
              </div>
            </div>

            {/* Card 03 */}
            <div className="bg-white p-4 md:p-7 rounded-2xl border border-neutral-200/90 shadow-xs hover:shadow-md transition-all duration-300 flex flex-col justify-between group">
              <div className="flex items-start gap-3 md:block">
                <div className="flex shrink-0 items-center justify-start md:justify-end mb-0 md:mb-6">
                  <div className="w-10 h-10 rounded-lg bg-neutral-100 flex items-center justify-center text-neutral-700 group-hover:bg-neutral-900 group-hover:text-white transition-all">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                </div>
                <div>
                  <h3 className="text-sm md:text-lg font-semibold text-neutral-900 mb-1.5 md:mb-3 leading-snug">
                    Produto que faz sentido comercialmente
                  </h3>
                  <p className="text-neutral-600 text-xs md:text-sm leading-relaxed">
                    Peças atuais, fáceis de combinar, estilosas e com preço competitivo, ajudando o lojista a construir um mix mais estratégico.
                  </p>
                </div>
              </div>
            </div>

            {/* Card 04 */}
            <div className="bg-white p-4 md:p-7 rounded-2xl border border-neutral-200/90 shadow-xs hover:shadow-md transition-all duration-300 flex flex-col justify-between group">
              <div className="flex items-start gap-3 md:block">
                <div className="flex shrink-0 items-center justify-start md:justify-end mb-0 md:mb-6">
                  <div className="w-10 h-10 rounded-lg bg-neutral-100 flex items-center justify-center text-neutral-700 group-hover:bg-neutral-900 group-hover:text-white transition-all">
                    <Headphones className="w-5 h-5" />
                  </div>
                </div>
                <div>
                  <h3 className="text-sm md:text-lg font-semibold text-neutral-900 mb-1.5 md:mb-3 leading-snug">
                    Uma marca presente depois do pedido
                  </h3>
                  <p className="text-neutral-600 text-xs md:text-sm leading-relaxed">
                    Você conta com atendimento por representantes e ações de apoio ao lojista, com campanhas, materiais e conteúdos pensados para ajudar a aproveitar melhor as oportunidades dentro da loja.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          DOBRA 7 | COMO COMPRAR
          Comece sua parceria com o Grupo IDHOK em 4 passos
         ========================================================================= */}
      <section className="py-20 md:py-32 px-4 sm:px-6 lg:px-8 bg-neutral-950 border-b border-neutral-800 text-white relative overflow-hidden">
        <img
          src="/images/faq-background.png"
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-black/65" aria-hidden="true" />

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-16 md:mb-20">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif text-white font-normal leading-tight text-balance">
              Comece sua parceria com o Grupo IDHOK em 4 passos
            </h2>
          </div>

          {/* 4 Steps Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Step 01 */}
            <div className="p-4 sm:p-7 rounded-2xl bg-neutral-900/80 border border-neutral-700 flex flex-col justify-between hover:bg-neutral-900 hover:border-[#B29E85] transition-all duration-300">
              <div className="flex items-start gap-4 sm:block">
                <span className="text-3xl sm:text-5xl font-serif text-[#B29E85] block shrink-0 mb-0 sm:mb-4 font-normal">
                  01
                </span>
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-white mb-1 sm:mb-2">
                    Cadastre sua loja
                  </h3>
                  <p className="text-xs sm:text-sm text-white leading-relaxed">
                    Preencha seus dados para que nosso time conheça melhor a sua multimarcas.
                  </p>
                </div>
              </div>
            </div>

            {/* Step 02 */}
            <div className="p-4 sm:p-7 rounded-2xl bg-neutral-900/80 border border-neutral-700 flex flex-col justify-between hover:bg-neutral-900 hover:border-[#B29E85] transition-all duration-300">
              <div className="flex items-start gap-4 sm:block">
                <span className="text-3xl sm:text-5xl font-serif text-[#B29E85] block shrink-0 mb-0 sm:mb-4 font-normal">
                  02
                </span>
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-white mb-1 sm:mb-2">
                    Fale com um representante
                  </h3>
                  <p className="text-xs sm:text-sm text-white leading-relaxed">
                    Nossa equipe direciona seu atendimento para um representante comercial.
                  </p>
                </div>
              </div>
            </div>

            {/* Step 03 */}
            <div className="p-4 sm:p-7 rounded-2xl bg-neutral-900/80 border border-neutral-700 flex flex-col justify-between hover:bg-neutral-900 hover:border-[#B29E85] transition-all duration-300">
              <div className="flex items-start gap-4 sm:block">
                <span className="text-3xl sm:text-5xl font-serif text-[#B29E85] block shrink-0 mb-0 sm:mb-4 font-normal">
                  03
                </span>
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-white mb-1 sm:mb-2">
                    Conheça as coleções
                  </h3>
                  <p className="text-xs sm:text-sm text-white leading-relaxed">
                    Veja as novidades da Idhok e Essence, conheça as condições comerciais e escolha as peças que fazem sentido para o seu público.
                  </p>
                </div>
              </div>
            </div>

            {/* Step 04 */}
            <div className="p-4 sm:p-7 rounded-2xl bg-neutral-900/80 border border-neutral-700 flex flex-col justify-between hover:bg-neutral-900 hover:border-[#B29E85] transition-all duration-300">
              <div className="flex items-start gap-4 sm:block">
                <span className="text-3xl sm:text-5xl font-serif text-[#B29E85] block shrink-0 mb-0 sm:mb-4 font-normal">
                  04
                </span>
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-white mb-1 sm:mb-2">
                    Monte seu pedido
                  </h3>
                  <p className="text-xs sm:text-sm text-white leading-relaxed">
                    Com o apoio do representante, defina sua seleção e leve as marcas do Grupo IDHOK para a sua loja.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* CTA Dobra 7 */}
          <div className="mt-12 text-center">
            <button
              onClick={scrollToForm}
              type="button"
              className="inline-flex items-center justify-center px-8 sm:px-10 py-4 bg-[#FBF4EC] hover:bg-white text-neutral-950 text-xs sm:text-sm font-semibold tracking-wider uppercase rounded-lg shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer hover:-translate-y-0.5"
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
          <div className="flex items-center">
            <img
              src="/images/logo-idhok-essence.png"
              alt="IDHOK e Essence All Curves"
              className="w-56 sm:w-72 max-w-full h-auto object-contain brightness-0"
            />
          </div>

          {/* Texto de copyright no centro */}
          <div className="text-xs text-neutral-500 font-normal text-center sm:pr-24">
            2026, Mais Lojistas © Todos os direitos reservados.
          </div>

          {/* Spacer to keep copyright centered */}
          <div className="hidden sm:block w-24" />
        </div>
      </footer>

      <a
        href={WHATSAPP_URL}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Falar com o Grupo IDHOK pelo WhatsApp"
        title="Fale conosco pelo WhatsApp"
        className="fixed right-5 bottom-5 sm:right-7 sm:bottom-7 z-50 flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-full bg-[#25D366] text-white shadow-[0_8px_28px_rgba(0,0,0,0.28)] ring-1 ring-black/5 transition-all duration-300 hover:-translate-y-1 hover:scale-105 hover:bg-[#20bd5a] hover:shadow-[0_12px_32px_rgba(0,0,0,0.32)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#25D366]/40 active:translate-y-0 active:scale-95"
      >
        <span className="absolute inset-0 -z-10 rounded-full bg-[#25D366]/35 animate-ping motion-reduce:animate-none" />
        <svg
          aria-hidden="true"
          viewBox="0 0 32 32"
          className="h-7 w-7 sm:h-8 sm:w-8 fill-current"
        >
          <path d="M16.04 3C9.4 3 4 8.32 4 14.86c0 2.3.67 4.54 1.95 6.46L4.1 28l6.88-1.8a12.2 12.2 0 0 0 5.05 1.1h.01c6.64 0 12.05-5.32 12.05-11.86C28.1 8.9 22.68 3 16.04 3Zm0 22.3h-.01a10.2 10.2 0 0 1-4.6-1.12l-.33-.18-4.08 1.07 1.09-3.92-.22-.35A9.83 9.83 0 0 1 6 14.86C6 9.42 10.5 5 16.04 5c5.53 0 10.04 4.42 10.04 9.86 0 5.44-4.5 10.44-10.04 10.44Zm5.5-7.39c-.3-.15-1.78-.86-2.06-.96-.27-.1-.47-.15-.67.15-.2.3-.77.96-.95 1.16-.17.2-.35.23-.65.08-.3-.15-1.27-.46-2.42-1.46a9.05 9.05 0 0 1-1.68-2.06c-.17-.3-.02-.46.13-.6.14-.13.3-.34.45-.51.15-.18.2-.3.3-.5.1-.2.05-.38-.03-.53-.07-.15-.67-1.6-.92-2.18-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1-1.04 2.45 0 1.44 1.07 2.83 1.22 3.03.15.2 2.1 3.15 5.1 4.42.71.3 1.27.48 1.7.62.72.22 1.37.19 1.88.11.58-.08 1.78-.71 2.03-1.4.25-.68.25-1.27.18-1.4-.08-.12-.28-.2-.58-.34Z" />
        </svg>
      </a>
    </div>
  );
}
