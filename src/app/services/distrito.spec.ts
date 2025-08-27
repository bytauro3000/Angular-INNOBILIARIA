import { TestBed } from '@angular/core/testing';

import { DistritoService } from './distrito.service';

describe('Distrito', () => {
  let service: DistritoService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DistritoService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
