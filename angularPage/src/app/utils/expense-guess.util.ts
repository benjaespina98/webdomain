import { EXPENSE_CATEGORIES, ExpenseCategory } from '../models/expense.model';

export interface ExpenseGuess {
  emoji: string;
  category: ExpenseCategory;
}

interface Rule {
  emoji: string;
  category: ExpenseCategory;
  /** Palabras completas, en minúsculas y sin tildes. El plural (-s / -es) se acepta solo. */
  words: string[];
}

/**
 * Reglas en orden de prioridad: la primera que coincide gana, así que lo más específico va antes
 * ("asado" 🥩 antes que "comida" 🍽️). Se compara por palabra completa: "bar" no puede
 * activarse con "barrio" ni "dia" con "media".
 */
const RULES: readonly Rule[] = [
  // ── comida ──
  { emoji: '🍕', category: 'food', words: ['pizza', 'pizzeria', 'muzzarella', 'fugazzeta'] },
  { emoji: '🍔', category: 'food', words: ['hamburguesa', 'burger', 'mcdonald', 'mcdonalds', 'burgerking', 'lomito', 'lomo'] },
  { emoji: '🥪', category: 'food', words: ['sandwich', 'sanguche', 'tostado', 'tostados', 'panchito', 'pancho', 'hotdog'] },
  { emoji: '🥩', category: 'food', words: ['asado', 'parrilla', 'parrillada', 'choripan', 'chori', 'bife', 'entrana', 'vacio', 'costilla', 'matambre'] },
  { emoji: '🍗', category: 'food', words: ['pollo', 'milanesa', 'milanga', 'suprema'] },
  { emoji: '🥟', category: 'food', words: ['empanada', 'empanadas'] },
  { emoji: '🍣', category: 'food', words: ['sushi', 'japones', 'japonesa', 'ramen'] },
  { emoji: '🍝', category: 'food', words: ['pasta', 'fideos', 'ravioles', 'noquis', 'tallarines', 'lasagna', 'sorrentinos', 'canelones'] },
  { emoji: '🌮', category: 'food', words: ['taco', 'tacos', 'burrito', 'burritos', 'mexicano', 'nachos'] },
  { emoji: '🥗', category: 'food', words: ['ensalada', 'vegano', 'vegetariano'] },
  { emoji: '🍟', category: 'food', words: ['papas', 'fritas', 'papafritas'] },
  { emoji: '🍦', category: 'food', words: ['helado', 'heladeria', 'freddo'] },
  { emoji: '🍰', category: 'food', words: ['torta', 'postre', 'tarta', 'flan', 'brownie', 'chocotorta', 'pastel'] },
  { emoji: '🍫', category: 'food', words: ['chocolate', 'alfajor', 'golosinas', 'kiosco', 'kiosko'] },
  { emoji: '🥐', category: 'food', words: ['desayuno', 'merienda', 'medialuna', 'medialunas', 'facturas', 'brunch', 'tostadas'] },
  { emoji: '🧀', category: 'food', words: ['picada', 'fiambre', 'fiambres', 'queso'] },
  { emoji: '🥖', category: 'food', words: ['panaderia', 'pan'] },
  { emoji: '🍽️', category: 'food', words: ['cena', 'almuerzo', 'comida', 'comidas', 'restaurante', 'restaurant', 'resto', 'menu', 'bodegon', 'rotiseria', 'delivery', 'pedidosya', 'rappi', 'comer', 'cenar', 'almorzar', 'tenedor', 'propina'] },

  // ── bebidas ──
  { emoji: '🍺', category: 'drink', words: ['cerveza', 'cervezas', 'birra', 'birras', 'chopp', 'chop', 'quilmes', 'patagonia', 'stella', 'heineken', 'brahma', 'corona', 'imperial', 'andes'] },
  { emoji: '🍷', category: 'drink', words: ['vino', 'vinos', 'malbec', 'tinto', 'blanco', 'rosado', 'bodega', 'espumante'] },
  { emoji: '🥂', category: 'drink', words: ['champagne', 'champan', 'brindis', 'chandon', 'sidra'] },
  { emoji: '🍹', category: 'drink', words: ['trago', 'tragos', 'fernet', 'gin', 'gintonic', 'whisky', 'ron', 'vodka', 'campari', 'aperol', 'cocktail', 'coctel', 'mojito', 'daiquiri', 'alcohol', 'tequila'] },
  { emoji: '☕', category: 'drink', words: ['cafe', 'cafecito', 'cortado', 'capuchino', 'cappuccino', 'latte', 'starbucks', 'coffee', 'submarino', 'mate', 'matecito'] },
  { emoji: '🥤', category: 'drink', words: ['gaseosa', 'gaseosas', 'coca', 'cocacola', 'sprite', 'fanta', 'pepsi', 'agua', 'jugo', 'jugos', 'licuado', 'limonada', 'bebida', 'bebidas', 'soda'] },
  { emoji: '🍻', category: 'drink', words: ['bar', 'pub', 'boliche', 'cervecería', 'cerveceria', 'previa'] },

  // ── supermercado ──
  { emoji: '🥦', category: 'supermarket', words: ['verduleria', 'verdura', 'verduras', 'frutas', 'fruta', 'feria', 'frutería', 'fruteria'] },
  { emoji: '🥩', category: 'supermarket', words: ['carniceria', 'carne', 'carnes'] },
  { emoji: '🛒', category: 'supermarket', words: ['super', 'supermercado', 'mercado', 'chino', 'chinos', 'coto', 'carrefour', 'vea', 'jumbo', 'walmart', 'changomas', 'compras', 'compra', 'almacen', 'mayorista', 'maxiconsumo', 'diarco'] },

  // ── transporte ──
  { emoji: '🚕', category: 'transport', words: ['uber', 'taxi', 'remis', 'cabify', 'didi'] },
  { emoji: '⛽', category: 'transport', words: ['nafta', 'combustible', 'gasoil', 'gasolina', 'ypf', 'shell', 'axion', 'gnc'] },
  { emoji: '🛣️', category: 'transport', words: ['peaje', 'peajes', 'autopista'] },
  { emoji: '🅿️', category: 'transport', words: ['estacionamiento', 'cochera', 'garage', 'parking'] },
  { emoji: '🚌', category: 'transport', words: ['colectivo', 'bondi', 'micro', 'subte', 'tren', 'sube', 'omnibus', 'bus', 'transporte'] },
  { emoji: '✈️', category: 'transport', words: ['avion', 'vuelo', 'vuelos', 'aereo', 'aeropuerto', 'aerolineas', 'flybondi', 'jetsmart', 'pasaje', 'pasajes', 'valija', 'equipaje'] },
  { emoji: '🚗', category: 'transport', words: ['auto', 'alquilerauto', 'rentacar', 'camioneta', 'mecanico', 'taller', 'lavadero'] },
  { emoji: '🛵', category: 'transport', words: ['moto', 'bici', 'bicicleta', 'monopatin', 'scooter'] },

  // ── hospedaje ──
  { emoji: '⛺', category: 'stay', words: ['camping', 'carpa', 'carpas', 'refugio'] },
  { emoji: '🏨', category: 'stay', words: ['hotel', 'hoteles', 'hostel', 'hospedaje', 'hosteria', 'posada', 'resort', 'alojamiento', 'estadia'] },
  { emoji: '🏠', category: 'stay', words: ['airbnb', 'booking', 'alquiler', 'depto', 'departamento', 'cabana', 'cabanas', 'bungalow', 'quinta', 'habitacion'] },

  // ── otros con emoji propio ──
  { emoji: '🎬', category: 'other', words: ['cine', 'pelicula', 'peliculas', 'netflix', 'teatro'] },
  { emoji: '🎟️', category: 'other', words: ['entrada', 'entradas', 'recital', 'show', 'festival', 'ticket', 'tickets', 'concierto', 'cancha', 'partido'] },
  { emoji: '🎂', category: 'other', words: ['cumple', 'cumpleanos', 'festejo', 'fiesta'] },
  { emoji: '🎁', category: 'other', words: ['regalo', 'regalos', 'obsequio'] },
  { emoji: '💊', category: 'other', words: ['farmacia', 'remedio', 'remedios', 'medicamento', 'medicamentos', 'botiquin'] },
  { emoji: '💡', category: 'other', words: ['luz', 'gas', 'internet', 'wifi', 'expensas', 'abl', 'cable', 'servicio', 'servicios', 'electricidad'] },
  { emoji: '🏖️', category: 'other', words: ['pileta', 'paseo', 'excursion', 'tour', 'sombrilla', 'reposera'] },
  { emoji: '🧹', category: 'other', words: ['limpieza', 'lavanderia', 'detergente'] },
  { emoji: '🎮', category: 'other', words: ['juego', 'juegos', 'playstation', 'steam', 'bowling', 'pool', 'karaoke'] }
];

