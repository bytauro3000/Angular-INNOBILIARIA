import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PagoLetraMultipleInsertarComponent } from './pagoletra-multiple-insertar.component';

describe('PagoletraMultipleInsertar', () => {
  let component: PagoLetraMultipleInsertarComponent;
  let fixture: ComponentFixture<PagoLetraMultipleInsertarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PagoLetraMultipleInsertarComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PagoLetraMultipleInsertarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
