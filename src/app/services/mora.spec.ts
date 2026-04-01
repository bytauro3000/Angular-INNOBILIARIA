import { TestBed } from '@angular/core/testing';

import { Mora } from './mora.service';

describe('Mora', () => {
  let service: Mora;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Mora);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
