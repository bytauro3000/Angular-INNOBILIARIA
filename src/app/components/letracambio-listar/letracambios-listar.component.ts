import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { LetrasCambioService } from '../../services/letracambio.service';
import { LetraCambio } from '../../models/letra-cambio.model';
import { FormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-letracambio-listar',
  standalone: true,
  templateUrl: './letracambios-listar.html',
  styleUrls: ['./letracambios-listar.scss'],
  imports: [CommonModule, FormsModule],
})
export class LetracambioListarComponent implements OnInit {
  letras: LetraCambio[] = [];
  letrasFiltradas: LetraCambio[] = [];
  paginatedLetras: LetraCambio[] = [];

  terminoBusqueda: string = '';

  idContrato: number = 0;
  cargando: boolean = false;
  error: string | null = null;

  // Paginación
  pageSize: number = 9;
  currentPage: number = 1;
  totalPages: number = 0;

  // Edición en línea
  editingLetraId: number | null = null;
  campoEditando: 'importe' | 'importeLetras' | null = null;
  valorTemporal: string | number = '';

  constructor(
    private letrasService: LetrasCambioService,
    private route: ActivatedRoute,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('idContrato');
      this.idContrato = id ? +id : 0;

      if (this.idContrato > 0) {
        this.cargarLetras();
      } else {
        this.error = 'ID de contrato inválido.';
      }
    });
  }

  cargarLetras(): void {
    this.cargando = true;
    this.error = null;

    this.letrasService.listarPorContrato(this.idContrato).subscribe({
      next: letras => {
        this.letras = letras;
        this.letrasFiltradas = [...letras];
        this.aplicarPaginacion();
        this.cargando = false;
      },
      error: () => {
        this.error = 'Ocurrió un error al cargar las letras.';
        this.cargando = false;
      }
    });
  }

  filtrarLetras(): void {
    const termino = this.terminoBusqueda.trim().toLowerCase();

    if (!termino) {
      this.letrasFiltradas = [...this.letras];
    } else {
      this.letrasFiltradas = this.letras.filter(letra => {
        const parteAntesDeSlash = letra.numeroLetra?.split('/')[0].toLowerCase();
        return parteAntesDeSlash === termino;
      });
    }

    this.currentPage = 1;
    this.aplicarPaginacion();
  }

  aplicarPaginacion(): void {
    this.totalPages = Math.ceil(this.letrasFiltradas.length / this.pageSize);
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    this.paginatedLetras = this.letrasFiltradas.slice(start, end);
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.aplicarPaginacion();
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.aplicarPaginacion();
    }
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.aplicarPaginacion();
    }
  }

  getPagesArray(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  eliminarLetras(): void {
    Swal.fire({
      title: '¿Estás seguro?',
      text: '¡No podrás revertir esto!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then(result => {
      if (result.isConfirmed) {
        this.cargando = true;
        this.error = null;

        this.letrasService.eliminarPorContrato(this.idContrato).subscribe({
          next: () => {
            this.toastr.success('Letras eliminadas correctamente.', '¡Éxito!');
            this.letras = [];
            this.letrasFiltradas = [];
            this.paginatedLetras = [];
            this.cargando = false;
          },
          error: () => {
            this.toastr.error('Error al eliminar las letras.', 'Error');
            this.cargando = false;
          }
        });
      }
    });
  }

  // ------------------------------------------------
  // Convierte número a letras con moneda en dólares americanos
  // ------------------------------------------------
convertirNumeroALetras(valor: number): string {
  if (isNaN(valor) || valor === 0) return 'CERO CON 00/100 DÓLARES AMERICANOS';

  // Separar la parte entera y decimal
  const partes = valor.toFixed(2).split('.');
  const entero = parseInt(partes[0], 10);
  const decimal = partes[1]; // ya es string con dos dígitos

  let letras = this.numeroALetras(entero).toUpperCase();

  // Siempre agregamos la parte decimal con el formato CON XX/100
  letras += ` CON ${decimal}/100 DÓLARES AMERICANOS`;

  return letras;
}

  // ------------------------------------------------
  // Función privada para convertir número entero a letras
  // ------------------------------------------------
  private numeroALetras(num: number): string {
    const unidades = ["", "uno", "dos", "tres", "cuatro", "cinco", "seis", "siete", "ocho", "nueve"];
    const especiales = ["diez", "once", "doce", "trece", "catorce", "quince"];
    const decenas = ["", "", "veinte", "treinta", "cuarenta", "cincuenta", "sesenta", "setenta", "ochenta", "noventa"];
    const centenas = ["", "ciento", "doscientos", "trescientos", "cuatrocientos", "quinientos", "seiscientos", "setecientos", "ochocientos", "novecientos"];

    if (num === 0) return "cero";
    if (num === 100) return "cien";

    let letras = "";

    if (num >= 1000000) {
      const millones = Math.floor(num / 1000000);
      letras += (millones === 1 ? "un millón" : this.numeroALetras(millones) + " millones");
      num %= 1000000;
      if (num > 0) letras += " ";
    }

    if (num >= 1000) {
      const miles = Math.floor(num / 1000);
      if (miles === 1) {
        letras += "mil";
      } else {
        letras += this.numeroALetras(miles) + " mil";
      }
      num %= 1000;
      if (num > 0) letras += " ";
    }

    if (num >= 100) {
      const c = Math.floor(num / 100);
      letras += centenas[c];
      num %= 100;
      if (num > 0) letras += " ";
    }

    if (num >= 10 && num <= 15) {
      letras += especiales[num - 10];
    } else if (num < 10) {
      letras += unidades[num];
    } else {
      const d = Math.floor(num / 10);
      const u = num % 10;
      if (d === 2 && u > 0) {
        letras += "veinti" + unidades[u];
      } else {
        letras += decenas[d];
        if (u > 0) letras += " y " + unidades[u];
      }
    }

    return letras.trim();
  }

  // ------------------------------
  // Métodos para edición en línea
  // ------------------------------

  iniciarEdicion(letra: LetraCambio, campo: 'importe' | 'importeLetras'): void {
    this.editingLetraId = letra.idLetra;
    this.campoEditando = campo;
    this.valorTemporal = letra[campo] ?? '';
  }

  onImporteInput(letra: LetraCambio, valor: string): void {
    const numero = Number(valor);
    if (!isNaN(numero)) {
      this.valorTemporal = numero;
      letra.importe = numero;
      letra.importeLetras = this.convertirNumeroALetras(numero);
    } else {
      this.valorTemporal = valor;
      letra.importeLetras = '';
    }
  }

  guardarEdicion(letra: LetraCambio): void {
    if (!this.campoEditando || this.editingLetraId === null) return;

    if (this.campoEditando === 'importe') {
      letra.importe = Number(this.valorTemporal);
      letra.importeLetras = this.convertirNumeroALetras(letra.importe);
    }

    this.letrasService.actualizarLetra(letra.idLetra, letra).subscribe({
      next: () => {
        this.toastr.success('Letra actualizada correctamente.', 'Éxito');
      },
      error: () => {
        this.toastr.error('Error al actualizar la letra.', 'Error');
      },
      complete: () => {
        this.cancelarEdicion();
      }
    });
  }

  cancelarEdicion(): void {
    this.editingLetraId = null;
    this.campoEditando = null;
    this.valorTemporal = '';
  }
}
