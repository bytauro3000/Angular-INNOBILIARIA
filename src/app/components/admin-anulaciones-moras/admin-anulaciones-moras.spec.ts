import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminAnulacionesMorasComponent } from './admin-anulaciones-moras.component';

describe('AdminAnulacionesMoras', () => {
  let component: AdminAnulacionesMorasComponent;
  let fixture: ComponentFixture<AdminAnulacionesMorasComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminAnulacionesMorasComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminAnulacionesMorasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
