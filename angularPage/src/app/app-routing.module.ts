import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SplitComponent } from './split/split.component';
import { LandingComponent } from './landing/landing.component';
import { ShareComponent } from './share/share.component';

const routes: Routes = [
  {
    path: '',
    component: LandingComponent,
    data: {
      title: 'dividimos? - Dividí gastos grupales fácil y rápido',
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

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
