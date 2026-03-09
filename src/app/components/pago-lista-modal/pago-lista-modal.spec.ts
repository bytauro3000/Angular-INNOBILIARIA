import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PagoListaModalComponent } from './pago-lista-modal.component';

describe('PagoListaModal', () => {
  let component: PagoListaModalComponent;
  let fixture: ComponentFixture<PagoListaModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PagoListaModalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PagoListaModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
