import React from 'react';

/**
 * EditorialPhotoBreak — pausa emocional entre Recepção e Traje.
 *
 * PARA INSERIR A FOTO REAL DO CASAL (horizontal/ambiente):
 * Passe a prop `src` com o caminho da imagem.
 * Exemplo: <EditorialPhotoBreak src="/foto-ambiente.jpg" />
 *
 * A seção é propositalmente minimalista — pouca tipografia,
 * máxima presença fotográfica. Funciona como respiro emocional.
 */

interface EditorialPhotoBreakProps {
  /** Foto personalizada ou caminho específico. Quando omitido, utiliza o asset oficial 7.jpg (ou 24.jpg se variant="alt"). */
  src?: string;
  alt?: string;
  variant?: 'main' | 'alt';
}

export const EditorialPhotoBreak: React.FC<EditorialPhotoBreakProps> = ({
  src,
  alt = 'Patrício & Evandria',
  variant = 'main',
}) => {
  const isAlt = variant === 'alt';
  const prefix = isAlt ? 'editorial-alt-24' : 'editorial-7';

  return (
    <div className="editorial-photo-break animate-fade-in" id="foto-editorial">
      <div className="editorial-photo-break__inner">

        {/* Imagem principal */}
        <div className="editorial-photo-break__image-wrap">
          {src ? (
            <img
              src={src}
              alt={alt}
              loading="lazy"
              decoding="async"
            />
          ) : (
            <picture>
              <source
                type="image/avif"
                srcSet={`/images/wedding/${prefix}-640w.avif 640w, /images/wedding/${prefix}-1080w.avif 1080w, /images/wedding/${prefix}-1440w.avif 1440w, /images/wedding/${prefix}-1920w.avif 1920w`}
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 92vw, 1200px"
              />
              <source
                type="image/webp"
                srcSet={`/images/wedding/${prefix}-640w.webp 640w, /images/wedding/${prefix}-1080w.webp 1080w, /images/wedding/${prefix}-1440w.webp 1440w, /images/wedding/${prefix}-1920w.webp 1920w`}
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 92vw, 1200px"
              />
              <img
                src={`/images/wedding/${prefix}-1080w.jpg`}
                srcSet={`/images/wedding/${prefix}-640w.jpg 640w, /images/wedding/${prefix}-1080w.jpg 1080w, /images/wedding/${prefix}-1440w.jpg 1440w, /images/wedding/${prefix}-1920w.jpg 1920w`}
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 92vw, 1200px"
                alt={alt}
                width={1079}
                height={715}
                loading="lazy"
                decoding="async"
              />
            </picture>
          )}
        </div>

        {/* Caption */}
        <div className="editorial-photo-break__caption">
          <span className="editorial-photo-break__caption-script">
            Patrício &amp; Evandria
          </span>
          <span className="editorial-photo-break__caption-label">
            21 de novembro de 2026 &bull; Nova Veneza
          </span>
        </div>

      </div>
    </div>
  );
};

