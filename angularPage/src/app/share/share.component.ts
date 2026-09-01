import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ShareService } from '../services/share.service';
import { PersistenceService } from '../services/persistence.service';
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
    const payload = data ? this.shareService.parseShareLink(data, version) : null;

    if (!payload) {
      // Enlace inválido, corrupto o de una versión vieja: no tocamos la sesión local del usuario.
      void this.router.navigate(['/app'], { queryParams: { shareError: 1 } });
      return;
    }

    const existingSession = this.persistenceService.loadState();
    const hasExistingSession = !!existingSession
      && (existingSession.people.length > 0 || existingSession.expenseItems.length > 0);

    if (hasExistingSession) {
      // Ya hay una sesión con datos: no la pisamos en silencio. Mandamos el enlace,
      // todavía sin aplicar, a /app para que SplitComponent pida confirmación antes
      // de reemplazar nada (ver `handleIncomingShareQueryParams`).
      void this.router.navigate(['/app'], { queryParams: { data, v: version, shareConflict: 1 } });
      return;
    }

    this.persistenceService.saveState(this.shareService.buildImportedState(payload, this.languageService.current));
    void this.router.navigate(['/app']);
  }
}
