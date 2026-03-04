import { Component, OnDestroy } from '@angular/core';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { Subscription, interval, merge, fromEvent } from 'rxjs';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  private readonly subscriptions = new Subscription();

  constructor(private readonly swUpdate: SwUpdate) {
    this.initializeAutoUpdates();
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
    void this.swUpdate.activateUpdate()
      .then(() => {
        document.location.reload();
      })
      .catch((error) => {
        console.error('SW update activation failed', error);
      });
  }
}
