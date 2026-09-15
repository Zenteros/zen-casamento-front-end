import React from 'react';

/**
 * CouplePhoto — área da foto do casal no Hero.
 *
 * PARA SUBSTITUIR A FOTO REAL:
 * Passe a prop `src` com o caminho da imagem real do casal.
 * Exemplo: <CouplePhoto src="/foto-casal.jpg" />
 *
 * O placeholder atual é um marcador elegante substituível.
 * O tratamento visual (moldura orgânica, sombra, fade) permanece ativo com a foto real.
 */

interface CouplePhotoProps {
  /** Caminho alternativo para a foto do casal. Quando omitido, utiliza as versões otimizadas oficiais da foto 11. */
  src?: string;
  alt?: string;
}

export const CouplePhoto: React.FC<CouplePhotoProps> = ({
  src,
  alt = 'Patrício & Evandria',
}) => {
  return (
    <div className="hero__photo-wrapper hero-stagger-6">
      {src ? (
        <img
          src={src}
          alt={alt}
          loading="eager"
          // @ts-expect-error fetchpriority standard attribute in React 18+ HTML
          fetchpriority="high"
          decoding="sync"
        />
      ) : (
        <picture>
          <source
            type="image/avif"
            srcSet="/images/wedding/hero-11-640w.avif 640w, /images/wedding/hero-11-1080w.avif 1080w, /images/wedding/hero-11-1440w.avif 1440w"
            sizes="(max-width: 640px) 360px, (max-width: 1024px) 320px, 400px"
          />
          <source
            type="image/webp"
            srcSet="/images/wedding/hero-11-640w.webp 640w, /images/wedding/hero-11-1080w.webp 1080w, /images/wedding/hero-11-1440w.webp 1440w"
            sizes="(max-width: 640px) 360px, (max-width: 1024px) 320px, 400px"
          />
          <img
            src="/images/wedding/hero-11-1080w.jpg"
            srcSet="/images/wedding/hero-11-640w.jpg 640w, /images/wedding/hero-11-1080w.jpg 1080w, /images/wedding/hero-11-1440w.jpg 1440w"
            sizes="(max-width: 640px) 360px, (max-width: 1024px) 320px, 400px"
            alt={alt}
            width={1080}
            height={1630}
            loading="eager"
            // @ts-expect-error fetchpriority standard attribute in React 18+ HTML
            fetchpriority="high"
            decoding="sync"
          />
        </picture>
      )}
    </div>
  );
};

