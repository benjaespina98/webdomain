import { TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { SwUpdate } from '@angular/service-worker';
import { EMPTY } from 'rxjs';
import { AppComponent } from './app.component';
import { SplitComponent } from './split/split.component';

describe('AppComponent', () => {
  const swUpdateMock = {
    isEnabled: false,
    versionUpdates: EMPTY,
    checkForUpdate: jasmine.createSpy('checkForUpdate').and.resolveTo(false),
    activateUpdate: jasmine.createSpy('activateUpdate').and.resolveTo(true)
  };

  beforeEach(() => TestBed.configureTestingModule({
    imports: [
      FormsModule,
      RouterTestingModule.withRoutes([{ path: '', component: SplitComponent }])
    ],
    declarations: [AppComponent, SplitComponent],
    providers: [{ provide: SwUpdate, useValue: swUpdateMock }]
  }));

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render the routed component through router-outlet', async () => {
    const fixture = TestBed.createComponent(AppComponent);
    const router = TestBed.inject(Router);
    await router.navigate(['']);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('app-split')).toBeTruthy();
  });
});
