import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Reporteingresos } from './reporteingresos.component';

describe('Reporteingresos', () => {
  let component: Reporteingresos;
  let fixture: ComponentFixture<Reporteingresos>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Reporteingresos]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Reporteingresos);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
