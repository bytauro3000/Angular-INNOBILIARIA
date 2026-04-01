import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MoraListar } from './mora-listar.component';

describe('MoraListar', () => {
  let component: MoraListar;
  let fixture: ComponentFixture<MoraListar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MoraListar]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MoraListar);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
