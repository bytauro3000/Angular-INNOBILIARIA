import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { TokenService } from './token.service';

export const authGuard: CanActivateFn = () => {
  const tokenService = inject(TokenService);
  const router = inject(Router);

  // Verifica que el token exista Y que no haya expirado.
  // Sin esta comprobación, un token vencido pasa el guard pero
  // cada request devuelve 401, dejando al usuario con pantallas en blanco.
  if (!tokenService.isTokenExpired()) {
    return true;
  }

  tokenService.removeToken();
  router.navigate(['/login']);
  return false;
};