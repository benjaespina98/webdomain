import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, provideRouter } from '@angular/router';

import { ShareComponent } from './share.component';
import { ShareService } from '../services/share.service';
import { PersistenceService, PersistableState } from '../services/persistence.service';

describe('ShareComponent', () => {
  const ownSession: PersistableState = {
    people: ['Ana', 'Beto'], expenseItems: [{ id: 1, description: 'Cena', amount: 100, paidBy: 'Ana', participants: ['Ana', 'Beto'] }],
    newPersonName: '', newExpenseDescription: '', newExpenseAmount: null, newExpensePaidBy: '',
    splitMode: 'all', selectedParticipants: ['Ana', 'Beto'], nextExpenseId: 2, currentLanguage: 'es', isSharedView: false, currency: '$'
  };
  // Formato compacto que arma la app al compartir: personas, y gastos con el pagador por índice.
  const sharedPayload = { p: ['Caro', 'Dani'], e: [{ d: 'Uber', a: 50, b: 0 }], c: '$' };

  let fragment: string | null;
  let navigate: jasmine.Spy;
  let persistence: PersistenceService;

  beforeEach(() => {
    localStorage.clear();
    fragment = null;
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { snapshot: { get fragment() { return fragment; }, queryParamMap: { get: () => null } } } }
      ]
    });
    navigate = spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);
    persistence = TestBed.inject(PersistenceService);
    fragment = new URL(TestBed.inject(ShareService).buildShareUrl(sharedPayload)).hash.slice(1);
  });

  afterEach(() => localStorage.clear());

  it('muestra el enlace aunque ya haya una sesión propia, y la respalda para poder volver', () => {
    persistence.saveState(ownSession);

    TestBed.createComponent(ShareComponent).detectChanges();

    expect(persistence.loadState()?.isSharedView).toBeTrue();
    expect(persistence.loadState()?.people).toEqual(['Caro', 'Dani']);
    expect(persistence.hasBackup()).toBeTrue();
    expect(persistence.takeBackup()?.people).toEqual(['Ana', 'Beto']);
    expect(navigate).toHaveBeenCalledWith(['/app']);
  });

  it('un segundo respaldo no pisa al primero', () => {
    persistence.saveState(ownSession);
    persistence.backupState();
    persistence.saveState({ ...ownSession, people: ['Copia'] });

    TestBed.createComponent(ShareComponent).detectChanges();

    expect(persistence.takeBackup()?.people).toEqual(['Copia']);
    expect(persistence.takeBackup()?.people).toEqual(['Ana', 'Beto']);
    expect(persistence.hasBackup()).toBeFalse();
  });

  it('lee un respaldo guardado con el formato anterior (una sola sesión)', () => {
    localStorage.setItem('dividimos_app_state_backup', JSON.stringify({ ...ownSession, schemaVersion: 2 }));

    expect(persistence.takeBackup()?.people).toEqual(['Ana', 'Beto']);
    expect(persistence.hasBackup()).toBeFalse();
  });

  it('sin sesión previa no crea ningún respaldo', () => {
    TestBed.createComponent(ShareComponent).detectChanges();

    expect(persistence.loadState()?.people).toEqual(['Caro', 'Dani']);
    expect(persistence.hasBackup()).toBeFalse();
  });

  it('si lo que había era otra vista compartida, no la respalda como si fuera propia', () => {
    persistence.saveState({ ...ownSession, isSharedView: true });

    TestBed.createComponent(ShareComponent).detectChanges();

    expect(persistence.hasBackup()).toBeFalse();
  });

  it('un enlace inválido manda a /app con aviso y no toca la sesión propia', () => {
    persistence.saveState(ownSession);
    fragment = 'data=basura&v=4';

    TestBed.createComponent(ShareComponent).detectChanges();

    expect(persistence.loadState()?.people).toEqual(['Ana', 'Beto']);
    expect(navigate).toHaveBeenCalledWith(['/app'], { queryParams: { shareError: 1 } });
  });
});
