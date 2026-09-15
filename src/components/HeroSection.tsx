import React from 'react';
import { Monogram } from './Monogram.js';
import { BotanicalFrame } from './BotanicalFrame.js';
import { CouplePhoto } from './CouplePhoto.js';
import { ScrollIndicator } from './ScrollIndicator.js';

interface HeroSectionProps {
  familyTitle?: string;
  couplePhotoSrc?: string;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  familyTitle,
  couplePhotoSrc,
}) => {
  return (
    <section className="hero" id="hero" aria-label="Convite de casamento">
      {/* Botanical corner decorations */}
      <BotanicalFrame variant="top-left" />
      <BotanicalFrame variant="top-right" />
      <BotanicalFrame variant="bottom-left" />
      <BotanicalFrame variant="bottom-right" />

      <div className="hero__inner">
        {/* ─── Text Content Column ─── */}
        <div className="hero__content">
          {/* Monogram */}
          <div className="hero__monogram hero-stagger-1">
            <Monogram variant="hero" />
          </div>

          {/* Names */}
          <div className="hero__names hero-stagger-2">
            <span className="hero__name">Patrício</span>
            <span className="hero__ampersand">&amp;</span>
            <span className="hero__name">Evandria</span>
          </div>

          {/* Date */}
          <div className="hero__date hero-stagger-3">
            21 &bull; 11 &bull; 2026
          </div>

          {/* Location */}
          <div className="hero__location hero-stagger-3">
            Nova Veneza &bull; Santa Catarina
          </div>

          {/* Divider */}
          <div className="hero__divider hero-stagger-4" />

          {/* Message */}
          <p className="hero__message hero-stagger-4">
            Com a bênção de Deus,<br />
            celebraremos o nosso amor.
          </p>

          {/* Family Badge */}
          {familyTitle && (
            <div className="hero__family hero-stagger-5">
              <span className="hero__family-label">Convite especial para</span>
              <span className="hero__family-name">{familyTitle}</span>
            </div>
          )}
        </div>

        {/* ─── Photo Column ─── */}
        <div className="hero__visual">
          <CouplePhoto src={couplePhotoSrc} />
        </div>
      </div>

      {/* Scroll Indicator */}
      <ScrollIndicator />
    </section>
  );
};
