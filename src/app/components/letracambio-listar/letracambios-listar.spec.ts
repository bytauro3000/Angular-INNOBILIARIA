import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LetracambioListarComponent } from './letracambios-listar.component';

describe('LetracambioListar', () => {
  let component: LetracambioListarComponent;
  let fixture: ComponentFixture<LetracambioListarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LetracambioListarComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LetracambioListarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
