import { TestBed } from '@angular/core/testing';
import { PersistenceService } from './persistence.service';

describe('PersistenceService', () => {
  let service: PersistenceService;
  const key = 'dividimos_app_state';

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(PersistenceService);
  });

  afterEach(() => localStorage.clear());

  it('guarda y vuelve a leer una sesión', () => {
    service.saveState({
      people: ['Ana'], expenseItems: [], newPersonName: '', newExpenseDescription: '', newExpenseAmount: null,
      newExpensePaidBy: '', splitMode: 'all', selectedParticipants: ['Ana'], nextExpenseId: 1,
      currentLanguage: 'es', isSharedView: false, currency: '$'
    });

    expect(service.loadState()?.people).toEqual(['Ana']);
  });

  it('migra una sesión de una versión anterior en vez de borrarla', () => {
    localStorage.setItem(key, JSON.stringify({
      schemaVersion: 1,
      people: ['Ana', 'Beto'],
      expenseItems: [{ id: 3, description: 'Cena', amount: 100, paidBy: 'Ana', participants: ['Ana', 'Beto'] }]
    }));

    const state = service.loadState();

    expect(state?.people).toEqual(['Ana', 'Beto']);
    expect(state?.expenseItems.length).toBe(1);
    expect(state?.schemaVersion).toBe(2);
    expect(state?.nextExpenseId).toBe(4);
    expect(state?.splitMode).toBe('all');
    expect(state?.currentLanguage).toBe('es');
  });

  it('descarta solo los gastos mal formados', () => {
    localStorage.setItem(key, JSON.stringify({
      schemaVersion: 2,
      people: ['Ana'],
      expenseItems: [
        { id: 1, description: 'Ok', amount: 10, paidBy: 'Ana', participants: ['Ana'] },
        { id: 2, description: 'Roto', amount: 'x', paidBy: 'Ana', participants: ['Ana'] },
        null
      ]
    }));

    expect(service.loadState()?.expenseItems.map((item) => item.id)).toEqual([1]);
  });

  it('ignora sin borrar una sesión de una versión más nueva', () => {
    localStorage.setItem(key, JSON.stringify({ schemaVersion: 99, people: ['Ana'] }));

    expect(service.loadState()).toBeNull();
    expect(localStorage.getItem(key)).not.toBeNull();
  });

  it('borra una sesión corrupta', () => {
    localStorage.setItem(key, '{no es json');

    expect(service.loadState()).toBeNull();
    expect(localStorage.getItem(key)).toBeNull();
  });
});
