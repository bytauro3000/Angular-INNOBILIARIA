import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ClientesComponent } from './cliente-listar.component';
import { FormsModule } from '@angular/forms';
import { ClienteService } from '../../services/cliente.service';
import { of } from 'rxjs';
import { EstadoCliente } from '../../enums/estadocliente.enum';
import { TipoCliente } from '../../enums/tipocliente.enum';
import { Cliente } from '../../models/cliente.model';
import { Distrito } from '../../models/distrito.model';
import { RouterModule } from '@angular/router'; 

// Mock del servicio corregido para que coincida con el método real
class MockClienteService {
  listarClientes() { 
    return of([
      {
        idCliente: 1,
        nombre: 'Test',
        apellidos: 'Mock',
        tipoCliente: TipoCliente.JURIDICO,
        dni: '12345678',
        ruc: '',
        celular: '1234567890',
        direccion: 'Calle Ficticia 123',
        email: 'test@mock.com',
        fechaRegistro: new Date(),
        estado: EstadoCliente.ACTIVO,
        distrito: { idDistrito: 1, nombre: 'Distrito Ficticio' } as Distrito
      }
    ]);
  }

  eliminarCliente(id: number) {
    return of(void 0); // Mockea la respuesta para el método de eliminación
  }
}

describe('ClientesComponent', () => {
  let component: ClientesComponent;
  let fixture: ComponentFixture<ClientesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        FormsModule,
        ClientesComponent,
        RouterModule.forRoot([]) // ✅ Añade RouterModule.forRoot([])
      ],
      providers: [
        { provide: ClienteService, useClass: MockClienteService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ClientesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load clientes on init', () => {
    const service = TestBed.inject(ClienteService);
    const mockClientes: Cliente[] = [
      {
        idCliente: 1,
        nombre: 'Test',
        apellidos: 'Mock',
        tipoCliente: TipoCliente.JURIDICO,
        dni: '12345678',
        ruc: '',
        celular: '1234567890',
        direccion: 'Calle Ficticia 123',
        email: 'test@mock.com',
        fechaRegistro: new Date(),
        estado: EstadoCliente.ACTIVO,
        distrito: { idDistrito: 1, nombre: 'Distrito Ficticio' } as Distrito
      }
    ];
    // Espía el método correcto del mock
    spyOn(service, 'listarClientes').and.returnValue(of(mockClientes));

    component.ngOnInit();

    expect(service.listarClientes).toHaveBeenCalled();
    expect(component.clientes.length).toBe(1);
  });

  // ✅ Nuevo test para verificar que el método de eliminación funciona
  it('should delete a client and reload the list', () => {
    const service = TestBed.inject(ClienteService);
    spyOn(service, 'eliminarCliente').and.returnValue(of(void 0));
    spyOn(component, 'cargarClientes');

    component.eliminarCliente(1);

    expect(service.eliminarCliente).toHaveBeenCalledWith(1);
    expect(component.cargarClientes).toHaveBeenCalled();
  });
});
