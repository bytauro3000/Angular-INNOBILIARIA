import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RecibosListarComponent } from './recibos-listar.component';

describe('RecibosListar', () => {
  let component: RecibosListarComponent;
  let fixture: ComponentFixture<RecibosListarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RecibosListarComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RecibosListarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
