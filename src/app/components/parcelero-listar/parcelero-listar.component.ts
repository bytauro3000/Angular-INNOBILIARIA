import { Component, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, Subscription, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, catchError, map } from 'rxjs/operators';
import { Parcelero } from '../../models/parcelero.model';
import { ParceleroService } from '../../services/parcelero.service';
import { ClienteService } from '../../services/cliente.service';
import { Distrito } from '../../models/distrito.model';
import { DistritoService } from '../../services/distrito.service';
import { ToastrService } from 'ngx-toastr';
import * as bootstrap from 'bootstrap';

@Component({
  selector: 'app-parcelero-listar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './parcelero-listar.html',
  styleUrls: ['./parcelero-listar.scss']
})
export class ParceleroListarComponent implements OnInit, AfterViewInit {
  parceleros: Parcelero[] = [];
  distritos: Distrito[] = [];
  distritosFiltrados: Distrito[] = [];
  departamentos: string[] = [];
  provincias: string[] = [];

  filtroTexto = '';
  currentPage = 1;
  itemsPerPage = 10;

  nuevoParcelero: Parcelero = {
    nombres: '',
    apellidos: '',
    dni: '',
    celular: '',
    direccion: '',
    email: '',
    distrito: { idDistrito: 0, nombre: '' }
  };

  parceleroEditando: Parcelero | null = null;
  cargandoDni = false;
  private modal?: bootstrap.Modal;
  private dniCheck$ = new Subject<string>();
  private dniCheckSub?: Subscription;

  constructor(
    private parceleroService: ParceleroService,
    private distritoService: DistritoService,
    private clienteService: ClienteService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.cargarParceleros();
    this.cargarDistritos();

    this.dniCheckSub = this.dniCheck$.pipe(
      debounceTime(400),
      distinctUntilChanged(),
      switchMap(dni => {
        if (!dni || dni.length < 8) return of({ tipo: 'invalid' as const });
        return this.parceleroService.obtenerParceleroPorDni(dni).pipe(
          map(existente => ({ tipo: 'found' as const, dni, existente })),
          catchError(err => {
            if (err.status === 404) {
              return of({ tipo: 'notFound' as const, dni });
            }
            return of({ tipo: 'error' as const });
          })
        );
      })
    ).subscribe(result => {
      if (result.tipo === 'found') {
        this.toastr.warning(`Este DNI ya está registrado: ${result.existente.nombres} ${result.existente.apellidos}`, 'Parcelero existente');
        this.cargandoDni = false;
      } else if (result.tipo === 'notFound') {
        this.cargandoDni = true;
        this.clienteService.consultarDniExterno(result.dni).subscribe({
          next: (res) => {
            if (res && res.success) {
              this.nuevoParcelero.nombres = res.first_name || '';
              this.nuevoParcelero.apellidos = `${res.first_last_name || ''} ${res.second_last_name || ''}`.trim();
              this.toastr.success('Datos recuperados de RENIEC');
            }
            this.cargandoDni = false;
          },
          error: () => {
            this.cargandoDni = false;
            this.toastr.info('No se pudo autocompletar. Ingrese los datos manualmente.');
          }
        });
      }
    });
  }

  ngOnDestroy(): void {
    this.dniCheckSub?.unsubscribe();
  }

  onDniInput(): void {
    const dni = this.nuevoParcelero.dni;
    if (!dni || dni.length < 8) return;
    this.dniCheck$.next(dni);
  }

  onDepartamentoChange(event: Event): void {
    const dpt = (event.target as HTMLSelectElement).value;
    this.provincias = dpt
      ? [...new Set(this.distritos.filter(d => d.departamento === dpt).map(d => d.provincia).filter((p): p is string => !!p))].sort()
      : [];
    this.distritosFiltrados = [];
    this.nuevoParcelero.distrito.idDistrito = 0;
  }

  onProvinciaChange(event: Event): void {
    const prv = (event.target as HTMLSelectElement).value;
    const dpt = (document.getElementById('par-departamento') as HTMLSelectElement)?.value;
    this.distritosFiltrados = (dpt && prv)
      ? this.distritos.filter(d => d.departamento === dpt && d.provincia === prv)
      : [];
    this.nuevoParcelero.distrito.idDistrito = 0;
  }

  ngAfterViewInit(): void {
    const modalEl = document.getElementById('parceleroModal');
    if (modalEl) {
      this.modal = new bootstrap.Modal(modalEl);
    }
  }

  get parcelerosFiltrados(): Parcelero[] {
    let data = this.parceleros;
    if (this.filtroTexto.trim()) {
      const term = this.filtroTexto.toLowerCase();
      data = data.filter(p =>
        p.nombres?.toLowerCase().includes(term) ||
        p.apellidos?.toLowerCase().includes(term) ||
        p.dni?.includes(term) ||
        p.celular?.includes(term) ||
        p.distrito?.nombre?.toLowerCase().includes(term)
      );
    }
    const start = (this.currentPage - 1) * this.itemsPerPage;
    return data.slice(start, start + this.itemsPerPage);
  }

