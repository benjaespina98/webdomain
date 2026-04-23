import { TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
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
    imports: [FormsModule, RouterTestingModule],
    declarations: [AppComponent, SplitComponent],
    providers: [{ provide: SwUpdate, useValue: swUpdateMock }]
  }));

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render split component', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('app-split')).toBeTruthy();
  });
});
