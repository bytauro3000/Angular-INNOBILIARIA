import { ComponentFixture, TestBed } from '@angular/core/testing';
import {ParceleroListarComponent} from './parcelero-listar.component';

describe('ParceleroListarComponent', () => {
  let component: ParceleroListarComponent;
  let fixture: ComponentFixture<ParceleroListarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ParceleroListarComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ParceleroListarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
