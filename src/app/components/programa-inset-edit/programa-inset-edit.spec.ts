import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProgramaInsetEdit } from './programa-inset-edit';

describe('ProgramaInsetEdit', () => {
  let component: ProgramaInsetEdit;
  let fixture: ComponentFixture<ProgramaInsetEdit>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProgramaInsetEdit]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProgramaInsetEdit);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
