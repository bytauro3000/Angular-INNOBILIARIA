import { TestBed } from '@angular/core/testing';

import { Distrito } from './distrito.service';

describe('Distrito', () => {
  let service: Distrito;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Distrito);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
