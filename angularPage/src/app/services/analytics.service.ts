import { Injectable } from '@angular/core';
import posthog from 'posthog-js';
import type { CaptureResult } from 'posthog-js';
import { environment } from '../../environments/environment';

export type AnalyticsEvent =
  | 'app_opened'
  | 'participant_added'
  | 'expense_added'
  | 'results_generated'
  | 'share_clicked'
  | 'summary_copied'
  | 'session_cleared'
  | 'voice_expense_dictated'
  | 'summary_image_downloaded'
  | 'coffee_clicked';

/** Deja solo origen y ruta: sin `?query` ni `#fragmento`. */
export function stripUrlDetails(value: string): string {
  try {
    const url = new URL(value);
    return `${url.origin}${url.pathname}`;
  } catch {
    return value.split(/[?#]/)[0];
  }
}

function scrubProperties(properties: Record<string, unknown> | undefined): void {
  if (!properties) {
    return;
  }

  for (const [key, value] of Object.entries(properties)) {
    if (typeof value === 'string' && /url|referrer/i.test(key)) {
      properties[key] = stripUrlDetails(value);
    }
  }
}

/**
 * PostHog agrega a cada evento la dirección completa de la página (`$current_url`) y de dónde venía
 * (`$referrer`). Los enlaces compartidos llevan los datos del reparto en el fragmento (`#data=…`) y
 * WhatsApp puede incluirlos en el referrer: sin este filtro, nombres y montos terminarían en
 * PostHog. Se recorta toda propiedad de URL a origen + ruta antes de enviar.
 */
export function scrubEvent(event: CaptureResult | null): CaptureResult | null {
  if (event) {
    scrubProperties(event.properties);
    scrubProperties(event.$set);
    scrubProperties(event.$set_once);
  }

  return event;
}

/**
 * Contador de uso anónimo. Solo se envían eventos con nombre (sin datos de gastos ni de personas),
 * sin grabación de sesiones, sin captura automática de clics y con las URL recortadas.
 */
@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {
  private initialized = false;

  init(): void {
    if (this.initialized || !environment.posthogApiKey) {
      return;
    }

    posthog.init(environment.posthogApiKey, {
      api_host: environment.posthogHost,
      person_profiles: 'identified_only',
      persistence: 'localStorage',
      capture_pageview: false,
      capture_pageleave: false,
      autocapture: false,
      disable_session_recording: true,
      disable_surveys: true,
      before_send: scrubEvent
    });

    this.initialized = true;
  }

  track(event: AnalyticsEvent): void {
    if (!this.initialized) {
      return;
    }

    posthog.capture(event);
  }
}
