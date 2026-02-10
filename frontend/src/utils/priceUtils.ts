import { Racket } from '@/types/racket';

export interface LowestPriceInfo {
  price: number;
  originalPrice: number;
  discount: number;
  store: string;
  link: string;
}

/**
 * Obtiene el precio más bajo entre todas las tiendas disponibles para una pala
 * @param racket La pala de la que obtener el precio más bajo
 * @returns Información del precio más bajo o null si no hay precios disponibles
 */
export const getLowestPrice = (racket: Racket): LowestPriceInfo | null => {
  const stores = [
    {
      name: 'Padel Nuestro',
      price: racket.padelnuestro_precio_actual,
      originalPrice: racket.padelnuestro_precio_original,
      discount: racket.padelnuestro_descuento_porcentaje,
      link: racket.padelnuestro_enlace,
    },
    {
      name: 'Padel Market',
      price: racket.padelmarket_precio_actual,
      originalPrice: racket.padelmarket_precio_original,
      discount: racket.padelmarket_descuento_porcentaje,
      link: racket.padelmarket_enlace,
    },
    {
      name: 'Padel Pro Shop',
      price: racket.padelproshop_precio_actual,
      originalPrice: racket.padelproshop_precio_original,
      discount: racket.padelproshop_descuento_porcentaje,
      link: racket.padelproshop_enlace,
    },
  ];

  // Filtrar tiendas que tienen precio y enlace válidos
  const validStores = stores.filter(store => store.price && store.price > 0 && store.link);

  if (validStores.length === 0) {
    return null;
  }

  // Encontrar la tienda con el precio más bajo
  const lowestPriceStore = validStores.reduce((prev, current) => {
    return (current.price || 0) < (prev.price || 0) ? current : prev;
  });

  return {
    price: lowestPriceStore.price || 0,
    originalPrice: lowestPriceStore.originalPrice || 0,
    discount: lowestPriceStore.discount || 0,
    store: lowestPriceStore.name,
    link: lowestPriceStore.link || '',
  };
};

/**
 * Formatea el precio con el símbolo de euro
 * @param price El precio a formatear
 * @returns El precio formateado como string
 */
export const formatPrice = (price: number): string => {
  return `€${price.toFixed(2)}`;
};

export interface StorePriceInfo {
  store: string;
  price: number | null | undefined;
  originalPrice: number | null | undefined;
  discount: number | null | undefined;
  link: string | null | undefined;
  available: boolean;
}

/**
 * Obtiene todos los precios disponibles de todas las tiendas para una pala
 * @param racket La pala de la que obtener los precios
 * @returns Array con la información de precios de todas las tiendas
 */
export const getAllStorePrices = (racket: Racket): StorePriceInfo[] => {
  return [
    {
      store: 'Padel Nuestro',
      price: racket.padelnuestro_precio_actual,
      originalPrice: racket.padelnuestro_precio_original,
      discount: racket.padelnuestro_descuento_porcentaje,
      link: racket.padelnuestro_enlace,
      available: !!(racket.padelnuestro_precio_actual && racket.padelnuestro_enlace),
    },
    {
      store: 'Padel Market',
      price: racket.padelmarket_precio_actual,
      originalPrice: racket.padelmarket_precio_original,
      discount: racket.padelmarket_descuento_porcentaje,
      link: racket.padelmarket_enlace,
      available: !!(racket.padelmarket_precio_actual && racket.padelmarket_enlace),
    },
    {
      store: 'Padel Pro Shop',
      price: racket.padelproshop_precio_actual,
      originalPrice: racket.padelproshop_precio_original,
      discount: racket.padelproshop_descuento_porcentaje,
      link: racket.padelproshop_enlace,
      available: !!(racket.padelproshop_precio_actual && racket.padelproshop_enlace),
    },
  ];
};
