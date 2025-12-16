import { Component, OnInit, AfterViewInit, ViewChild, ElementRef, Output, EventEmitter } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common'; // <-- Importar DecimalPipe
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms'; 
import * as bootstrap from 'bootstrap';

// Importar la Directiva (Asegúrate de que la ruta sea correcta)
import { CurrencyFormatterDirective } from '../../directives/currency-formatter'; 

import { ProgramaService } from '../../services/programa.service';
import { ToastrService } from 'ngx-toastr';
import { Programa } from '../../models/programa.model';
import { Distrito } from '../../models/distrito.model';
import { Parcelero } from '../../models/parcelero.model'; 
import { DistritoService } from '../../services/distrito.service';
import { ParceleroService } from '../../services/parcelero.service';

@Component({
  selector: 'app-programa-inset-edit',
  standalone: true,
  // Agregar la Directiva y el Pipe de Angular en imports
  imports: [CommonModule, ReactiveFormsModule, CurrencyFormatterDirective], 
  templateUrl: './programa-inset-edit.html',
  styleUrls: ['./programa-inset-edit.scss'],
  // Proveedor para usarlo en el componente
  providers: [DecimalPipe] 
})
export class ProgramaInsetEdit implements OnInit, AfterViewInit {
  @ViewChild('modalElement') modalElement!: ElementRef;
  private modal?: bootstrap.Modal;
  @Output() programaGuardado = new EventEmitter<void>();

  programaForm!: FormGroup;
  programaEditando: Programa | null = null;
  distritos: Distrito[] = [];
  parceleros: Parcelero[] = []; 
  distritosFiltrados: Distrito[] = [];
  filtroDistrito: string = '';
  mostrarDistritos: boolean = false;

  constructor(
    private fb: FormBuilder,
    private programaService: ProgramaService,
    private toastr: ToastrService,
    private distritoService: DistritoService,
    private parceleroService: ParceleroService,
    private decimalPipe: DecimalPipe // <-- Inyectar DecimalPipe
  ) { }

  ngOnInit(): void {
    this.inicializarFormulario();
    
    this.distritoService.listarDistritos().subscribe({
        next: (data) => {
          this.distritos = data;
          this.distritosFiltrados = [...this.distritos];
        },
        error: (err) => {
          console.error('Error al cargar distritos:', err);
        }
      });
  
      this.parceleroService.listarParceleros().subscribe({
        next: (data) => {
          this.parceleros = data;
        },
        error: (err) => {
          console.error('Error al cargar parceleros:', err);
        }
      });
  }

  ngAfterViewInit(): void {
    this.modal = new bootstrap.Modal(this.modalElement.nativeElement);
  }

  inicializarFormulario() {
    this.programaForm = this.fb.group({
      nombrePrograma: ['', Validators.required],
      ubicacion: [''],
      
      areaTotal: ['', [
        Validators.required, 
        Validators.min(0), 
        // Ya no es necesario el pattern si se usa el limpiador
      ]],
      // El validador min(0) es suficiente si la directiva garantiza que es un número
      precioM2: ['', [
        Validators.required, 
        Validators.min(0),
      ]],
      // ** COSTO TOTAL DESHABILITADO **
      costoTotal: [{ value: '', disabled: true }], 

      distrito: this.fb.group({
        idDistrito: ['', Validators.required],
      }),
      parcelero: this.fb.group({
        idParcelero: ['', Validators.required]
      })
    });
    
    // Suscribir a cambios para el cálculo del Costo Total
    this.programaForm.get('areaTotal')?.valueChanges.subscribe(() => this.calcularCostoTotal());
    this.programaForm.get('precioM2')?.valueChanges.subscribe(() => this.calcularCostoTotal());
  }

  // Se mantiene si se usa en areaTotal, pero es redundante con la directiva en precioM2
  limpiarNoNumericos(controlName: string) {
    const control = this.programaForm.get(controlName);
    if (control) {
      let value = control.value;
      if (typeof value === 'string') {
        value = value.replace(/[^\d.]/g, ''); 
        const parts = value.split('.');
        if (parts.length > 2) {
            value = parts[0] + '.' + parts.slice(1).join('');
        }
        control.setValue(value, { emitEvent: false });
      }
    }
  }

 calcularCostoTotal(): void {
  // Obtenemos los valores brutos del formulario
  const values = this.programaForm.getRawValue();

  // Función interna para limpiar símbolos y comas de los strings
  const extraerNumero = (val: any): number => {
    if (typeof val === 'number') return val;
    if (!val) return 0;
    // Quitamos $, comas y espacios
    const limpio = val.toString().replace(/[^\d.]/g, '');
    return limpio ? parseFloat(limpio) : 0;
  };

  const area = extraerNumero(values.areaTotal);
  const precio = extraerNumero(values.precioM2);

  if (area > 0 && precio > 0) {
    const total = area * precio;
    // Usamos patchValue con emitEvent: false para no crear un bucle infinito
    this.programaForm.get('costoTotal')?.setValue(total, { emitEvent: false });
  } else {
    this.programaForm.get('costoTotal')?.setValue(0, { emitEvent: false });
  }
}

  seleccionarDistrito(item: Distrito) {
    this.programaForm.get('distrito')?.patchValue({ idDistrito: item.idDistrito });
    this.filtroDistrito = item.nombre;
    this.mostrarDistritos = false;
  }

  abrirModal(programa?: Programa): void {
    this.programaForm.reset();
    if (programa) {
      this.programaEditando = programa;
      // Usar getRawValue para obtener valores de campos deshabilitados (como costoTotal)
      const programaData = this.programaForm.getRawValue();
      this.programaForm.patchValue(programaData);
      this.filtroDistrito = programa.distrito.nombre;
      
      // Asegurar que costoTotal se formatee al abrir para editar
      if (programa.costoTotal) {
          this.programaForm.get('costoTotal')?.setValue(programa.costoTotal.toFixed(2));
      }

    } else {
      this.programaEditando = null;
    }

    this.modal?.show();
  }

  cerrarModal(): void {
    this.modal?.hide();
  }

  onSubmit(): void {
    // Usar getRawValue() para incluir los valores puros del campo deshabilitado (costoTotal)
    const programaData = this.programaForm.getRawValue();

    if (this.programaForm.valid) {
      // Los datos enviados incluyen el valor numérico puro de costoTotal gracias a getRawValue()
      
      const call = this.programaEditando
        ? this.programaService.actualizarPrograma(this.programaEditando.idPrograma!, programaData)
        : this.programaService.crearPrograma(programaData);

      call.subscribe({
        next: () => {
          this.programaGuardado.emit();
          this.cerrarModal();
          this.toastr.success('Programa guardado correctamente.', 'Éxito');
        },
        error: (err) => {
          this.toastr.error('Error al guardar el programa.', 'Error');
          console.error(err);
        }
      });
    } else {
      this.programaForm.markAllAsTouched();
    }
  }
}