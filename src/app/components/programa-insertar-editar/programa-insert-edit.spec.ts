import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProgramaInsertEdit } from './programa-inset-edit';

describe('ProgramaInsetEdit', () => {
  let component: ProgramaInsertEdit;
  let fixture: ComponentFixture<ProgramaInsertEdit>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProgramaInsertEdit]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProgramaInsertEdit);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
