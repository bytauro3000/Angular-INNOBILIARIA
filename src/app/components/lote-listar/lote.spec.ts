import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LoteLitarComponent } from './lote-listar.component';

describe('LoteComponent', () => {
  let component: LoteLitarComponent;
  let fixture: ComponentFixture<LoteLitarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [LoteLitarComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(LoteLitarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

