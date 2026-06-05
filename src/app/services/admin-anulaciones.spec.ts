import { TestBed } from '@angular/core/testing';

import { AdminAnulaciones } from './admin-anulaciones.service';

describe('AdminAnulaciones', () => {
  let service: AdminAnulaciones;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AdminAnulaciones);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
