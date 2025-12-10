import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VendedorInsertar } from './vendedor-insertar';

describe('VendedorInsertar', () => {
  let component: VendedorInsertar;
  let fixture: ComponentFixture<VendedorInsertar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VendedorInsertar]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VendedorInsertar);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
