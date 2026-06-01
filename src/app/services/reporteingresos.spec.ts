import { TestBed } from '@angular/core/testing';

import { ReporteIngresosService } from './reporteingresos.service';

describe('ReporteIngresosService', () => {
  let service: ReporteIngresosService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ReporteIngresosService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
