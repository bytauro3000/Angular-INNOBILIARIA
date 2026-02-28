import { TestBed } from '@angular/core/testing';

import { InscripcionService } from './inscripcion.service';

describe('Inscripcion', () => {
  let service: InscripcionService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(InscripcionService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
