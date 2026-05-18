import { ComponentFixture, TestBed } from '@angular/core/testing';
import { InscripcionListarComponent } from './inscripcion-lista-component';


describe('InscripcionListar', () => {
  let component: InscripcionListarComponent;
  let fixture: ComponentFixture<InscripcionListarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InscripcionListarComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InscripcionListarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
