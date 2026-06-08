/**
 * Redondea un valor al múltiplo de 100 más cercano.
 */
export const roundToNearestHundred = (value: number): number => {
  return Math.round(value / 100) * 100;
};

/**
 * Formatea un número como moneda local (Argentina).
 */
export const formatCurrency = (value: number): string => {
  console.log(`Formateando valor: ${value}`);
  return value.toLocaleString('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
};