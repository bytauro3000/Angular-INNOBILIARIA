import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VoucherPreview } from './voucher-preview.componente';

describe('VoucherPreview', () => {
  let component: VoucherPreview;
  let fixture: ComponentFixture<VoucherPreview>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VoucherPreview]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VoucherPreview);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
