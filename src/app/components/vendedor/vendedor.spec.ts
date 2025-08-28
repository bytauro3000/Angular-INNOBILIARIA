import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VendedorComponent } from './vendedor';

describe('Vendedor', () => {
  let component: VendedorComponent;
  let fixture: ComponentFixture<VendedorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VendedorComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VendedorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
