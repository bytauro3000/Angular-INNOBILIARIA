import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LotesInsertarEditar } from './lotes-insertar-editar';

describe('LotesInsertarEditar', () => {
  let component: LotesInsertarEditar;
  let fixture: ComponentFixture<LotesInsertarEditar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LotesInsertarEditar]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LotesInsertarEditar);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
