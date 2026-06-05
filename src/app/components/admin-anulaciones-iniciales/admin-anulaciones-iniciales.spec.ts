import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminAnulacionesIniciales } from './admin-anulaciones-iniciales.component';

describe('AdminAnulacionesIniciales', () => {
  let component: AdminAnulacionesIniciales;
  let fixture: ComponentFixture<AdminAnulacionesIniciales>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminAnulacionesIniciales]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminAnulacionesIniciales);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
