/**
 * Configuração centralizada para presentes via Pix
 */
export const PIX_CONFIG = {
  key: '48991567999',
  displayKey: '(48) 99156-7999',
  keyType: 'Celular',
  beneficiary: 'Evandria',
} as const;

export const PIX_KEY = PIX_CONFIG.key;
