import { TestBed } from '@angular/core/testing';

import { ClienteInsertar } from './cliente-insertar.service';

describe('ClienteInsertar', () => {
  let service: ClienteInsertar;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ClienteInsertar);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
