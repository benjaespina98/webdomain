import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ShareService, SharePayload } from '../services/share.service';
import { PersistenceService, AppState } from '../services/persistence.service';

@Component({
  selector: 'app-share',
  template: `
    <div class="d-flex flex-column align-items-center justify-content-center" role="status" aria-live="polite" style="min-height: 100vh; background-color: #020617; color: #cbd5e1;">
      <div class="text-center">
        <i class="fas fa-circle-notch fa-spin fa-3x text-primary mb-3" aria-hidden="true" style="color: #8b5cf6 !important;"></i>
        <p class="fs-5 fw-semibold mb-1">{{ isSpanish ? 'Cargando enlace compartido...' : 'Loading shared link...' }}</p>
        <p class="text-muted small">{{ isSpanish ? 'Restaurando participantes, gastos y saldos...' : 'Restoring participants, expenses, and balances...' }}</p>
      </div>
    </div>
  `
})
export class ShareComponent implements OnInit {
  isSpanish = true;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly shareService: ShareService,
    private readonly persistenceService: PersistenceService
  ) {
    const saved = localStorage.getItem('split-language');
    if (saved === 'es' || saved === 'en') {
      this.isSpanish = saved === 'es';
    } else {
      const browserLanguage = (navigator.languages?.[0] ?? navigator.language ?? 'es').toLowerCase();
      this.isSpanish = browserLanguage.startsWith('es');
    }
  }

  ngOnInit(): void {
    const data = this.route.snapshot.queryParamMap.get('data');
    const version = parseInt(this.route.snapshot.queryParamMap.get('v') ?? '0', 10);

    if (data) {
      const decoded = this.shareService.decodeState<SharePayload>(data, version);
      if (decoded) {
        this.persistenceService.saveState(this.toAppState(decoded));
      }
    }

    this.router.navigate(['/app']);
  }

  private toAppState(payload: SharePayload): Omit<AppState, 'schemaVersion'> {
    const expenseItems = payload.e.map((item, index) => ({
      id: index + 1,
      description: item.d,
      amount: item.a,
      paidBy: item.b,
      participants: item.r ?? payload.p
    }));

    const nextExpenseId = expenseItems.reduce((max, item) => Math.max(max, item.id), 0) + 1;

    return {
      people: payload.p,
      expenseItems,
      newPersonName: '',
      newExpenseDescription: '',
      newExpenseAmount: null,
      newExpensePaidBy: '',
      splitMode: 'all',
      selectedParticipants: payload.p,
      nextExpenseId,
      workflowStage: 'results',
      hasUnlockedExpenses: true,
      currentLanguage: this.isSpanish ? 'es' : 'en'
    };
  }
}
