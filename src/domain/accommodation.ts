/**
 * Módulo de Domínio Centralizado — Hospedagem & Hotel Bormon
 * 
 * Centraliza todos os dados de acomodação, tarifas, comodidades e
 * link de reserva via WhatsApp para convidados de outras cidades.
 */

export interface AccommodationRate {
  label: string;
  price: string;
  period: string;
}

export interface AccommodationRoom {
  id: string;
  name: string;
  capacity: string;
  highlight?: string;
  amenities: string[];
  rates: AccommodationRate[];
}

export interface HotelInfo {
  name: string;
  phoneDisplay: string;
  phoneRaw: string;
  whatsappUrl: string;
  whatsappMessage: string;
  breakfastIncluded: boolean;
  childPolicy: {
    freeUntilYears: number;
    description: string;
  };
  rooms: AccommodationRoom[];
}

const WHATSAPP_PHONE = '554834365470';
const WHATSAPP_PREFILLED_MESSAGE =
  'Olá! Sou convidado(a) do casamento de Patrício e Evandria e gostaria de consultar disponibilidade e realizar uma reserva para o período do casamento.';

export const ACCOMMODATION_DATA: HotelInfo = {
  name: 'Hotel Bormon',
  phoneDisplay: '+55 48 3436-5470',
  phoneRaw: WHATSAPP_PHONE,
  whatsappMessage: WHATSAPP_PREFILLED_MESSAGE,
  whatsappUrl: `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(WHATSAPP_PREFILLED_MESSAGE)}`,
  breakfastIncluded: true,
  childPolicy: {
    freeUntilYears: 6,
    description: 'Crianças até 6 anos: isento. A partir de 7 anos: tarifa integral.',
  },
  rooms: [
    {
      id: 'luxo',
      name: 'Apartamento Luxo',
      capacity: 'Até 3 pessoas',
      amenities: [
        'Ar-condicionado',
        'Frigobar',
        'Chuveiro a gás',
        'Cama box queen',
        'TV a cabo 42"',
        'Sacada com vista para as Serras Catarinenses e jardim',
      ],
      rates: [
        {
          label: 'Luxo Triplo ou Casal + Extra',
          price: 'R$ 465,00',
          period: 'diária',
        },
        {
          label: 'Luxo Casal + Extra',
          price: 'R$ 363,40',
          period: 'diária',
        },
      ],
    },
    {
      id: 'super-luxo-casal',
      name: 'Super Luxo Casal',
      capacity: 'Até 2 pessoas',
      amenities: [
        'Hidromassagem',
        'Ar-condicionado',
        'Frigobar',
        'Chuveiro a gás',
        'Cama box king',
        'TV 42"',
        'Sacada',
      ],
      rates: [
        {
          label: 'Super Luxo Casal',
          price: 'R$ 594,00',
          period: 'diária',
        },
      ],
    },
    {
      id: 'super-luxo-casal-extra',
      name: 'Super Luxo Casal + Extra',
      capacity: 'Até 3 pessoas',
      amenities: [
        'Hidromassagem',
        'Ar-condicionado',
        'Frigobar',
        'Chuveiro a gás',
        'Cama box king',
        'TV 42"',
        'Sacada',
      ],
      rates: [
        {
          label: 'Super Luxo Casal + Extra',
          price: 'R$ 685,40',
          period: 'diária',
        },
      ],
    },
  ],
};
