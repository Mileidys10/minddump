import { Routes } from '@angular/router';
import {
  InicioComponent,
  InboxComponent,
  EspaciosComponent,
  EspacioDetalleComponent,
  NotasComponent,
  TareasComponent,
  EventosComponent,
  BusquedaComponent,
  ConfiguracionComponent
} from './components';
import { LoginComponent } from './components/auth/login.component';
import { authGuard } from './services/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'inicio', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'inicio', component: InicioComponent, canActivate: [authGuard] },
  { path: 'inbox', component: InboxComponent, canActivate: [authGuard] },
  { path: 'espacios', component: EspaciosComponent, canActivate: [authGuard] },
  { path: 'espacios/:id', component: EspacioDetalleComponent, canActivate: [authGuard] },
  { path: 'notas', component: NotasComponent, canActivate: [authGuard] },
  { path: 'tareas', component: TareasComponent, canActivate: [authGuard] },
  { path: 'eventos', component: EventosComponent, canActivate: [authGuard] },
  { path: 'busqueda', component: BusquedaComponent, canActivate: [authGuard] },
  { path: 'configuracion', component: ConfiguracionComponent, canActivate: [authGuard] },
  { path: '**', redirectTo: 'inicio' }
];
