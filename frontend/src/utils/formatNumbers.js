// Función para formatear números con formato argentino/español
// Separador de miles: punto (.)
// Separador decimal: coma (,)

export const formatNumber = (number, decimals = 2) => {
  if (number === null || number === undefined || number === '') {
    return '0';
  }
  
  const num = parseFloat(number);
  if (isNaN(num)) {
    return '0';
  }
  
  return num.toLocaleString('es-AR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
};

// Función específica para montos de dinero (siempre con 2 decimales)
export const formatCurrency = (amount) => {
  return formatNumber(amount, 2);
};

// Función para números enteros (sin decimales)
export const formatInteger = (number) => {
  return formatNumber(number, 0);
};

// Función para kilogramos (sin decimales generalmente)
export const formatKg = (kg) => {
  return formatNumber(kg, 0);
};

// Función para precios por kg (con 2 decimales)
export const formatPrice = (price) => {
  return formatNumber(price, 2);
};