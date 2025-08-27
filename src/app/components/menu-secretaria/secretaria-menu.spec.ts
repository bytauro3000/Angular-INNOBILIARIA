import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SecretariaMenuComponent } from './secretaria-menu.component';



describe('SecretariaMenu', () => {
  let component: SecretariaMenuComponent;
  let fixture: ComponentFixture<SecretariaMenuComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SecretariaMenuComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SecretariaMenuComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
