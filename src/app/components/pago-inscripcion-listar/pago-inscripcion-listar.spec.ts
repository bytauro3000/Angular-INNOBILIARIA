import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PagoInscripcionListar } from './pago-inscripcion-listar.components';

describe('PagoInscripcionListar', () => {
  let component: PagoInscripcionListar;
  let fixture: ComponentFixture<PagoInscripcionListar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PagoInscripcionListar]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PagoInscripcionListar);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
