import { Injectable } from '@angular/core';
import posthog from 'posthog-js';
import { environment } from '../../environments/environment';

export type AnalyticsEvent =
  | 'app_opened'
  | 'participant_added'
  | 'expense_added'
  | 'results_generated'
  | 'share_clicked'
  | 'summary_copied'
  | 'session_cleared';

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
      capture_pageview: false,
      autocapture: false
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
