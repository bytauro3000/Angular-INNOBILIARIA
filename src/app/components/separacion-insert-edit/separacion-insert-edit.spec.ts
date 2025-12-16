import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SeparacionInsertEdit } from './separacion-insert-edit';

describe('SeparacionInsertEdit', () => {
  let component: SeparacionInsertEdit;
  let fixture: ComponentFixture<SeparacionInsertEdit>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SeparacionInsertEdit]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SeparacionInsertEdit);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
