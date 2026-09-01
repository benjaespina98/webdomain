import { Injectable, computed, effect, signal } from '@angular/core';
import { CurrencySymbol, ExpenseItem, SplitMode } from '../models/expense.model';
import { calculateSettlement, SettlementSummary } from '../utils/settlement.util';
import { AppState, PersistableState, PersistenceService } from './persistence.service';
import { LanguageCode } from './language.service';

/**
 * Única fuente de verdad del estado persistible de la sesión (personas, gastos,
 * borrador del formulario, moneda, etc.), expuesta como Signals.
 *
 * Antes, `SplitComponent` llamaba a `persistenceService.saveState()` a mano después
 * de cada uno de sus ~10 mutadores (agregar persona, tildar un participante, cambiar
 * de moneda...): bastaba con olvidar una llamada para que un cambio no sobreviviera
 * a un refresh. Acá alcanza con escribir la signal correspondiente: el `effect()`
 * del constructor reacciona solo y persiste todo junto, sin que el componente tenga
 * que acordarse de nada. Como beneficio extra, `settlement` es un `computed()`: el
 * motor de liquidación (`calculateSettlement`) se re-ejecuta automáticamente cuando
 * cambian `people` o `expenseItems`, así que tampoco hace falta invocar un
 * `calculateShares()` manual después de cada mutación.
 */
@Injectable({
  providedIn: 'root'
})
export class SplitStateService {
  readonly people = signal<string[]>([]);
  readonly expenseItems = signal<ExpenseItem[]>([]);
  readonly newPersonName = signal('');
  readonly newExpenseDescription = signal('');
  readonly newExpenseAmount = signal<number | null>(null);
  readonly newExpensePaidBy = signal('');
  readonly splitMode = signal<SplitMode>('all');
  readonly selectedParticipants = signal<string[]>([]);
  readonly nextExpenseId = signal(1);
  readonly isSharedView = signal(false);
  readonly currency = signal<CurrencySymbol>('$');
  readonly currentLanguage = signal<LanguageCode>('es');

  readonly settlement = computed<SettlementSummary>(() => calculateSettlement(this.people(), this.expenseItems()));

  /**
   * Timestamp a usar en la próxima escritura disparada por el effect; `null` indica
   * "es actividad real, usá `Date.now()`". Al restaurar una sesión lo dejamos en el
   * `savedAt` original para que retomarla no cuente como una interacción nueva
   * (si no, el aviso de "sesión vieja" nunca podría dispararse).
   */
  private pendingSavedAt: number | null = null;

  constructor(private readonly persistenceService: PersistenceService) {
    effect(() => {
      const snapshot = this.buildSnapshot();
      const savedAt = this.pendingSavedAt ?? Date.now();
      this.pendingSavedAt = null;
      this.persistenceService.saveState(snapshot, savedAt);
    });
  }

  /** Debe llamarse una única vez al arrancar el componente, con el resultado de `loadState()` (o `null`). */
  initialize(saved: AppState | null): void {
    if (saved) {
      this.pendingSavedAt = saved.savedAt ?? null;
      this.applyState(saved);
    }
  }

  /** Reemplaza toda la sesión de una sola vez: lo usan la restauración inicial, el undo y la importación de un enlace compartido. */
  applyState(state: PersistableState): void {
    this.people.set([...state.people]);
    this.expenseItems.set(state.expenseItems.map((item) => ({ ...item, participants: [...item.participants] })));
    this.newPersonName.set(state.newPersonName);
    this.newExpenseDescription.set(state.newExpenseDescription);
    this.newExpenseAmount.set(state.newExpenseAmount);
    this.newExpensePaidBy.set(state.newExpensePaidBy);
    this.splitMode.set(state.splitMode);
    this.selectedParticipants.set([...state.selectedParticipants]);
    this.nextExpenseId.set(state.nextExpenseId);
    this.isSharedView.set(state.isSharedView);
    this.currency.set(state.currency ?? '$');
    this.currentLanguage.set(state.currentLanguage);
  }

  private buildSnapshot(): PersistableState {
    return {
      people: this.people(),
      expenseItems: this.expenseItems(),
      newPersonName: this.newPersonName(),
      newExpenseDescription: this.newExpenseDescription(),
      newExpenseAmount: this.newExpenseAmount(),
      newExpensePaidBy: this.newExpensePaidBy(),
      splitMode: this.splitMode(),
      selectedParticipants: this.selectedParticipants(),
      nextExpenseId: this.nextExpenseId(),
      currentLanguage: this.currentLanguage(),
      isSharedView: this.isSharedView(),
      currency: this.currency()
    };
  }
}
