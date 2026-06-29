import { Component, OnDestroy } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { Subscription, interval, merge, fromEvent } from 'rxjs';
import { filter } from 'rxjs/operators';
import { AnalyticsService } from './services/analytics.service';
import { SeoService } from './services/seo.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  private readonly subscriptions = new Subscription();
  private isReloadingForUpdate = false;

  constructor(
    private readonly swUpdate: SwUpdate,
    private readonly analyticsService: AnalyticsService,
    private readonly seoService: SeoService,
    private readonly router: Router,
    private readonly activatedRoute: ActivatedRoute
  ) {
    this.analyticsService.init();
    this.analyticsService.track('app_opened');
    this.initializeAutoUpdates();
    this.initializeSeoTracking();
  }

  private initializeSeoTracking(): void {
    const routeChangeSubscription = this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe(() => {
        let route = this.activatedRoute.snapshot;
        while (route.firstChild) {
          route = route.firstChild;
        }

        const { title, description } = route.data as { title?: string; description?: string };
        if (title && description) {
          const path = route.url.map((segment) => segment.path).join('/');
          this.seoService.update({ title, description }, path ? `/${path}` : '/');
        }
      });

    this.subscriptions.add(routeChangeSubscription);
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  private initializeAutoUpdates(): void {
    if (!this.swUpdate.isEnabled) {
      return;
    }

    const versionReadySubscription = this.swUpdate.versionUpdates
      .pipe(filter((event): event is VersionReadyEvent => event.type === 'VERSION_READY'))
      .subscribe(() => {
        this.activateAndReload();
      });

    const versionFailedSubscription = this.swUpdate.versionUpdates
      .pipe(filter((event) => event.type === 'VERSION_INSTALLATION_FAILED'))
      .subscribe((event) => {
        console.error('SW version installation failed', event);
      });

    const unrecoverableSubscription = this.swUpdate.unrecoverable.subscribe((event) => {
      console.error('SW unrecoverable state', event.reason);
      this.safeReload();
    });

    const periodicCheckSubscription = interval(60_000).subscribe(() => {
      this.checkForUpdates();
    });

    const triggerEventsSubscription = merge(
      fromEvent(window, 'online'),
      fromEvent(document, 'visibilitychange')
    ).subscribe(() => {
      if (document.visibilityState === 'visible') {
        this.checkForUpdates();
      }
    });

    this.subscriptions.add(versionReadySubscription);
    this.subscriptions.add(versionFailedSubscription);
    this.subscriptions.add(unrecoverableSubscription);
    this.subscriptions.add(periodicCheckSubscription);
    this.subscriptions.add(triggerEventsSubscription);

    this.checkForUpdates();
  }

  private checkForUpdates(): void {
    void this.swUpdate.checkForUpdate().catch((error) => {
      console.error('SW update check failed', error);
    });
  }

  private activateAndReload(): void {
    if (this.isReloadingForUpdate) {
      return;
    }

    this.isReloadingForUpdate = true;

    void this.swUpdate.activateUpdate()
      .then(() => {
        this.safeReload();
      })
      .catch((error) => {
        this.isReloadingForUpdate = false;
        console.error('SW update activation failed', error);
      });
  }

  private safeReload(): void {
    if (this.isReloadingForUpdate) {
      document.location.reload();
      return;
    }

    this.isReloadingForUpdate = true;
    document.location.reload();
  }
}
