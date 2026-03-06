import { TestBed } from '@angular/core/testing';

import { Pagoletra } from './pagoletra.service';

describe('Pagoletra', () => {
  let service: Pagoletra;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Pagoletra);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
