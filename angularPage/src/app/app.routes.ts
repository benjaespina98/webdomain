import { Routes } from '@angular/router';
import { SplitComponent } from './split/split.component';
import { LandingComponent } from './landing/landing.component';
import { ShareComponent } from './share/share.component';
import { landingGuard } from './landing/landing.guard';

export const routes: Routes = [
  {
    path: '',
    component: LandingComponent,
    canActivate: [landingGuard],
    data: {
      title: 'dividimos? - Dividí gastos grupales fácil y rápido',
      description: 'Sin registros, sin backend y 100% offline. Dividí gastos grupales en segundos y compartí los resultados al instante.'
    }
  },
  {
    // La landing siempre accesible (el guard de "/" manda a /app a quien ya la vio).
    path: 'about',
    component: LandingComponent,
    data: {
      canonical: '/',
      title: 'dividimos? - Qué es y cómo funciona',
      description: 'Sin registros, sin backend y 100% offline. Dividí gastos grupales en segundos y compartí los resultados al instante.'
    }
  },
  {
    path: 'app',
    component: SplitComponent,
    data: {
      title: 'dividimos? - Calculadora de gastos compartidos',
      description: 'Sumá participantes, cargá gastos y calculá quién le debe a quién en segundos.'
    }
  },
  {
    path: 'share',
    component: ShareComponent,
    data: {
      title: 'dividimos? - Sesión compartida',
      description: 'Estás abriendo una división de gastos compartida por WhatsApp.'
    }
  },
  { path: 'split', redirectTo: 'app', pathMatch: 'full' },
  { path: '**', redirectTo: '' }
];
