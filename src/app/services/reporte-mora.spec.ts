import { TestBed } from '@angular/core/testing';

import { ReporteMoraService } from './reporte-mora.service';

describe('ReporteMoraService', () => {
  let service: ReporteMoraService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ReporteMoraService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
