import { TestBed } from '@angular/core/testing';
import { Router, UrlTree } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { landingGuard, markLandingSeen } from './landing.guard';

describe('landingGuard', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ imports: [RouterTestingModule] });
  });

  afterEach(() => localStorage.clear());

  const run = () => TestBed.runInInjectionContext(() => landingGuard({} as never, {} as never));

  it('muestra la landing a quien llega por primera vez', () => {
    expect(run()).toBeTrue();
  });

  it('redirige a /app después de haber visto la landing', () => {
    markLandingSeen();
    const result = run() as UrlTree;
    expect(TestBed.inject(Router).serializeUrl(result)).toBe('/app');
  });

  it('redirige a /app si ya hay una sesión guardada', () => {
    localStorage.setItem('dividimos_app_state', '{}');
    const result = run() as UrlTree;
    expect(TestBed.inject(Router).serializeUrl(result)).toBe('/app');
  });
});
