import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VendedorListarComponent } from './vendedor-listar.component';

describe('Vendedor', () => {
  let component: VendedorListarComponent;
  let fixture: ComponentFixture<VendedorListarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VendedorListarComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VendedorListarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
