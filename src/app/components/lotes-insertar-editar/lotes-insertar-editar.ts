import { Component, OnInit, ViewChild, ElementRef, Output, EventEmitter, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import * as bootstrap from 'bootstrap';
import Swal from 'sweetalert2';
import { ToastrService } from 'ngx-toastr';

import { Lote } from '../../models/lote.model';
import { Programa } from '../../models/programa.model';
import { EstadoLote } from '../../enums/estadolote.enum';
import { LoteService } from '../../services/lote.service';
import { ProgramaService } from '../../services/programa.service';

@Component({
  selector: 'app-lotes-insertar-editar',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, NgSelectModule],
  templateUrl: './lotes-insertar-editar.html',
  styleUrls: ['./lotes-insertar-editar.scss']
})
export class LotesInsertarEditar implements OnInit, AfterViewInit {
  @ViewChild('modalElement') modalElement!: ElementRef;
  @Output() loteGuardado = new EventEmitter<void>();

  private modal?: bootstrap.Modal;
  loteForm!: FormGroup;
  programas: Programa[] = [];
  isEditMode = false;
  idLoteEditar?: number;

  constructor(
    private fb: FormBuilder,
    private loteService: LoteService,
    private programaService: ProgramaService,
    private toastr: ToastrService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.inicializarFormulario();
    this.RecargarProgramas(); 
  }

  ngAfterViewInit(): void {
    this.modal = new bootstrap.Modal(this.modalElement.nativeElement);
  }

  RecargarProgramas(): void {
    this.programaService.listarProgramas().subscribe({
      next: (p) => {
        this.programas = p || [];
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al cargar programas:', err);
        this.toastr.error('No se pudieron cargar los programas.');
      }
    });
  }

  private inicializarFormulario(): void {
    this.loteForm = this.fb.group({
      // 🟢 Manzana ahora permite letras y números
      manzana: ['', [Validators.required, Validators.pattern(/^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s-]+$/)]],
      numeroLote: ['', [Validators.required]],
      area: ['', [Validators.required]],
      largo1: [''], 
      largo2: [''], 
      ancho1: [''], 
      ancho2: [''],
      precioM2: ['', [Validators.required]],
      colindanteNorte: [''], 
      colindanteSur: [''], 
      colindanteEste: [''], 
      colindanteOeste: [''],
      estado: [EstadoLote.Disponible, Validators.required],
      programa: [null, Validators.required]
    });
  }

  // 🟢 Función para restringir a solo números y decimales
  validarSoloNumeros(event: any, controlName: string): void {
    const input = event.target as HTMLInputElement;
    // Solo permite números y un punto decimal
    let valor = input.value.replace(/[^0-9.]/g, '');
    
    // Evita más de un punto decimal
    const puntos = valor.split('.').length - 1;
    if (puntos > 1) {
      valor = valor.substring(0, valor.lastIndexOf('.'));
    }

    this.loteForm.get(controlName)?.setValue(valor, { emitEvent: false });
  }

  abrirModal(lote?: Lote): void {
    this.RecargarProgramas(); 
    this.loteForm.reset({ estado: EstadoLote.Disponible, area: '', precioM2: '' });
    
    if (lote && lote.idLote) {
      this.isEditMode = true;
      this.idLoteEditar = lote.idLote;
      this.loteForm.patchValue(lote);
    } else {
      this.isEditMode = false;
      this.idLoteEditar = undefined;
    }
    this.modal?.show();
  }

  cerrarModal(): void { this.modal?.hide(); }

  formatearTexto(event: any, controlName: string): void {
    const input = event.target as HTMLInputElement;
    let valor = input.value;
    if (valor) {
      valor = valor.toLowerCase().split(' ').map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
      this.loteForm.get(controlName)?.setValue(valor, { emitEvent: false });
    }
  }

  comparePrograma(p1: any, p2: any): boolean {
    return p1 && p2 ? p1.idPrograma === p2.idPrograma : p1 === p2;
  }

  onSubmit(): void {
    if (this.loteForm.invalid) {
      this.loteForm.markAllAsTouched();
      return;
    }
    const data = this.loteForm.value;
    Swal.fire({ title: 'Procesando...', didOpen: () => Swal.showLoading() });

    const request = this.isEditMode 
      ? this.loteService.actualizarLote(this.idLoteEditar!, data)
      : this.loteService.crearLote(data);

    request.subscribe({
      next: () => {
        Swal.close();
        Swal.fire('Éxito', `Lote ${this.isEditMode ? 'actualizado' : 'creado'} correctamente`, 'success');
        this.loteGuardado.emit();
        this.cerrarModal();
      },
      error: () => {
        Swal.close();
        Swal.fire('Error', 'No se pudo completar la operación', 'error');
      }
    });
  }
}