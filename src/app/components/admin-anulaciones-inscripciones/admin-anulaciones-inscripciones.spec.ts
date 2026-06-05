import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminAnulacionesInscripciones } from './admin-anulaciones-inscripciones.component';

describe('AdminAnulacionesInscripciones', () => {
  let component: AdminAnulacionesInscripciones;
  let fixture: ComponentFixture<AdminAnulacionesInscripciones>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminAnulacionesInscripciones]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminAnulacionesInscripciones);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
