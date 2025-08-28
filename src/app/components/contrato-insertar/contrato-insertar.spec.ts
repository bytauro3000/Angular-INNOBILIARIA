import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ContratoInsertarComponent } from './contrato-insertar.component';



describe('ContratoInsertar', () => {
  let component: ContratoInsertarComponent;
  let fixture: ComponentFixture<ContratoInsertarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ContratoInsertarComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ContratoInsertarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
