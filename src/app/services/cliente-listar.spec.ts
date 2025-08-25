import { TestBed } from '@angular/core/testing';

import { ClienteService } from './cliente-listar.service';

describe('Cliente', () => {
  let service: ClienteService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ClienteService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
