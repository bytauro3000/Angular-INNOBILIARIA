import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { jwtDecode } from 'jwt-decode';
import { TokenService } from './token.service';

/**
 * Guard del PORTAL DEL CLIENTE: exige token con rol ROLE_CLIENTE.
 * A diferencia de authGuard (staff), redirige a /portal/login.
 */
export const portalGuard: CanActivateFn = () => {
  const tokenService = inject(TokenService);
  const router = inject(Router);

  const token = tokenService.getToken();
  if (!token) {
    router.navigate(['/portal/login']);
    return false;
  }

  try {
    const decoded: { rol: string } = jwtDecode(token);
    if (decoded.rol === 'ROLE_CLIENTE') {
      return true;
    }
    // Token de personal u otro rol → a su propio menú
    router.navigate(['/login']);
    return false;
  } catch {
    tokenService.removeToken();
    router.navigate(['/portal/login']);
    return false;
  }
};
