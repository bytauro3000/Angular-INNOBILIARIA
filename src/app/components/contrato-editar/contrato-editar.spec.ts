import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ContratoEditarComponent } from './contrato-editar.component';

describe('ContratoEditar', () => {
  let component: ContratoEditarComponent;
  let fixture: ComponentFixture<ContratoEditarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ContratoEditarComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ContratoEditarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
