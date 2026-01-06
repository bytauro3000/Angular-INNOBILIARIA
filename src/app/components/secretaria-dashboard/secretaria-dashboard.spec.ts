import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SecretariaDashboard } from './secretaria-dashboard';

describe('SecretariaDashboard', () => {
  let component: SecretariaDashboard;
  let fixture: ComponentFixture<SecretariaDashboard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SecretariaDashboard]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SecretariaDashboard);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
