import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ShareService } from '../services/share.service';
import { PersistenceService, AppState } from '../services/persistence.service';

@Component({
  selector: 'app-share',
  template: `
    <div class="d-flex flex-column align-items-center justify-content-center" style="min-height: 100vh; background-color: #020617; color: #cbd5e1;">
      <div class="text-center">
        <i class="fas fa-circle-notch fa-spin fa-3x text-primary mb-3" style="color: #8b5cf6 !important;"></i>
        <p class="fs-5 fw-semibold mb-1">Cargando enlace compartido...</p>
        <p class="text-muted small">Restaurando participantes, gastos y saldos...</p>
      </div>
    </div>
  `
})
export class ShareComponent implements OnInit {
  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly shareService: ShareService,
    private readonly persistenceService: PersistenceService
  ) {}

  ngOnInit(): void {
    const data = this.route.snapshot.queryParamMap.get('data');

    if (data) {
      const decoded = this.shareService.decodeState<Omit<AppState, 'schemaVersion'>>(data);
      if (decoded) {
        this.persistenceService.saveState(decoded);
      }
    }

    this.router.navigate(['/app']);
  }
}
