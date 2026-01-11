import { Routes } from '@angular/router';
import { LoginLayoutComponent } from './auth/login/login-layout.component';

// Importa los componentes de menú
import { SecretariaMenuComponent } from './components/menu-secretaria/secretaria-menu.component';
import { SoporteMenuComponent } from './components/menu-soporte/soporte-menu.component';
import { AdminMenuComponent } from './components/menu-admin/admin-menu.component';

//Importa los dashboards para los menús
import { SecretariaDashboard } from './components/secretaria-dashboard/secretaria-dashboard';

// Clientes
import { ClientesComponent } from './components/cliente-listar/cliente-listar.component';
import { ClienteInsertarComponent } from './components/cliente-insertar/cliente-insertar.component';
import { ClienteEditarComponent } from './components/cliente-editar/cliente-editar.component';
import { ClienteVer } from './components/cliente-ver/cliente-ver';

// Contratos
import { ContratoListarComponent } from './components/contrato-listar/contrato-listar.component';
import { ContratoInsertarComponent } from './components/contrato-insertar/contrato-insertar.component';

// Separaciones
import { SeparacionComponent } from './components/separacion-crud/separacion-crud.component';
// 🟢 IMPORTANTE: Asegúrate de que la ruta de importación sea la correcta según tu estructura
import { SeparacionInsertEdit } from './components/separacion-insert-edit/separacion-insert-edit'; 

// Otros componentes
import { ParceleroComponent } from './components/parcelero/parcelero';
import { VendedorComponent } from './components/vendedor/vendedor';
import { ProgramaComponent } from './components/programa/programa';
import { LoteComponent } from './components/lote/lote.component';

// Dashboard y Letras
import { MenuSoportePrincipal } from './components/menu-soporte-principal/menu-soporte-principal';
import { LetracambioListarComponent } from './components/letracambio-listar/letracambios-listar.component';
import { LetracambioInsertarComponent } from './components/letracambio-insertar/letracambio-insertar.component';

export const routes: Routes = [
  { path: 'login', component: LoginLayoutComponent },
  { path: '', redirectTo: '/login', pathMatch: 'full' },

  // Ruta para el menú de Secretaria
  {
    path: 'secretaria-menu',
    component: SecretariaMenuComponent,
    children: [
      // 🟢 DASHBOARD (Esta es la ruta que hace que aparezca al inicio)
      { path: '', component: SecretariaDashboard },

      // Clientes
      { path: 'clientes', component: ClientesComponent },
      { path: 'clientes/insertar', component: ClienteInsertarComponent },
      { path: 'clientes/editar/:id', component: ClienteEditarComponent },
      { path: 'clientes/ver/:id', component: ClienteVer },

      // Letras de Cambio
      { path: 'letras/listar/:idContrato', component: LetracambioListarComponent },
      { path: 'letras/insertar/:idContrato', component: LetracambioInsertarComponent },

      // 🟢 SEPARACIONES (Rutas añadidas)
      { path: 'separaciones', component: SeparacionComponent },
      { path: 'separaciones/registrar', component: SeparacionInsertEdit },
      { path: 'separaciones/editar/:id', component: SeparacionInsertEdit },

      // Contratos
      { path: 'contratos', component: ContratoListarComponent },
      { path: 'contratos/registrar', component: ContratoInsertarComponent },

      // Otros
      { path: 'programas', component: ProgramaComponent },
      { path: 'vendedores', component: VendedorComponent },
      { path: 'lotes', component: LoteComponent },
      { path: 'parceleros', component: ParceleroComponent }
    ]
  },

  // Soporte Links
  { 
    path: 'soporte-menu', 
    component: SoporteMenuComponent,
    children: [
      { path: '', component: MenuSoportePrincipal }
    ]
  },
  
  { path: 'admin-menu', component: AdminMenuComponent },
];