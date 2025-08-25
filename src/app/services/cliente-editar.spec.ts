import { TestBed } from '@angular/core/testing';

import { ClienteEditar } from './cliente-editar.service';

describe('ClienteEditar', () => {
  let service: ClienteEditar;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ClienteEditar);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
