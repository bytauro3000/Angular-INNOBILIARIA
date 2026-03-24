import {
  Component, OnInit, ViewChild, ElementRef,
  Output, EventEmitter, AfterViewInit, ChangeDetectorRef, OnDestroy
} from '@angular/core';
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
export class LotesInsertarEditar implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('modalElement') modalElement!: ElementRef;
  @ViewChild('areaInput') areaInput!: ElementRef;
  @Output() loteGuardado = new EventEmitter<void>();

  private modal?: bootstrap.Modal;
  private areaTooltip?: bootstrap.Tooltip;
  loteForm!: FormGroup;
  programas: Programa[] = [];
  isEditMode = false;
  idLoteEditar?: number;

  // Orden visual de navegación con ← → y Enter
  // ArrowRight / Enter  → avanza al siguiente campo
  // ArrowLeft           → retrocede al campo anterior
  private readonly CAMPOS_NAVEGACION = [
    'manzana', 'numeroLote', 'area',
    'precioM2', 'estado',
    'ancho1', 'ancho2', 'largo2', 'largo1',
    'colindanteNorte', 'colindanteSur',
    'colindanteOeste', 'colindanteEste'
  ];

  constructor(
    private fb: FormBuilder,
    private loteService: LoteService,
    private programaService: ProgramaService,
    private toastr: ToastrService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.inicializarFormulario();
    this.RecargarProgramas();
    this.suscribirACalculoArea();
    this.suscribirAValidacionDuplicados();
  }

  ngAfterViewInit(): void {
    this.modal = new bootstrap.Modal(this.modalElement.nativeElement);

    this.areaTooltip = new bootstrap.Tooltip(this.areaInput.nativeElement, {
      title: 'Verificar área con el plano',
      trigger: 'manual',
      placement: 'bottom'
    });
  }

  ngOnDestroy(): void {
    this.areaTooltip?.dispose();
  }

  // ── NAVEGACIÓN CON ← → Y ENTER ─────────────────────────────────────────────
  //
  //  ArrowRight  → siguiente campo
  //  Enter       → siguiente campo (salvo en <select> donde el browser
  //                ya gestiona la confirmación; en ese caso se avanza
  //                igual para no bloquear el flujo)
  //  ArrowLeft   → campo anterior
  //
  //  En <select> las flechas ↑↓ las deja el browser para cambiar opción;
  //  solo ← → y Enter se interceptan.
  // ────────────────────────────────────────────────────────────────────────────
  onKeydown(event: KeyboardEvent): void {
    const key = event.key;

    if (key !== 'ArrowRight' && key !== 'ArrowLeft' && key !== 'Enter') return;

    const target = event.target as HTMLElement;
    const controlName = target.getAttribute('formcontrolname');
    if (!controlName) return;

    const idx = this.CAMPOS_NAVEGACION.indexOf(controlName);
    if (idx === -1) return;

    // En un <select> con Enter el browser abre/cierra el menú nativo;
    // lo dejamos pasar solo la primera vez y avanzamos igual.
    event.preventDefault();

    let nextIdx: number;
    if (key === 'ArrowLeft') {
      nextIdx = idx > 0 ? idx - 1 : this.CAMPOS_NAVEGACION.length - 1;
    } else {
      // ArrowRight o Enter → avanza
      nextIdx = idx < this.CAMPOS_NAVEGACION.length - 1 ? idx + 1 : 0;
    }

    this.enfocarCampo(this.CAMPOS_NAVEGACION[nextIdx]);
  }

  // Para ng-select (no es un input nativo): Enter confirma selección
  // y avanza al primer campo del formulario.
  onKeydownNgSelect(event: KeyboardEvent): void {
    if (event.key !== 'Enter') return;
    setTimeout(() => this.enfocarCampo('manzana'), 60);
  }

  private enfocarCampo(controlName: string): void {
    if (!this.modalElement) return;
    const el = this.modalElement.nativeElement.querySelector(
      `[formcontrolname="${controlName}"]`
    ) as HTMLElement | null;
    if (el) {
      el.focus();
      if (el instanceof HTMLInputElement) el.select();
    }
  }

  // ── COLINDANTES: abre el datalist al recibir el foco (tab, enter, flecha) ──
  // El browser solo muestra el dropdown del datalist si el input
  // dispara un click o el usuario escribe. Para abrirlo con foco
  // programático simulamos un click invisible sobre el mismo input.
  abrirDatalist(event: FocusEvent): void {
    const input = event.target as HTMLInputElement;
    // Solo desplegamos si el campo está vacío o tiene el texto completo
    // de una opción (para no interrumpir mientras el usuario escribe).
    setTimeout(() => {
      input.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
      input.click();
    }, 50);
  }

  // ── COLINDANTES: foco automático al final del texto sugerido ───────────────
  onColindanteChange(event: Event, controlName: string): void {
    const input = event.target as HTMLInputElement;
    const valor = input.value;

    this.formatearTexto(event, controlName);

    const opcionesPredefinidas = [
      'Con El Lote N° ',
      'Con La Calle N° ',
      'Con La Calle ',
      'Con La Avenida '
    ];

    const estaEnLista = opcionesPredefinidas.some(op =>
      valor.trim().toLowerCase() === op.trim().toLowerCase()
    );

    if (estaEnLista) {
      setTimeout(() => {
        input.focus();
        const len = input.value.length;
        input.setSelectionRange(len, len);
      }, 30);
    }
  }

  // ── INICIALIZACIÓN ──────────────────────────────────────────────────────────

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
      manzana:         ['', [Validators.required, Validators.pattern(/^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s-]+$/)]],
      numeroLote:      ['', [Validators.required]],
      area:            ['', [Validators.required]],
      largo1:          [''],
      largo2:          [''],
      ancho1:          [''],
      ancho2:          [''],
      precioM2:        ['', [Validators.required]],
      colindanteNorte: ['', [Validators.required]],
      colindanteSur:   ['', [Validators.required]],
      colindanteEste:  ['', [Validators.required]],
      colindanteOeste: ['', [Validators.required]],
      estado:          [EstadoLote.Disponible, Validators.required],
      programa:        [null, Validators.required]
    });
  }

  private suscribirACalculoArea(): void {
    ['largo1', 'largo2', 'ancho1', 'ancho2'].forEach(campo => {
      this.loteForm.get(campo)?.valueChanges.subscribe(() => {
        this.calcularAreaAutomaticamente();
      });
    });
  }

  calcularAreaAutomaticamente(): void {
    const f = this.loteForm.getRawValue();
    if (f.area && f.area !== '' && f.area !== '0.00') return;

    const l1 = Number(f.largo1) || 0;
    const l2 = Number(f.largo2) || 0;
    const a1 = Number(f.ancho1) || 0;
    const a2 = Number(f.ancho2) || 0;

    if (l1 > 0 && a1 > 0 && a2 > 0) {
      const promAncho = (a1 + a2) / 2;
      const resultadoArea = ((l1 + (l2 || l1)) / 2) * promAncho;

      this.loteForm.patchValue(
        { area: parseFloat(resultadoArea.toFixed(2)) },
        { emitEvent: false }
      );

      this.areaTooltip?.show();
      setTimeout(() => this.areaTooltip?.hide(), 6000);
    }
  }

  private suscribirAValidacionDuplicados(): void {
    ['programa', 'manzana', 'numeroLote'].forEach(campo => {
      this.loteForm.get(campo)?.valueChanges.subscribe(() => {
        this.verificarSiLoteExiste();
      });
    });
  }

  private verificarSiLoteExiste(): void {
    const values = this.loteForm.getRawValue();
    const idProg = values.programa?.idPrograma;
    const mz     = values.manzana;
    const num    = values.numeroLote;

    if (idProg && mz && num && !this.isEditMode) {
      this.loteService.validarLoteExistente(idProg, mz, num).subscribe(existe => {
        if (existe) {
          this.toastr.warning(
            `El lote ${num} de la manzana ${mz} ya se encuentra registrado en este programa.`,
            'Atención: Lote Duplicado',
            { timeOut: 5000, progressBar: true, positionClass: 'toast-top-right' }
          );
          this.loteForm.get('numeroLote')?.setValue('', { emitEvent: false });
        }
      });
    }
  }

  // ── MODAL ───────────────────────────────────────────────────────────────────

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

  cerrarModal(): void {
    this.areaTooltip?.hide();
    this.modal?.hide();
  }

  // ── HELPERS ─────────────────────────────────────────────────────────────────

  validarSoloNumeros(event: any, controlName: string): void {
    const input = event.target as HTMLInputElement;
    let valor = input.value.replace(/[^0-9.]/g, '');
    const puntos = valor.split('.').length - 1;
    if (puntos > 1) valor = valor.substring(0, valor.lastIndexOf('.'));
    this.loteForm.get(controlName)?.setValue(valor, { emitEvent: false });
  }

  formatearTexto(event: any, controlName: string): void {
    const input = event.target as HTMLInputElement;
    let valor = input.value;
    if (valor) {
      valor = valor.toLowerCase().split(' ')
        .map((p: string) => p.charAt(0).toUpperCase() + p.slice(1))
        .join(' ');
      this.loteForm.get(controlName)?.setValue(valor, { emitEvent: false });
    }
  }

  comparePrograma(p1: any, p2: any): boolean {
    return p1 && p2 ? p1.idPrograma === p2.idPrograma : p1 === p2;
  }

  // ── SUBMIT CON VALIDACIÓN Y FEEDBACK ────────────────────────────────────────

  validarYSubmit(): void {
    this.loteForm.markAllAsTouched();

    if (this.loteForm.invalid) {
      const etiquetas: Record<string, string> = {
        programa:        'Programa',
        manzana:         'Manzana',
        numeroLote:      'N° Lote',
        area:            'Área',
        precioM2:        'Precio por m²',
        estado:          'Estado',
        colindanteNorte: 'Colindante Norte',
        colindanteSur:   'Colindante Sur',
        colindanteEste:  'Colindante Este',
        colindanteOeste: 'Colindante Oeste'
      };

      const faltantes = Object.keys(etiquetas)
        .filter(ctrl => this.loteForm.get(ctrl)?.invalid)
        .map(ctrl => etiquetas[ctrl]);

      this.toastr.warning(
        `Complete los siguientes campos: ${faltantes.join(', ')}`,
        'Formulario incompleto',
        { timeOut: 5000, progressBar: true }
      );

      // Enfocar el primer campo inválido
      const primerCtrl = this.CAMPOS_NAVEGACION.find(c => this.loteForm.get(c)?.invalid);
      if (primerCtrl) setTimeout(() => this.enfocarCampo(primerCtrl), 100);
      return;
    }

    this.onSubmit();
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
        this.toastr.success(
          `Lote ${this.isEditMode ? 'actualizado' : 'creado'} correctamente`,
          '¡Éxito!'
        );
        this.loteGuardado.emit();
        this.cerrarModal();
      },
      error: (err) => {
        Swal.close();
        const errorMsg = err.error?.message || 'No se pudo completar la operación';
        this.toastr.warning(errorMsg, 'Registro Duplicado', {
          timeOut: 4000,
          progressBar: true,
          closeButton: true
        });
      }
    });
  }
}