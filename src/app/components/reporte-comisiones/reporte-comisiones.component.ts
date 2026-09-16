import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { VendedorService } from '../../services/vendedor.service';
import { ComisionVendedorService } from '../../services/comision-vendedor.service';
import { Vendedor } from '../../models/vendedor.model';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-reporte-comisiones',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reporte-comisiones.html',
  styleUrls: ['./reporte-comisiones.scss']
})
export class ReporteComisionesComponent implements OnInit {

  vendedores: Vendedor[] = [];
  vendedoresFiltrados: Vendedor[] = [];
  filtroVendedor: string = '';
  vendedorSeleccionado: Vendedor | null = null;
  mostrarVendedores: boolean = false;
  descargando: boolean = false;
  soloPendientes: boolean = false;

  constructor(
    private vendedorService: VendedorService,
    private comisionService: ComisionVendedorService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.vendedorService.listarVendedores().subscribe({
      next: (data) => {
        this.vendedores = data;
        this.vendedoresFiltrados = [...data];
      },
      error: () => this.toastr.error('Error al cargar vendedores', 'Error')
    });
  }

  filtrarVendedores(): void {
    const f = this.filtroVendedor.toLowerCase().trim();
    this.vendedoresFiltrados = this.vendedores.filter(v =>
      `${v.nombre} ${v.apellidos}`.toLowerCase().includes(f) || (v.dni || '').includes(f)
    );
    this.mostrarVendedores = true;
  }

  seleccionarVendedor(v: Vendedor): void {
    this.vendedorSeleccionado = v;
    this.filtroVendedor = `${v.nombre} ${v.apellidos}`;
    this.mostrarVendedores = false;
  }

  limpiarSeleccion(): void {
    this.vendedorSeleccionado = null;
    this.filtroVendedor = '';
    this.mostrarVendedores = false;
  }

  descargarPdf(): void {
    if (!this.vendedorSeleccionado?.idVendedor) {
      this.toastr.warning('Seleccione un vendedor', 'Atención');
      return;
    }
    this.descargando = true;
    this.comisionService.descargarReporteComisionPdf(this.vendedorSeleccionado.idVendedor, this.soloPendientes).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        window.open(url, '_blank');
        setTimeout(() => window.URL.revokeObjectURL(url), 10000);
        this.descargando = false;
      },
      error: () => {
        this.toastr.error('No se pudo generar el reporte', 'Error');
        this.descargando = false;
      }
    });
  }

  onClickFuera(event: Event): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.custom-select-container')) {
      this.mostrarVendedores = false;
    }
  }
}
