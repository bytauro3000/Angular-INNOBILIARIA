import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MoraPagar } from './mora-pagar.component';

describe('MoraPagar', () => {
  let component: MoraPagar;
  let fixture: ComponentFixture<MoraPagar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MoraPagar]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MoraPagar);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
