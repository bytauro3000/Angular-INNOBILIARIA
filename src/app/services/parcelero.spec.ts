import { TestBed } from '@angular/core/testing';

import { ParceleroService } from './parcelero.service';

describe('Parcelero', () => {
  let service: ParceleroService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ParceleroService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
