import { Injectable } from '@angular/core';

export interface AppState {
  schemaVersion: number;
  people: string[];
  expenseItems: any[];
  newPersonName: string;
  newExpenseDescription: string;
  newExpenseAmount: number | null;
  newExpensePaidBy: string;
  splitMode: 'all' | 'custom';
  selectedParticipants: string[];
  nextExpenseId: number;
  workflowStage: 'participants' | 'expenses' | 'results';
  hasUnlockedExpenses: boolean;
  currentLanguage: 'es' | 'en';
}

@Injectable({
  providedIn: 'root'
})
export class PersistenceService {
  private readonly storageKey = 'dividimos_app_state';
  private readonly currentSchemaVersion = 1;

  constructor() {}

  saveState(state: Omit<AppState, 'schemaVersion'>): void {
    try {
      const fullState: AppState = {
        ...state,
        schemaVersion: this.currentSchemaVersion
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
      
      // Validate schema version
      if (!parsed || parsed.schemaVersion !== this.currentSchemaVersion) {
        console.warn('Stale or invalid schema version detected. Clearing state.');
        this.clearState();
        return null;
      }

      return parsed;
    } catch (error) {
      console.error('Failed to read state from localStorage:', error);
      // Clean up corrupt storage
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
