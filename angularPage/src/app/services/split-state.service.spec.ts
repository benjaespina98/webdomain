import { TestBed } from '@angular/core/testing';
import { SplitStateService } from './split-state.service';
import { AppState, PersistenceService } from './persistence.service';

describe('SplitStateService', () => {
  let service: SplitStateService;
  let persistenceService: PersistenceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    persistenceService = TestBed.inject(PersistenceService);
    service = TestBed.inject(SplitStateService);
  });

  afterEach(() => {
    persistenceService.clearState();
  });

  /**
   * Regresión: el `effect()` de persistencia corre una primera vez apenas se
   * construye el servicio, con las signals en sus valores por defecto (todo
   * vacío), antes de que `initialize()` llegue a aplicar lo que haya en
   * `localStorage` o lo que un enlace compartido acaba de guardar ahí (ver
   * `ShareComponent`). Si esa primera corrida persistiera, pisaría cualquier
   * sesión existente con un estado vacío antes de que el componente la lea.
   */
  it('no pisa una sesión ya guardada en localStorage con el estado vacío inicial antes de initialize()', () => {
    const existing: AppState = {
      schemaVersion: 2,
      people: ['Ana', 'Beto'],
      expenseItems: [{ id: 1, description: 'Cena', amount: 1000, paidBy: 'Ana', participants: ['Ana', 'Beto'] }],
      newPersonName: '',
      newExpenseDescription: '',
      newExpenseAmount: null,
      newExpensePaidBy: '',
      splitMode: 'all',
      selectedParticipants: ['Ana', 'Beto'],
      nextExpenseId: 2,
      currentLanguage: 'es',
      isSharedView: false,
      currency: '$',
      savedAt: Date.now()
    };
    persistenceService.saveState(existing, existing.savedAt);

    // `service` ya fue construido en beforeEach, así que su effect de persistencia
    // ya está registrado con las signals en sus valores por defecto (todo vacío).
    // Forzamos un flush acá — el mismo tick que en la app real corre entre que se
    // construye SplitStateService y que SplitComponent.ngOnInit llega a leer
    // localStorage — para reproducir la ventana exacta en la que ese estado vacío
    // podía pisar lo que ya había guardado.
    TestBed.flushEffects();

    const saved = persistenceService.loadState();
    service.initialize(saved);

    expect(service.people()).toEqual(['Ana', 'Beto']);
    expect(service.expenseItems().length).toBe(1);

    const persistedAfter = persistenceService.loadState();
    expect(persistedAfter?.people).toEqual(['Ana', 'Beto']);
    expect(persistedAfter?.expenseItems.length).toBe(1);
  });

  it('persiste cambios normalmente después de initialize()', () => {
    service.initialize(null);
    service.people.set(['Nueva Persona']);
    TestBed.flushEffects();

    const persisted = persistenceService.loadState();
    expect(persisted?.people).toEqual(['Nueva Persona']);
  });
});
