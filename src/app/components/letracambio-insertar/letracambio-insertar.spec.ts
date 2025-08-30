import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LetracambioInsertar } from './letracambio-insertar.component';

describe('LetracambioInsertar', () => {
  let component: LetracambioInsertar;
  let fixture: ComponentFixture<LetracambioInsertar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LetracambioInsertar]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LetracambioInsertar);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
