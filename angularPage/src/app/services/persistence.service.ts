import { Injectable } from '@angular/core';
import { CurrencySymbol, ExpenseItem, SplitMode } from '../models/expense.model';
import { LanguageCode } from './language.service';

export interface AppState {
  schemaVersion: number;
  people: string[];
  expenseItems: ExpenseItem[];
  newPersonName: string;
  newExpenseDescription: string;
  newExpenseAmount: number | null;
  newExpensePaidBy: string;
  splitMode: SplitMode;
  selectedParticipants: string[];
  nextExpenseId: number;
  currentLanguage: LanguageCode;
  isSharedView: boolean;
  /** Opcional: las sesiones guardadas antes de agregar el selector de moneda no lo traen. */
  currency?: CurrencySymbol;
  savedAt?: number;
}

export type PersistableState = Omit<AppState, 'schemaVersion' | 'savedAt'>;

@Injectable({
  providedIn: 'root'
})
export class PersistenceService {
  private readonly storageKey = 'dividimos_app_state';
  private readonly currentSchemaVersion = 2;

  /**
   * `savedAt` marca la última interacción real del usuario. Se puede preservar
   * explícitamente para que restaurar una sesión no la vuelva a marcar como reciente.
   */
  saveState(state: PersistableState, savedAt: number = Date.now()): void {
    try {
      const fullState: AppState = {
        ...state,
        schemaVersion: this.currentSchemaVersion,
        savedAt
      };
      localStorage.setItem(this.storageKey, JSON.stringify(fullState));
    } catch (error) {
      console.error('Failed to save state to localStorage:', error);
    }
  }

  loadState(): AppState | null {
    try {
      const serialized = localStorage.getItem(this.storageKey);
      if (!serialized) {
        return null;
      }

      const parsed = JSON.parse(serialized) as AppState;

      if (!parsed || parsed.schemaVersion !== this.currentSchemaVersion || !Array.isArray(parsed.people)) {
        this.clearState();
        return null;
      }

      return parsed;
    } catch (error) {
      console.error('Failed to read state from localStorage:', error);
      this.clearState();
      return null;
    }
  }

  clearState(): void {
    try {
      localStorage.removeItem(this.storageKey);
    } catch (error) {
      console.error('Failed to clear state in localStorage:', error);
    }
  }
}
