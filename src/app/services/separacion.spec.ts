import { TestBed } from '@angular/core/testing';

import { Separacion } from './separacion.service';

describe('Separacion', () => {
  let service: Separacion;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Separacion);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
