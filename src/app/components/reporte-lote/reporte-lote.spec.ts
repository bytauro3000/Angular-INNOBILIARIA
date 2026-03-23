import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ReporteLotesComponent } from './reporte-lote';

describe('ReporteLote', () => {
  let component: ReporteLotesComponent;
  let fixture: ComponentFixture<ReporteLotesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReporteLotesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ReporteLotesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
