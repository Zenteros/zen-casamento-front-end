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
  /** Caminho alternativo para a foto do casal. Quando omitido, utiliza a nova foto oficial /images/hero-casal.webp. */
  src?: string;
  alt?: string;
}

export const CouplePhoto: React.FC<CouplePhotoProps> = ({
  src = '/images/hero-casal.webp',
  alt = 'Patrício & Evandria',
}) => {
  return (
    <div className="hero__photo-wrapper hero-stagger-6">
      <img
        src={src}
        alt={alt}
        loading="eager"
        // @ts-expect-error fetchpriority standard attribute in React 18+ HTML
        fetchpriority="high"
        decoding="sync"
      />
    </div>
  );
};

