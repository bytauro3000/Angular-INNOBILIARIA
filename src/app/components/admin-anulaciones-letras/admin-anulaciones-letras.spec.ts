import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminAnulacionesLetras } from './admin-anulaciones-letras.component';

describe('AdminAnulacionesLetras', () => {
  let component: AdminAnulacionesLetras;
  let fixture: ComponentFixture<AdminAnulacionesLetras>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminAnulacionesLetras]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminAnulacionesLetras);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
