import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Programa } from './programa';

describe('Programa', () => {
  let component: Programa;
  let fixture: ComponentFixture<Programa>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Programa]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Programa);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
