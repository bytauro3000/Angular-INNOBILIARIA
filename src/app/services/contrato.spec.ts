import { TestBed } from '@angular/core/testing';

import { ContratoService } from './contrato.service';

describe('Contrato', () => {
  let service: ContratoService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ContratoService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