  get totalPages(): number {
    let data = this.parceleros;
    if (this.filtroTexto.trim()) {
      const term = this.filtroTexto.toLowerCase();
      data = data.filter(p =>
        p.nombres?.toLowerCase().includes(term) ||
        p.apellidos?.toLowerCase().includes(term) ||
        p.dni?.includes(term) ||
        p.celular?.includes(term) ||
        p.distrito?.nombre?.toLowerCase().includes(term)
      );
    }
    return Math.max(1, Math.ceil(data.length / this.itemsPerPage));
  }

  get paginas(): (number | string)[] {
    const pages: (number | string)[] = [];
    const total = this.totalPages;
    if (total <= 7) {
      for (let i = 1; i <= total; i++) pages.push(i);
    } else {
      pages.push(1);
      if (this.currentPage > 3) pages.push('...');
      const start = Math.max(2, this.currentPage - 1);
      const end = Math.min(total - 1, this.currentPage + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (this.currentPage < total - 2) pages.push('...');
      pages.push(total);
    }
    return pages;
  }

  irPagina(n: number | string) { if (typeof n === 'number') this.currentPage = n; }

  filtrar() { this.currentPage = 1; }

  abrirModal(parcelero?: Parcelero) {
    if (parcelero) {
      this.parceleroEditando = { ...parcelero };
      this.nuevoParcelero = { ...parcelero, distrito: { ...parcelero.distrito } };
    } else {
      this.parceleroEditando = null;
      this.resetForm();
    }
    this.modal?.show();
  }

  cerrarModal() { this.modal?.hide(); }

  cargarParceleros() {
    this.parceleroService.listarParceleros().subscribe(data => this.parceleros = data);
  }

  cargarDistritos() {
    this.distritoService.listarDistritos().subscribe(data => {
      this.distritos = data;
      this.departamentos = [...new Set(data.map(d => d.departamento).filter((d): d is string => !!d))].sort();
    });
  }

  guardarParcelero() {
    if (!this.nuevoParcelero.dni || this.nuevoParcelero.dni.length < 8) {
      this.toastr.warning('Ingrese un DNI válido de 8 dígitos', 'Validación');
      return;
    }
    if (!this.nuevoParcelero.nombres || !this.nuevoParcelero.apellidos) {
      this.toastr.warning('Nombres y apellidos son obligatorios', 'Validación');
      return;
    }
    const datos = { ...this.nuevoParcelero };
    datos.nombres = datos.nombres?.toUpperCase();
    datos.apellidos = datos.apellidos?.toUpperCase();
    datos.email = datos.email?.trim() ? datos.email.trim() : undefined;

    if (this.parceleroEditando && this.parceleroEditando.idParcelero) {
      this.parceleroService.actualizarParcelero(this.parceleroEditando.idParcelero, datos).subscribe({
        next: () => {
          this.toastr.success('Parcelero actualizado correctamente');
          this.cargarParceleros();
          this.resetForm();
          this.cerrarModal();
        },
        error: (err) => this.toastr.error(err.error?.message || 'Error al actualizar parcelero')
      });
    } else {
      this.parceleroService.crearParcelero(datos).subscribe({
        next: () => {
          this.toastr.success('Parcelero registrado correctamente');
          this.cargarParceleros();
          this.resetForm();
          this.cerrarModal();
        },
        error: (err) => this.toastr.error(err.error?.message || 'Error al registrar parcelero')
      });
    }
  }

  eliminarParcelero(id: number) {
    if (!confirm('¿Está seguro de eliminar este parcelero?')) return;
    this.parceleroService.eliminarParcelero(id).subscribe({
      next: () => {
        this.toastr.success('Parcelero eliminado');
        this.cargarParceleros();
      },
      error: (err) => this.toastr.error(err.error?.message || 'Error al eliminar parcelero')
    });
  }

  private resetForm() {
    this.nuevoParcelero = {
      nombres: '',
      apellidos: '',
      dni: '',
      celular: '',
      direccion: '',
      email: '',
      distrito: { idDistrito: 0, nombre: '' }
    };
    this.distritosFiltrados = [];
    this.provincias = [];
  }

  exportarExcel() {
    this.parceleroService.exportarExcel().subscribe((data: Blob) => {
      const url = window.URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'parceleros.xlsx';
      a.click();
      window.URL.revokeObjectURL(url);
    });
  }

  exportarPDF() {
    import('jspdf').then(jsPDF => {
      const doc = new jsPDF.jsPDF();
      doc.setFontSize(14);
      doc.text('Listado de Parceleros', 10, 10);
      this.parceleros.forEach((p, i) => {
        doc.setFontSize(11);
        doc.text(
          `${i + 1}. ${p.nombres} ${p.apellidos} - DNI: ${p.dni} - Cel: ${p.celular || 'N/A'} - Distrito: ${p.distrito?.nombre || 'N/A'}`,
          10, 20 + i * 10
        );
      });
      doc.save('parceleros.pdf');
    });
  }
}
