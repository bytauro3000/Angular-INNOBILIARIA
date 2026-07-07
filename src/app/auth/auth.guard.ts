import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { TokenService } from './token.service';

export const authGuard: CanActivateFn = () => {
  const tokenService = inject(TokenService);
  const router = inject(Router);

  // Solo verifica que exista un token.
  // La expiración y el refresh los maneja el AuthInterceptor (401 → refresh → retry).
  if (tokenService.getToken()) {
    return true;
  }

  router.navigate(['/login']);
  return false;
};