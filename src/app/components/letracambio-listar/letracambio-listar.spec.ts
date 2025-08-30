import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LetracambioListar } from './letracambio-listar.component';

describe('LetracambioListar', () => {
  let component: LetracambioListar;
  let fixture: ComponentFixture<LetracambioListar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LetracambioListar]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LetracambioListar);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
