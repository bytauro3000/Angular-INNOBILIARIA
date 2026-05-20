import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReporteMora } from './reporte-mora.component';

describe('ReporteMora', () => {
  let component: ReporteMora;
  let fixture: ComponentFixture<ReporteMora>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReporteMora]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReporteMora);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
