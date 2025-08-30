import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { LetrasCambioService } from '../../services/letracambio.service';
import { LetraCambio } from '../../models/letra-cambio.model';

@Component({
  selector: 'app-letracambio-listar',
  standalone: true,
  templateUrl: './letracambio-listar.html',
  styleUrls: ['./letracambio-listar.scss'],
  imports: [CommonModule],
})
export class LetracambioListarComponent implements OnInit {
  letras: LetraCambio[] = [];
  idContrato: number = 0;

  cargando: boolean = false;
  error: string | null = null;

  constructor(
    private letrasService: LetrasCambioService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('idContrato');
      this.idContrato = id ? +id : 0;

      console.log('ID del contrato recibido:', this.idContrato); // Para verificar en consola

      if (this.idContrato > 0) {
        this.cargando = true;
        this.error = null;

        this.letrasService.listarPorContrato(this.idContrato).subscribe({
          next: letras => {
            this.letras = letras;
            this.cargando = false;
            console.log('Letras recibidas:', letras); // También útil para ver si vienen datos
          },
          error: err => {
            console.error('Error al cargar letras:', err);
            this.error = 'Ocurrió un error al cargar las letras.';
            this.cargando = false;
          }
        });
      } else {
        this.error = 'ID de contrato inválido.';
      }
    });
  }
}
