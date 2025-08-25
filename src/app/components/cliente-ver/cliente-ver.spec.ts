import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClienteVer } from './cliente-ver';

describe('ClienteVer', () => {
  let component: ClienteVer;
  let fixture: ComponentFixture<ClienteVer>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ClienteVer]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ClienteVer);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
