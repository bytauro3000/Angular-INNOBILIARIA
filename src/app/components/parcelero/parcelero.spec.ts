import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ParceleroComponent } from './parcelero';

describe('Parcelero', () => {
  let component: ParceleroComponent;
  let fixture: ComponentFixture<ParceleroComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ParceleroComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ParceleroComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
