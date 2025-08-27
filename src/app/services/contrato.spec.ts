import { TestBed } from '@angular/core/testing';

import { Contrato } from './contrato.service';

describe('Contrato', () => {
  let service: Contrato;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Contrato);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
