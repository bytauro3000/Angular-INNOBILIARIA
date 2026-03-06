import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PagoletraInsertar } from './pagoletra-insertar.component';

describe('PagoletraInsertar', () => {
  let component: PagoletraInsertar;
  let fixture: ComponentFixture<PagoletraInsertar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PagoletraInsertar]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PagoletraInsertar);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
