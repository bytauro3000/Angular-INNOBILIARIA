import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SoporteMenu } from './soporte-menu.component';

describe('SoporteMenu', () => {
  let component: SoporteMenu;
  let fixture: ComponentFixture<SoporteMenu>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SoporteMenu]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SoporteMenu);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
