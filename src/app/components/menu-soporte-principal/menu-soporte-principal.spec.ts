import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MenuSoportePrincipal } from './menu-soporte-principal';

describe('MenuSoportePrincipal', () => {
  let component: MenuSoportePrincipal;
  let fixture: ComponentFixture<MenuSoportePrincipal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MenuSoportePrincipal]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MenuSoportePrincipal);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
