import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ContratoListarComponent } from './contrato-listar.component';

describe('Contrato', () => {
  let component: ContratoListarComponent;
  let fixture: ComponentFixture<ContratoListarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ContratoListarComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ContratoListarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
