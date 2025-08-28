//src/app/app.routes.ts
import { Routes } from '@angular/router';
import { LoginLayoutComponent } from './auth/login/login-layout.component';

// Importa los nuevos componentes de menú
import { SecretariaMenuComponent } from './components/menu-secretaria/secretaria-menu.component';
import { SoporteMenuComponent } from './components/menu-soporte/soporte-menu.component';
import { AdminMenuComponent } from './components/menu-admin/admin-menu.component';

import { ClientesComponent } from './components/cliente-listar/cliente-listar.component';
import { ClienteInsertarComponent } from './components/cliente-insertar/cliente-insertar.component';
import { ClienteEditarComponent } from './components/cliente-editar/cliente-editar.component';
import { LotesComponent } from './components/lote/lote.component';
import { ContratoListarComponent } from './components/contrato-listar/contrato-listar.component';
import { ContratoInsertarComponent } from './components/contrato-insertar/contrato-insertar.component';
import { ParceleroComponent } from './components/parcelero/parcelero';
import { VendedorComponent } from './components/vendedor/vendedor';

export const routes: Routes = [
  { path: 'login', component: LoginLayoutComponent },
  { path: '', redirectTo: '/login', pathMatch: 'full' },

  //Ruta para el menú de Secretaria
  {
    path: 'secretaria-menu',
    component: SecretariaMenuComponent,
    children: [
      { path: 'clientes', component: ClientesComponent }, //Ruta Hija
      { path: 'clientes/insertar', component: ClienteInsertarComponent }, //Ruta Hija
      { path: 'clientes/editar/:id', component: ClienteEditarComponent }, //Rutas Hija
      { path: '', redirectTo: 'contratos', pathMatch: 'full' },
      { path: 'contratos', component: ContratoListarComponent },
      { path: 'contratos/registrar', component: ContratoInsertarComponent },
    ]
  },
//Otras rutas protegidas por roles (sin cambios aquí)
 //Soporte Links
  { 
    path: 'soporte-menu', 
    component: SoporteMenuComponent ,
    children:[
      { path: 'lotes', component: LotesComponent },
      { path: 'parceleros', component: ParceleroComponent },
      { path: 'vendedores', component: VendedorComponent }
    ]
  },
  
  { path: 'admin-menu', component: AdminMenuComponent },
  
];