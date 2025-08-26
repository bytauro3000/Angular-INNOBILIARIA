import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LotesComponent } from './lote.component';

describe('LoteComponent', () => {
  let component: LotesComponent;
  let fixture: ComponentFixture<LotesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [LotesComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(LotesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

