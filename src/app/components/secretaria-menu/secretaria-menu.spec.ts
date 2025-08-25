import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SecretariaMenu } from './secretaria-menu.component';

describe('SecretariaMenu', () => {
  let component: SecretariaMenu;
  let fixture: ComponentFixture<SecretariaMenu>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SecretariaMenu]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SecretariaMenu);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
