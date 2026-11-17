import { expenseEmoji, guessExpense } from './expense-guess.util';

describe('guessExpense', () => {
  it('elige el emoji de lo que se escribió, no solo el de la categoría', () => {
    expect(guessExpense('Hamburguesas')).toEqual({ emoji: '🍔', category: 'food' });
    expect(guessExpense('Pizza')).toEqual({ emoji: '🍕', category: 'food' });
    expect(guessExpense('Asado del sábado')).toEqual({ emoji: '🥩', category: 'food' });
    expect(guessExpense('Cerveza')).toEqual({ emoji: '🍺', category: 'drink' });
    expect(guessExpense('Uber')).toEqual({ emoji: '🚕', category: 'transport' });
    expect(guessExpense('Nafta')).toEqual({ emoji: '⛽', category: 'transport' });
    expect(guessExpense('Hotel')).toEqual({ emoji: '🏨', category: 'stay' });
  });

  it('ignora mayúsculas, tildes y plurales', () => {
    expect(guessExpense('CAFÉ')?.emoji).toBe('☕');
    expect(guessExpense('café con leche')?.emoji).toBe('☕');
    expect(guessExpense('Birras')?.emoji).toBe('🍺');
    expect(guessExpense('Empanadas')?.emoji).toBe('🥟');
  });

  it('compara palabras completas: "bar" no se activa con "barrio" ni "dia" con "media"', () => {
    expect(guessExpense('Barrio norte')).toBeNull();
    expect(guessExpense('Día de campo')).toBeNull();
    expect(guessExpense('Media hora')).toBeNull();
    expect(guessExpense('Bar de Juan')?.category).toBe('drink');
  });

  it('devuelve null si no reconoce nada', () => {
    expect(guessExpense('')).toBeNull();
    expect(guessExpense('   ')).toBeNull();
    expect(guessExpense('Varios')).toBeNull();
  });

  it('prioriza lo específico: el asado es comida aunque diga carne', () => {
    expect(guessExpense('Carne para el asado')?.emoji).toBe('🥩');
    expect(guessExpense('Carne para el asado')?.category).toBe('food');
  });
});

describe('expenseEmoji', () => {
  it('usa el emoji específico cuando coincide con la categoría o no hay una elegida', () => {
    expect(expenseEmoji('Hamburguesa', 'food')).toBe('🍔');
    expect(expenseEmoji('Hamburguesa', undefined)).toBe('🍔');
    expect(expenseEmoji('Hamburguesa', 'other')).toBe('🍔');
  });

  it('respeta la categoría elegida a mano si contradice lo escrito', () => {
    expect(expenseEmoji('Cena', 'drink')).toBe('🍻');
  });

  it('cae al emoji de la categoría cuando no reconoce la descripción', () => {
    expect(expenseEmoji('Varios', 'transport')).toBe('🚗');
    expect(expenseEmoji('Varios', 'food')).toBe('🍽️');
    expect(expenseEmoji('Varios', undefined)).toBe('📦');
  });
});
