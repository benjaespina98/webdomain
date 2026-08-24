import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ShareService, SharePayload } from '../services/share.service';
import { PersistenceService, PersistableState } from '../services/persistence.service';
import { LanguageService } from '../services/language.service';

@Component({
  selector: 'app-share',
  template: `
    <div class="share-loader" role="status" aria-live="polite">
      <i class="fas fa-circle-notch fa-spin" aria-hidden="true"></i>
      <p class="share-loader-title">{{ isSpanish ? 'Abriendo la división compartida…' : 'Opening the shared split…' }}</p>
    </div>
  `,
  styles: [`
    .share-loader {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 1rem;
      min-height: 70vh;
      color: var(--text-muted, #94a3b8);
    }

    .share-loader i {
      font-size: 2.4rem;
      color: var(--accent, #8b5cf6);
    }

    .share-loader-title {
      margin: 0;
      font-size: 1rem;
      font-weight: 600;
      color: var(--text, #e2e8f0);
    }
  `]
})
export class ShareComponent implements OnInit {
  readonly isSpanish: boolean;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly shareService: ShareService,
    private readonly persistenceService: PersistenceService,
    private readonly languageService: LanguageService
  ) {
    this.isSpanish = this.languageService.isSpanish;
  }

  ngOnInit(): void {
    const data = this.route.snapshot.queryParamMap.get('data');
    const version = Number.parseInt(this.route.snapshot.queryParamMap.get('v') ?? '0', 10);
    const decoded = data ? this.shareService.decodeState<SharePayload>(data, version) : null;

    if (decoded?.p?.length) {
      this.persistenceService.saveState(this.toAppState(decoded));
      void this.router.navigate(['/app']);
      return;
    }

    // Enlace inválido o de una versión vieja: no pisamos la sesión local del usuario.
    void this.router.navigate(['/app'], { queryParams: { shareError: 1 } });
  }

  private toAppState(payload: SharePayload): PersistableState {
    const people = payload.p;
    const expenseItems = (payload.e ?? []).map((item, index) => ({
      id: index + 1,
      description: item.d,
      amount: item.a,
      paidBy: people[item.b] ?? people[0],
      participants: item.r ? item.r.map((i) => people[i]).filter(Boolean) : [...people]
    }));

    return {
      people,
      expenseItems,
      newPersonName: '',
      newExpenseDescription: '',
      newExpenseAmount: null,
      newExpensePaidBy: '',
      splitMode: 'all',
      selectedParticipants: [...people],
      nextExpenseId: expenseItems.length + 1,
      currentLanguage: this.languageService.current,
      isSharedView: true
    };
  }
}
