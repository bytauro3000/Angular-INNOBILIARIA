import { TestBed } from '@angular/core/testing';
import { SeparacionService } from './separacion.service';


describe('Separacion', () => {
  let service: SeparacionService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SeparacionService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