const normalizeText = (value: string): string =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9ñ]+/g, ' ')
    .trim();

const FOLDED = RULES.map((rule) => ({
  ...rule,
  words: new Set(rule.words.map((word) => normalizeText(word)))
}));

/** Palabra tal cual o con plural simple (-s, -es): "birra" → "birras", "trago" → "tragos". */
function tokenMatches(token: string, words: Set<string>): boolean {
  return words.has(token)
    || (token.endsWith('s') && words.has(token.slice(0, -1)))
    || (token.endsWith('es') && words.has(token.slice(0, -2)));
}

/**
 * Qué tipo de gasto es y qué emoji le queda mejor según lo que escribió la persona
 * ("Hamburguesas" → 🍔, "Uber" → 🚕). `null` si no reconoce nada: ahí manda la categoría elegida.
 */
export function guessExpense(description: string): ExpenseGuess | null {
  const tokens = normalizeText(description).split(' ').filter(Boolean);
  if (tokens.length === 0) {
    return null;
  }

  for (const rule of FOLDED) {
    if (tokens.some((token) => tokenMatches(token, rule.words))) {
      return { emoji: rule.emoji, category: rule.category };
    }
  }

  return null;
}

/**
 * Emoji de un gasto ya cargado: el específico de lo que dice la descripción, siempre que no contradiga la
 * categoría que la persona eligió a mano; si no, el de su categoría.
 */
export function expenseEmoji(description: string, category: ExpenseCategory | undefined): string {
  const guess = guessExpense(description);
  const effective = category ?? 'other';

  if (guess && (effective === 'other' || guess.category === effective)) {
    return guess.emoji;
  }

  return (EXPENSE_CATEGORIES.find((option) => option.id === effective) ?? EXPENSE_CATEGORIES[EXPENSE_CATEGORIES.length - 1]).emoji;
}
