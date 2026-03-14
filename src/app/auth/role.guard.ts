import { inject } from '@angular/core';
import { CanActivateFn, ActivatedRouteSnapshot, Router } from '@angular/router';
import { TokenService } from './token.service';
import { jwtDecode } from 'jwt-decode';

// Guard de roles: verifica que el usuario autenticado tenga
// uno de los roles requeridos para acceder a la ruta.
// Siempre se usa DESPUÉS de authGuard — este guard asume que el token ya existe y es válido.
export const roleGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const tokenService = inject(TokenService);
  const router = inject(Router);

  // Roles permitidos definidos en la ruta con data: { roles: ['ROLE_X'] }
  const rolesPermitidos: string[] = route.data['roles'] ?? [];

  // Si la ruta no define roles, se permite el acceso a cualquier usuario autenticado
  if (rolesPermitidos.length === 0) return true;

  const token = tokenService.getToken();
  if (!token) {
    router.navigate(['/login']);
    return false;
  }

  try {
    const decoded: { rol: string } = jwtDecode(token);
    const rolUsuario = decoded.rol;

    if (rolesPermitidos.includes(rolUsuario)) {
      return true;
    }

    // Token válido pero rol sin permiso → redirigir a su propio menú
    // en vez de mostrar pantalla en blanco o error genérico.
    redirectSegunRol(rolUsuario, router);
    return false;

  } catch {
    // Token malformado — el authGuard ya debería haberlo bloqueado, pero por seguridad
    tokenService.removeToken();
    router.navigate(['/login']);
    return false;
  }
};

// Redirige al menú correcto según el rol del usuario
function redirectSegunRol(rol: string, router: Router): void {
  switch (rol) {
    case 'ROLE_SECRETARIA':
      router.navigate(['/secretaria-menu']);
      break;
    case 'ROLE_ADMINISTRADOR':
      router.navigate(['/admin-menu']);
      break;
    case 'ROLE_SOPORTE':
      router.navigate(['/soporte-menu']);
      break;
    default:
      router.navigate(['/login']);
  }
}