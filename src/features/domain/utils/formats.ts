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

export const formatDateForInput = (timestamp: number) => {
        const d = new Date(timestamp);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };