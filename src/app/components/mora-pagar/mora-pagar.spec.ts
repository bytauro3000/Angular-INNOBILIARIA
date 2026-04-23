import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MoraPagarComponent } from './mora-pagar.component';

describe('MoraPagar', () => {
  let component: MoraPagarComponent;
  let fixture: ComponentFixture<MoraPagarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MoraPagarComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MoraPagarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
