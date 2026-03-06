import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PagoletraListarComponent } from './pagoletra-listar.component';

describe('PagoletraListar', () => {
  let component: PagoletraListarComponent;
  let fixture: ComponentFixture<PagoletraListarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PagoletraListarComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PagoletraListarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
