import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LecturaPlantilla } from './lectura-plantilla.component';

describe('LecturaPlantilla', () => {
  let component: LecturaPlantilla;
  let fixture: ComponentFixture<LecturaPlantilla>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LecturaPlantilla]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LecturaPlantilla);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
