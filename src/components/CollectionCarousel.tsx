import React from 'react';

interface CollectionCarouselProps {
  onCtaClick: () => void;
}

const collectionImages = [
  {
    src: '/images/urban-habitat-02.jpg',
    alt: 'Look Urban Habitat com vestido marrom em couro',
  },
  {
    src: '/images/urban-habitat-08.jpg',
    alt: 'Look Urban Habitat com vestido cinza e casaco branco',
  },
  {
    src: '/images/hero-02.jpg',
    alt: 'Look Urban Habitat marrom com jaqueta e saia xadrez',
  },
  {
    src: '/images/urban-habitat-06.jpg',
    alt: 'Look Urban Habitat com alfaiataria vinho',
  },
  {
    src: '/images/urban-habitat-07.jpg',
    alt: 'Look Urban Habitat com conjunto rosa e bolsa vinho',
  },
  {
    src: '/images/urban-habitat-04.jpg',
    alt: 'Look Urban Habitat com conjunto de alfaiataria marrom',
  },
  {
    src: '/images/urban-habitat-09.jpg',
    alt: 'Look Urban Habitat com conjunto vermelho e botas pretas',
  },
  {
    src: '/images/urban-habitat-10.jpg',
    alt: 'Look Urban Habitat em preto e branco com casaco de textura',
  },
];

export const CollectionCarousel: React.FC<CollectionCarouselProps> = ({ onCtaClick }) => {
  return (
    <section className="py-20 md:py-28 px-4 sm:px-6 lg:px-8 bg-neutral-50/70 border-y border-neutral-200/80">
      <div className="max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-12 md:mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif text-neutral-900 font-normal tracking-tight text-balance">
            Conheça Urban Habitat, a nova coleção de inverno do Grupo IDHOK
          </h2>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
          {collectionImages.map((image) => (
            <figure
              key={image.src}
              tabIndex={0}
              className="group relative aspect-4/5 overflow-hidden rounded-2xl bg-neutral-200 shadow-sm outline-none ring-offset-2 ring-offset-neutral-50 transition-shadow duration-300 hover:shadow-xl focus-visible:ring-2 focus-visible:ring-neutral-900"
            >
              <img
                src={image.src}
                alt={image.alt}
                loading="lazy"
                className="h-full w-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-125 group-focus-visible:scale-125 motion-reduce:transition-none motion-reduce:transform-none"
              />
              <div
                aria-hidden="true"
                className="absolute inset-0 bg-black/0 transition-colors duration-500 group-hover:bg-black/5 group-focus-visible:bg-black/5"
              />
            </figure>
          ))}
        </div>

        <div className="mt-12 text-center">
          <button
            onClick={onCtaClick}
            type="button"
            className="inline-flex items-center justify-center px-8 py-3.5 bg-neutral-900 hover:bg-black text-white text-xs sm:text-sm font-semibold tracking-wider uppercase rounded-lg transition-all duration-200 shadow-sm hover:shadow-md cursor-pointer hover:scale-[1.01] active:scale-[0.99]"
          >
            QUERO SER UM LOJISTA PARCEIRO
          </button>
        </div>
      </div>
    </section>
  );
};
