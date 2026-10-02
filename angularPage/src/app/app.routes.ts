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
      title: 'Dividir gastos entre amigos: calculadora gratis | dividimos?',
      description: 'Dividí los gastos de un asado, un viaje o una salida en segundos. Mirá quién le paga a quién y compartilo por WhatsApp. Gratis y sin registro.'
    }
  },
  {
    // La landing siempre accesible (el guard de "/" manda a /app a quien ya la vio).
    path: 'about',
    component: LandingComponent,
    data: {
      canonical: '/',
      title: 'Cómo funciona dividimos? | Dividir gastos sin registro',
      description: 'Cómo funciona dividimos?: sumá a la gente, cargá los gastos y mirá quién le paga a quién. Sin registro y con tus datos en tu navegador.'
    }
  },
  {
    path: 'app',
    component: SplitComponent,
    data: {
      title: 'Calculadora de gastos compartidos | dividimos?',
      description: 'Sumá a la gente, cargá los gastos y mirá quién le paga a quién. Reparto parejo o por montos, en pesos, dólares o euros.'
    }
  },
  {
    path: 'share',
    component: ShareComponent,
    data: {
      title: 'Resumen de gastos compartido | dividimos?',
      description: 'Estás abriendo una división de gastos compartida por WhatsApp.'
    }
  },
  { path: 'split', redirectTo: 'app', pathMatch: 'full' },
  { path: '**', redirectTo: '' }
];
