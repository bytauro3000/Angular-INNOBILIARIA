import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InscripcionServiciosInsertarComponent } from './inscripcion-servicios-insertar.component';

describe('InscripcionServiciosInsertar', () => {
  let component: InscripcionServiciosInsertarComponent;
  let fixture: ComponentFixture<InscripcionServiciosInsertarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InscripcionServiciosInsertarComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InscripcionServiciosInsertarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
