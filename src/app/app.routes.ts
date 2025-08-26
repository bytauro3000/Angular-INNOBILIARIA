  // src/app/app.routes.ts
  import { Routes } from '@angular/router';
  import { LoginLayoutComponent } from './auth/login/login-layout.component';

  // ✅ Importa los nuevos componentes de menú
  import { SecretariaMenuComponent } from './components/menu-secretaria/secretaria-menu.component';
  import { SoporteMenuComponent } from './components/menu-soporte/soporte-menu.component';
  import { AdminMenuComponent } from './components/menu-admin/admin-menu.component';

  import { ClientesComponent } from './components/cliente-listar/cliente-listar.component';
  import { ClienteInsertarComponent } from './components/cliente-insertar/cliente-insertar.component';

  export const routes: Routes = [
    { path: 'login', component: LoginLayoutComponent },
    { path: '', redirectTo: '/login', pathMatch: 'full' },

    // ✅ Ruta para el menú de Secretaria
    {
      path: 'secretaria-menu',
      component: SecretariaMenuComponent,
      children: [
        { path: 'clientes', component: ClientesComponent }, // Esta es la ruta hija para Clientes
        { path: 'clientes/insertar', component: ClienteInsertarComponent }, // ✅ Nueva ruta para insertar cliente
      ]
    },

    // ✅ Otras rutas protegidas por roles (sin cambios aquí)
    { path: 'soporte-menu', component: SoporteMenuComponent },
    { path: 'admin-menu', component: AdminMenuComponent },
  ];
