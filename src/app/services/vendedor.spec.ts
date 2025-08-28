import { TestBed } from '@angular/core/testing';

import { VendedorService } from './vendedor.service';

describe('Vendedor', () => {
  let service: VendedorService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(VendedorService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
