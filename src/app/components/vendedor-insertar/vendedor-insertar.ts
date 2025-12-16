import { Component, OnInit, AfterViewInit, ViewChild, ElementRef, Output, EventEmitter, Renderer2 } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import * as bootstrap from 'bootstrap';
import { Vendedor } from '../../models/vendedor.model';
import { Distrito } from '../../models/distrito.model';
import { VendedorService } from '../../services/vendedor.service';
import { DistritoService } from '../../services/distrito.service';
import { ToastrService } from 'ngx-toastr';

// Librería del teléfono
import { NgxIntlTelInputModule, CountryISO, SearchCountryField } from 'ngx-intl-tel-input';

@Component({
  selector: 'app-vendedor-insertar',
  standalone: true,
  imports: [CommonModule, FormsModule, NgxIntlTelInputModule],
  templateUrl: './vendedor-insertar.html',
  styleUrls: ['./vendedor-insertar.scss']
})
export class VendedorInsertar implements OnInit, AfterViewInit {

  @ViewChild('modalElement') modalElement!: ElementRef;
  private modal?: bootstrap.Modal;
  @Output() vendedorGuardado = new EventEmitter<void>();

  // =======================
  // DISTRITOS
  // =======================
  distritos: Distrito[] = [];
  distritosFiltrados: Distrito[] = [];
  filtroDistrito: string = '';
  mostrarDistritos: boolean = false;

  // =======================
  // MODELO VENDEDOR
  // =======================
  nuevoVendedor: Vendedor = {
    nombre: '',
    apellidos: '',
    dni: '',
    celular: '',
    direccion: '',
    email: '',
    distrito: { idDistrito: 1, nombre: '' }
  };
  vendedorEditando: Vendedor | null = null;

  // =======================
  // LIBRERÍA TELÉFONO
  // =======================
  SearchCountryField = SearchCountryField;
  CountryISO = CountryISO;
  preferredCountries: CountryISO[] = [
    CountryISO.Peru,
    CountryISO.UnitedStates,
    CountryISO.Mexico,
    CountryISO.Colombia
  ];

  constructor(
    private renderer: Renderer2,
    private vendedorService: VendedorService,
    private distritoService: DistritoService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.cargarDistritos();

    // Cierra solo si el click NO está dentro del contenedor
    this.renderer.listen('document', 'click', (event: any) => {
      const target = event.target as HTMLElement;

      // Previene cierre cuando se hace clic dentro
      if (target.closest('.custom-select-container')) return;

      this.mostrarDistritos = false;
    });
  }

  ngAfterViewInit(): void {
    this.modal = new bootstrap.Modal(this.modalElement.nativeElement);
  }

  // =======================
  // DISTRITOS
  // =======================
  cargarDistritos() {
    this.distritoService.listarDistritos().subscribe(data => {
      this.distritos = data;
      this.distritosFiltrados = [...this.distritos];
    });
  }

  toggleDistritos() {
    this.mostrarDistritos = !this.mostrarDistritos;
  }

  filtrarDistritos() {
    const filtro = this.filtroDistrito.toLowerCase().trim();

    this.distritosFiltrados = this.distritos.filter(d =>
      d.nombre.toLowerCase().includes(filtro)
    );

    // Mantener la lista abierta al escribir
    if (!this.mostrarDistritos) {
      this.mostrarDistritos = true;
    }
  }

  seleccionarDistrito(item: Distrito) {
    this.nuevoVendedor.distrito = item;
    this.filtroDistrito = item.nombre;

    // Forzar el cierre de la lista en el siguiente ciclo de eventos
    setTimeout(() => {
      this.mostrarDistritos = false;
    }, 0);
  }

  // =======================
  // MODAL
  // =======================
  public abrirModal(vendedor?: Vendedor) {
    if (vendedor) {
      this.vendedorEditando = { ...vendedor };
      this.nuevoVendedor = JSON.parse(JSON.stringify(vendedor));

      // Mostrar texto del distrito actual
      this.filtroDistrito = vendedor.distrito?.nombre ?? '';
    } else {
      this.vendedorEditando = null;
      this.resetForm();
    }

    this.modal?.show();
  }

  public cerrarModal() {
    this.modal?.hide();
  }

  // =======================
  // GUARDAR
  // =======================
  guardarVendedor() {
    // Obtener número internacional del input
    const celularData: any = this.nuevoVendedor.celular;
    let celularFinal = '';

    if (typeof celularData === 'object' && celularData?.internationalNumber) {
      celularFinal = celularData.internationalNumber;
    } else {
      celularFinal = String(this.nuevoVendedor.celular || '');
    }

    this.nuevoVendedor.celular = celularFinal;

    const call = this.vendedorEditando
      ? this.vendedorService.actualizarVendedor(this.vendedorEditando.idVendedor!, this.nuevoVendedor)
      : this.vendedorService.crearVendedor(this.nuevoVendedor);

    call.subscribe({
      next: () => {
        this.vendedorGuardado.emit();
        this.cerrarModal();
        this.toastr.success('Vendedor guardado con éxito', 'Éxito');
      },
      error: (err) => {
        this.toastr.error('Error al guardar el vendedor.', 'Error');
        console.error(err);
      }
    });
  }

  resetForm() {
    this.nuevoVendedor = {
      nombre: '',
      apellidos: '',
      dni: '',
      celular: '',
      direccion: '',
      email: '',
      distrito: { idDistrito: 1, nombre: '' }
    };

    this.filtroDistrito = '';
    this.distritosFiltrados = [...this.distritos];
  }
}
