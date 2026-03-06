import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PagoletraInsertarComponent } from './pagoletra-insertar.component';

describe('PagoletraInsertar', () => {
  let component: PagoletraInsertarComponent;
  let fixture: ComponentFixture<PagoletraInsertarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PagoletraInsertarComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PagoletraInsertarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
