import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClienteInsertarComponent } from './clienteinsertar.component';

describe('Clienteinsertar', () => {
  let component: ClienteInsertarComponent;
  let fixture: ComponentFixture<ClienteInsertarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ClienteInsertarComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ClienteInsertarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
