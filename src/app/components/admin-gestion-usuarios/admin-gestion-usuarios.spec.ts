import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminGestionUsuariosComponent } from './admin-gestion-usuarios.component';

describe('AdminGestionUsuarios', () => {
  let component: AdminGestionUsuariosComponent;
  let fixture: ComponentFixture<AdminGestionUsuariosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminGestionUsuariosComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminGestionUsuariosComponent );
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
