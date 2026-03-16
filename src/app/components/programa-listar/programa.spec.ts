import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProgramaListarComponent } from './programa-listar.componente';

describe('Programa', () => {
  let component: ProgramaListarComponent;
  let fixture: ComponentFixture<ProgramaListarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProgramaListarComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProgramaListarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
