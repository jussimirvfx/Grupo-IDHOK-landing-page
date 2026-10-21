import React, { useState } from 'react';
import { Plus, Minus } from 'lucide-react';

interface FaqItem {
  question: string;
  answer: string;
}

const accentedCharacterPattern = /[^\u0000-\u007F]/u;

const renderAccentAwareText = (text: string, accentClassName: string) =>
  Array.from(text).map((character, index) =>
    accentedCharacterPattern.test(character) ? (
      <span key={`${character}-${index}`} className={accentClassName}>
        {character}
      </span>
    ) : (
      character
    ),
  );

const faqData: FaqItem[] = [
  {
    question: 'Quem pode comprar Idhok e Essence All Curves',
    answer:
      'As marcas são voltadas ao mercado multimarcas. O atendimento é direcionado a lojistas de moda feminina que desejam incluir Idhok, Essence ou ambas em seu portfólio.',
  },
  {
    question: 'Qual é a diferença entre Idhok e Essence All Curves',
    answer:
      'A Idhok é especializada em moda feminina slim, com modelagens que combinam elegância, modernidade e versatilidade. Já a Essence All Curves é dedicada à moda plus size, com peças desenvolvidas para valorizar as curvas, proporcionando conforto, estilo e caimento adequado.\n\nA grande novidade desta coleção é a união das duas marcas! Combinando suas especialidades, Idhok e Essence All Curves apresentam peças exclusivas com grade estendida do PP ao G3, desenvolvidas para atender diferentes biotipos, respeitando as particularidades de cada silhueta e oferecendo o mesmo estilo em uma maior variedade de tamanhos.',
  },
  {
    question: 'Como recebo catálogo, preços e condições comerciais',
    answer:
      'Faça seu cadastro nesta página. Um representante comercial entrará em contato para apresentar as coleções, produtos e condições disponíveis para a sua loja.',
  },
  {
    question: 'O Grupo IDHOK atende lojistas de todo o Brasil',
    answer:
      'Sim. O Grupo IDHOK atua com lojistas em todo o território nacional e conta com uma estrutura de representantes para atendimento comercial em diferentes regiões.',
  },
];

export const FaqAccordion: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggle = (index: number) => {
    setOpenIndex((prev) => (prev === index ? null : index));
  };

  return (
    <div className="max-w-3xl mx-auto divide-y divide-neutral-200">
      {faqData.map((item, index) => {
        const isOpen = openIndex === index;
        return (
          <div key={index} className="py-5 transition-colors">
            <button
              onClick={() => toggle(index)}
              className="w-full flex items-center justify-between text-left group py-2 focus:outline-none"
              aria-expanded={isOpen}
            >
              <span className="text-base sm:text-lg font-light text-neutral-900 group-hover:text-black transition-colors pr-4">
                {renderAccentAwareText(item.question, 'font-zabal font-extralight')}
                <span className="font-zabal font-extralight">?</span>
              </span>
              <span className="w-8 h-8 rounded-full border border-neutral-300 flex items-center justify-center shrink-0 text-neutral-600 group-hover:border-neutral-900 group-hover:text-neutral-900 transition-all">
                {isOpen ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              </span>
            </button>
            {isOpen && (
              <div className="pt-2 pb-3 pr-8 text-neutral-600 text-sm sm:text-base font-normal leading-relaxed whitespace-pre-line animate-fade-in">
                {renderAccentAwareText(item.answer, 'font-zabal font-normal')}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
