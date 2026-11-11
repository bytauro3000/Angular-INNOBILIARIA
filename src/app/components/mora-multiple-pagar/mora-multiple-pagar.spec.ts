import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MoraMultiplePagarComponent } from './mora-multiple-pagar.component';

describe('MoraMultiplePagar', () => {
  let component: MoraMultiplePagarComponent;
  let fixture: ComponentFixture<MoraMultiplePagarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MoraMultiplePagarComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MoraMultiplePagarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
