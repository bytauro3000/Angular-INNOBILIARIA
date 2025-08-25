import { TestBed } from '@angular/core/testing';

import { ClienteVer } from './cliente-ver.service';

describe('ClienteVer', () => {
  let service: ClienteVer;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ClienteVer);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
