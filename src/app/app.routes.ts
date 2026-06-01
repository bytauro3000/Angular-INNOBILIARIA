import { Routes } from '@angular/router';
import { LoginLayoutComponent } from './auth/login/login-layout.component';
import { authGuard } from './auth/auth.guard';
import { roleGuard } from './auth/role.guard';

// Importacion de Mensajeria
import { MensajeriaComponent } from './components/mensajeria/mensajeria.component';

// Importa los componentes de menú
import { SecretariaMenuComponent } from './components/menu-secretaria/secretaria-menu.component';
import { SoporteMenuComponent } from './components/menu-soporte/soporte-menu.component';
import { AdminMenuComponent } from './components/menu-admin/admin-menu.component';

// Importa los dashboards para los menús
import { SecretariaDashboard } from './components/secretaria-dashboard/secretaria-dashboard';

// Clientes
import { ClientesComponent } from './components/cliente-listar/cliente-listar.component';
import { ClienteInsertarComponent } from './components/cliente-insertar/cliente-insertar.component';
import { ClienteEditarComponent } from './components/cliente-editar/cliente-editar.component';
import { ClienteVer } from './components/cliente-ver/cliente-ver';

// Contratos
import { ContratoListarComponent } from './components/contrato-listar/contrato-listar.component';
import { ContratoInsertarComponent } from './components/contrato-insertar/contrato-insertar.component';
import { ContratoEditarComponent } from './components/contrato-editar/contrato-editar.component';

// Pago Letras
import { PagoletraListarComponent } from './components/pagoletra-listar/pagoletra-listar.component';
import { PagoletraInsertarComponent } from './components/pagoletra-insertar/pagoletra-insertar.component';

// Separaciones
import { SeparacionComponent } from './components/separacion-crud/separacion-crud.component';
import { SeparacionInsertEdit } from './components/separacion-insert-edit/separacion-insert-edit';

// Servicios Básicos
import { LecturaPlanillaComponent } from './components/lectura-plantilla/lectura-plantilla.component';
import { RecibosListarComponent } from './components/recibos-listar/recibos-listar.component';
import { InscripcionListarComponent } from './components/inscripcion-listar/inscripcion-lista-component';
import { PagoInscripcionListarComponent } from './components/pago-inscripcion-listar/pago-inscripcion-listar.components';

// Otros componentes
import { ParceleroListarComponent } from './components/parcelero-listar/parcelero-listar.component';
import { VendedorListarComponent } from './components/vendedor-listar/vendedor-listar.component';
import { ProgramaListarComponent } from './components/programa-listar/programa-listar.componente';
import { LoteLitarComponent } from './components/lote-listar/lote-listar.component';
import { ReporteLotesComponent } from './components/reporte-lote/reporte-lote';

// Dashboard y Letras
import { MenuSoportePrincipal } from './components/menu-soporte-principal/menu-soporte-principal';
import { LetracambioListarComponent } from './components/letracambio-listar/letracambios-listar.component';
import { LetracambioInsertarComponent } from './components/letracambio-insertar/letracambio-insertar.component';

// Reporte Mora
import { ReporteMoraComponent } from './components/reporte-mora/reporte-mora.component';

// Reporte Ingresos
import { ReporteIngresosComponent } from './components/reporteingresos/reporteingresos.component';

export const routes: Routes = [
  { path: 'login', component: LoginLayoutComponent },
  { path: '', redirectTo: '/login', pathMatch: 'full' },

  // ── Secretaria ────────────────────────────────────────────────────────────
  {
    path: 'secretaria-menu',
    component: SecretariaMenuComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['ROLE_SECRETARIA'] },
    children: [
      { path: '', component: SecretariaDashboard },

      // Clientes
      { path: 'clientes', component: ClientesComponent },
      { path: 'clientes/insertar', component: ClienteInsertarComponent },
      { path: 'clientes/editar/:id', component: ClienteEditarComponent },
      { path: 'clientes/ver/:id', component: ClienteVer },

      // Letras de Cambio
      { path: 'letras/listar/:idContrato', component: LetracambioListarComponent },
      { path: 'letras/insertar/:idContrato', component: LetracambioInsertarComponent },

      // Separaciones
      { path: 'separaciones', component: SeparacionComponent },
      { path: 'separaciones/registrar', component: SeparacionInsertEdit },
      { path: 'separaciones/editar/:id', component: SeparacionInsertEdit },

      // Contratos
      { path: 'contratos', component: ContratoListarComponent },
      { path: 'contratos/registrar', component: ContratoInsertarComponent },
      { path: 'contratos/editar/:id', component: ContratoEditarComponent },
      { path: 'contratos/reporte-mora', component: ReporteMoraComponent },
      { path: 'reporte-ingresos', component: ReporteIngresosComponent },

      // Pago Letras
      { path: 'pagoletras', component: PagoletraListarComponent },
      { path: 'pagoletras/insertar', component: PagoletraInsertarComponent },

      // Otros
      { path: 'programas', component: ProgramaListarComponent },
      { path: 'vendedores', component: VendedorListarComponent },
      { path: 'lotes', component: LoteLitarComponent },
      { path: 'lotes/reporte', component: ReporteLotesComponent },
      { path: 'parceleros', component: ParceleroListarComponent },

      // Servicios Básicos
      { path: 'servicios-basicos/inscripciones',        component: InscripcionListarComponent },
      { path: 'servicios-basicos/inscripciones/pagos',  component: PagoInscripcionListarComponent },
      { path: 'servicios-basicos',                       component: LecturaPlanillaComponent },
      { path: 'servicios-basicos/listar',                component: RecibosListarComponent },

      // Mensajería
      { path: 'mensajeria', component: MensajeriaComponent }
    ]
  },

  // ── Soporte ───────────────────────────────────────────────────────────────
  {
    path: 'soporte-menu',
    component: SoporteMenuComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['ROLE_SOPORTE'] },
    children: [
      { path: '', component: MenuSoportePrincipal }
    ]
  },

  // ── Administrador ─────────────────────────────────────────────────────────
  {
    path: 'admin-menu',
    component: AdminMenuComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['ROLE_ADMINISTRADOR'] }
  }
];