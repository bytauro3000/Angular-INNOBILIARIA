import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MoraAlerta } from './mora-alerta.component';

describe('MoraAlerta', () => {
  let component: MoraAlerta;
  let fixture: ComponentFixture<MoraAlerta>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MoraAlerta]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MoraAlerta);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
