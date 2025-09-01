import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { LetrasCambioService } from '../../services/letracambio.service';
import { LetraCambio } from '../../models/letra-cambio.model';
import { FormsModule } from '@angular/forms';

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

  constructor(
    private letrasService: LetrasCambioService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('idContrato');
      this.idContrato = id ? +id : 0;

      if (this.idContrato > 0) {
        this.cargando = true;
        this.error = null;

        this.letrasService.listarPorContrato(this.idContrato).subscribe({
          next: letras => {
            this.letras = letras;
            this.letrasFiltradas = [...letras];
            this.aplicarPaginacion();
            this.cargando = false;
          },
          error: err => {
            this.error = 'Ocurrió un error al cargar las letras.';
            this.cargando = false;
          }
        });
      } else {
        this.error = 'ID de contrato inválido.';
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
}
