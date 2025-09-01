import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LetracambioInsertarComponent } from './letracambio-insertar.component';

describe('LetracambioInsertar', () => {
  let component: LetracambioInsertarComponent;
  let fixture: ComponentFixture<LetracambioInsertarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LetracambioInsertarComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LetracambioInsertarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
