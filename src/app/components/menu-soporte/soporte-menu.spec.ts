import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SoporteMenuComponent } from './soporte-menu.component';



describe('SoporteMenu', () => {
  let component: SoporteMenuComponent;
  let fixture: ComponentFixture<SoporteMenuComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SoporteMenuComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SoporteMenuComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
