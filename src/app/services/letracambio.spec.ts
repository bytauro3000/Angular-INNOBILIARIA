import { TestBed } from '@angular/core/testing';

import { LetrasCambioService } from './letracambio.service';

describe('Letracambio', () => {
  let service: LetrasCambioService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LetrasCambioService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
