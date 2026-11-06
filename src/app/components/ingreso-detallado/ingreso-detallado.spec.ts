import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ToastrService } from 'ngx-toastr';

import { IngresoDetalladoComponent } from './ingreso-detallado.component';

describe('IngresoDetalladoComponent', () => {
  let component: IngresoDetalladoComponent;
  let fixture: ComponentFixture<IngresoDetalladoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IngresoDetalladoComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: ToastrService,
          useValue: { warning: () => {}, info: () => {}, error: () => {} }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(IngresoDetalladoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should default the date range to the current month', () => {
    expect(component.fechaDesde).toMatch(/^\d{4}-\d{2}-01$/);
    expect(component.fechaHasta).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(component.tipo).toBe('TODOS');
  });

  it('should paginate 50 rows per page', () => {
    component.reporte = {
      fechaDesde: '2026-11-01',
      fechaHasta: '2026-11-30',
      tipoFiltro: 'TODOS',
      cantidadTotal: 120,
      cantidadAnuladas: 2,
      totales: [],
      detalle: Array.from({ length: 120 }, (_, i) => ({
        idComprobante: i + 1,
        numeroCompleto: `B001-${i + 1}`,
        tipoComprobante: 'BOLETA' as const,
        fechaEmision: [2026, 11, 1],
        monto: 100,
        moneda: 'USD' as const,
        dni: '12345678',
        receptor: '12345678 - Perez, Juan',
        estado: 'VIGENTE' as const,
        ncNumeroCompleto: null,
        ncFechaEmision: null
      }))
    };

    expect(component.totalPaginas).toBe(3);
    expect(component.filasPagina.length).toBe(50);

    component.goToPage(3);
    expect(component.paginaActual).toBe(3);
    expect(component.filasPagina.length).toBe(20);
  });
});
