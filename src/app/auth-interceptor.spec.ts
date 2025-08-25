// src/app/auth-interceptor.spec.ts
import { TestBed } from '@angular/core/testing';
import { HttpInterceptorFn } from '@angular/common/http';

// Asegúrate de que el nombre aquí coincida con la clase del interceptor
import { AuthInterceptor } from './auth-interceptor';

describe('authInterceptor', () => {
  const interceptor: HttpInterceptorFn = (req, next) => 
    // ✅ Aquí está la corrección: 'AuthInterceptor' en lugar de 'authIntceptor'
    TestBed.runInInjectionContext(() => AuthInterceptor(req, next));

  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('should be created', () => {
    expect(interceptor).toBeTruthy();
  });
});