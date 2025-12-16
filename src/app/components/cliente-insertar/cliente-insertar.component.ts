// src/app/components/cliente-insertar/cliente-insertar.component.ts
import { Component, OnInit, AfterViewInit, ViewChild, ElementRef, Output, EventEmitter, OnDestroy } from '@angular/core'; // ✅ Añadido OnDestroy
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import * as bootstrap from 'bootstrap'; 
import { Cliente } from '../../models/cliente.model';
import { EstadoCliente } from '../../enums/estadocliente.enum';
import { TipoCliente } from '../../enums/tipocliente.enum';
import { Distrito } from '../../models/distrito.model';
import { ClienteService } from '../../services/cliente.service';
import { DistritoService } from '../../services/distrito.service';
import { ToastrService } from 'ngx-toastr';
import { NgxIntlTelInputModule, CountryISO, SearchCountryField } from 'ngx-intl-tel-input'; 


@Component({
  selector: 'app-cliente-insertar',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, NgxIntlTelInputModule],
  templateUrl: './cliente-insertar.html',
  styleUrls: ['./cliente-insertar.scss']
})
export class ClienteInsertarComponent implements OnInit, AfterViewInit, OnDestroy { // ✅ Implementado OnDestroy

  // ✅ REFERENCIAS DE MODAL Y CAMPOS PARA TOOLTIP
  @ViewChild('modalElement') modalElement!: ElementRef;
  // ✅ Añadidos ViewChild para referenciar los inputs del HTML
  @ViewChild('numDocInput') numDocInput!: ElementRef; 
  @ViewChild('emailInput') emailInput!: ElementRef;

  private modal?: bootstrap.Modal;
  
  // ✅ MAPA PARA GUARDAR INSTANCIAS DE TOOLTIPS (Se mantiene)
  private tooltipInstances: Map<string, bootstrap.Tooltip> = new Map();

  // ✅ EVENTO PARA NOTIFICAR AL PADRE
  @Output() clienteGuardado = new EventEmitter<void>();

  clienteForm!: FormGroup;
  distritos: Distrito[] = [];

  SearchCountryField = SearchCountryField;
  CountryISO = CountryISO;
  preferredCountries: CountryISO[] = [
    CountryISO.Peru,
    CountryISO.UnitedStates,
    CountryISO.Mexico,
    CountryISO.Colombia
  ];

  constructor(
    private fb: FormBuilder,
    private clienteService: ClienteService,
    private distritoService: DistritoService,
    public router: Router,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.inicializarFormulario();

    this.distritoService.listarDistritos().subscribe({
      next: (data) => {
        this.distritos = data;
      },
      error: (err) => {
        console.error('Error al cargar distritos:', err);
      }
    });
  }
  
 
  // ====================================================================
  // ✅ LÓGICA DE TOOLTIPS MANUALES (ngAfterViewInit MODIFICADO)
  // ====================================================================

ngAfterViewInit(): void {
    // Inicializa el modal de Bootstrap
    this.modal = new bootstrap.Modal(this.modalElement.nativeElement);
    
    // ✅ Inicializa Tooltips de forma programática (manual)
    this.initProgrammaticTooltips();

    // No es necesario suscribirse a valueChanges si controlamos el show/hide en blur/focus
}

ngOnDestroy(): void {
    // ✅ Limpia las instancias de tooltips al destruir el componente
    this.tooltipInstances.forEach(instance => instance.dispose());
}

private initProgrammaticTooltips(): void {
    // Inicializar DNI/RUC
    if (this.numDocInput) {
        this.tooltipInstances.set('numDoc', new bootstrap.Tooltip(this.numDocInput.nativeElement, {
            trigger: 'manual', // ❌ CLAVE: Deshabilita la auto-activación
            placement: 'bottom',
        }));
    }

    // Inicializar Email
    if (this.emailInput) {
        this.tooltipInstances.set('email', new bootstrap.Tooltip(this.emailInput.nativeElement, {
            trigger: 'manual', // ❌ CLAVE: Deshabilita la auto-activación
            placement: 'bottom',
        }));
    }
}

// ✅ Método para OCULTAR el tooltip cuando el usuario ENTRA al campo.
public onInputFocus(controlName: string): void {
    const tooltipInstance = this.tooltipInstances.get(controlName);
    if (tooltipInstance) {
        tooltipInstance.hide();
    }
}

// ✅ Método para MOSTRAR el tooltip cuando el usuario SALE del campo y es INVÁLIDO.
public onInputBlur(controlName: string): void {
    const control = this.clienteForm.get(controlName);
    const tooltipInstance = this.tooltipInstances.get(controlName);

    if (control?.invalid && control?.touched && tooltipInstance) {
        
        // 1. Aseguramos que el tooltip tenga el mensaje de error más reciente
        tooltipInstance.setContent({ '.tooltip-inner': this.getErrorMessage(controlName) });
        
        // 2. Lo mostramos manualmente (Validación al perder el foco)
        tooltipInstance.show();

    } else if (tooltipInstance) {
        // Si es válido o no está tocado, lo ocultamos
        tooltipInstance.hide();
    }
}

// ====================================================================
// FIN LÓGICA DE TOOLTIPS MANUALES
// ====================================================================


  // ====================================================================
  // ✅ FUNCIÓN UTILITARIA PARA CAPITALIZAR CADA PALABRA
  // ====================================================================
  private capitalizeWords(value: string): string {
    if (!value) return '';
    return value.toLowerCase().split(' ').map(word => {
      return word.charAt(0).toUpperCase() + word.slice(1);
    }).join(' ');
  }

  // ====================================================================
  // ✅ Método de inicialización separado (con validaciones y ValueChanges)
  // ====================================================================
  private inicializarFormulario(): void {
  const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
    this.clienteForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.pattern(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)]], // ✅ Solo texto
      apellidos: ['', [Validators.pattern(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]*$/)]], // ✅ Solo texto (opcional)
      tipoCliente: [TipoCliente.NATURAL, Validators.required],
      numDoc: ['', Validators.required], // ✅ Solo números
      celular: ['', Validators.required], 
      telefono: [''],
      direccion: ['', Validators.required],
      email: ['', [Validators.required, Validators.pattern(EMAIL_REGEX)]],
      estado: [EstadoCliente.ACTIVO, Validators.required],
      distrito: this.fb.group({
        idDistrito: ['', Validators.required],
      }),
    });
    

    // ----------------------------------------------------------------------------------
    // ✅ IMPLEMENTACIÓN DE TRANSFORMACIÓN Y VALIDACIONES DINÁMICAS (ValueChanges)
    // ----------------------------------------------------------------------------------

    // 1. Capitalización en Nombre
    this.clienteForm.get('nombre')?.valueChanges.subscribe(value => {
      if (value) {
        const capitalized = this.capitalizeWords(value);
        if (value !== capitalized) {
          this.clienteForm.get('nombre')?.setValue(capitalized, { emitEvent: false });
        }
      }
    });

    

    // 2. Capitalización en Apellidos
    this.clienteForm.get('apellidos')?.valueChanges.subscribe(value => {
      if (value) {
        const capitalized = this.capitalizeWords(value);
        if (value !== capitalized) {
          this.clienteForm.get('apellidos')?.setValue(capitalized, { emitEvent: false });
        }
      }
    });

    // 3. Validación Dinámica de DNI/RUC al cambiar Tipo de Cliente
    this.clienteForm.get('tipoCliente')?.valueChanges.subscribe(tipo => {
      this.updateNumDocValidators(tipo);
    });
    
    // Aplicar validadores iniciales (por defecto es NATURAL: DNI 8 dígitos)
    this.updateNumDocValidators(TipoCliente.NATURAL);
  }
  // ====================================================================
// ✅ NUEVO MÉTODO PARA LIMPIAR CARACTERES NO NUMÉRICOS
// ====================================================================
public limpiarNoNumericos(controlName: string): void {
  const control = this.clienteForm.get(controlName);
  if (control && control.value) {
    // Reemplaza cualquier cosa que NO sea un dígito globalmente
    const newValue = control.value.replace(/[^0-9]/g, '');
    if (control.value !== newValue) {
      // Usar emitEvent: false para no disparar valueChanges adicionales
      control.setValue(newValue, { emitEvent: false });
    }
  }
}
  // ====================================================================
// ✅ FUNCIÓN PARA VALIDACIÓN DINÁMICA DE DNI/RUC (Mantenemos esta)
// ====================================================================
private updateNumDocValidators(tipo: TipoCliente): void {
  const numDocControl = this.clienteForm.get('numDoc');
  if (!numDocControl) return;

  // Solo necesitamos el validador required, minLength y maxLength
  let validators = [
    Validators.required
  ];

  if (tipo === TipoCliente.NATURAL) {
    // DNI: 8 dígitos
    validators.push(Validators.minLength(8), Validators.maxLength(8));
  } else if (tipo === TipoCliente.JURIDICO) {
    // RUC: 11 dígitos
    validators.push(Validators.minLength(11), Validators.maxLength(11));
  }

  numDocControl.setValidators(validators);
  numDocControl.updateValueAndValidity();
}

// ====================================================================
// ✅ NUEVO: MÉTODO PARA OBTENER MENSAJE DE ERROR
// ====================================================================
public getErrorMessage(controlName: string): string {
    const control = this.clienteForm.get(controlName);
    if (!control || !control.errors) {
        return '';
    }

    if (control.errors['required']) {
        return 'Este campo es obligatorio.';
    }
    
    // Específico para Email
    if (controlName === 'email' && control.errors['pattern']) {
        return 'El formato de correo no es válido (ej. correo@dominio.com).';
    }

    // Específico para DNI/RUC
    if (controlName === 'numDoc' && (control.errors['minlength'] || control.errors['maxlength'])) {
        const requiredLength = this.clienteForm.get('tipoCliente')?.value === 'NATURAL' ? 8 : 11;
        return `Debe tener exactamente ${requiredLength} dígitos.`;
    }
    
    // Mensaje por defecto para otros errores de patrón/longitud si existen
    if (control.errors['pattern']) {
        return 'El campo contiene caracteres no permitidos.';
    }
    
    return 'Error de validación.';
}


  // ============================================================
  // ✅ MÉTODOS DE CONTROL DEL MODAL
  // ============================================================
  
  /**
   * Método público llamado por el componente padre (ClientesComponent).
   * @param cliente (Opcional) Datos del cliente a editar.
   */
  public abrirModalCliente(cliente?: Cliente): void {
    this.clienteForm.reset();
    
    if (cliente) {
      // Editar cliente: Patch the form values
      this.clienteForm.patchValue({
        ...cliente,
        // Si el distrito existe, patchValue lo manejará en el grupo anidado
        distrito: { idDistrito: cliente.distrito?.idDistrito } 
      });
      // ✅ Si necesitas manejar el ID para la edición/actualización:
      // this.clienteForm.addControl('idCliente', this.fb.control(cliente.idCliente)); 
    } else {
      // Nuevo cliente: Asegurar valores por defecto y re-aplicar validadores
      this.inicializarFormulario(); 
    }

    this.modal?.show();
  }

  public cerrarModal(): void {
    this.modal?.hide();
  }
  // ============================================================


  onSubmit(): void {
    if (this.clienteForm.valid) {
      const formValue = this.clienteForm.value;
      
      // ✅ LÓGICA CLAVE: Extraer el número internacional del objeto del formulario
      const celularData: any = formValue.celular;
      let celularFinal = '';

      if (typeof celularData === 'object' && celularData?.internationalNumber) {
        celularFinal = celularData.internationalNumber; 
      } else {
        celularFinal = String(formValue.celular || '');
      }

      // Clonar el objeto y asignar el celular como string
      const nuevoCliente: Cliente = {
        ...formValue,
        celular: celularFinal
      };
      
      // Determinar si es INSERTAR (no hay ID) o ACTUALIZAR (hay ID, si lo manejas en el form)
      // Usaremos agregarCliente ya que este componente es para Insertar según tu HTML.
      
      this.clienteService.agregarCliente(nuevoCliente).subscribe({
        next: (response) => {
          this.toastr.success('Cliente insertado correctamente.', '¡Éxito!');
          this.cerrarModal(); // ✅ Cerramos el modal
          this.clienteGuardado.emit(); // ✅ Emitimos el evento
        },
        error: (error) => {
          console.error('Error al insertar el cliente:', error);
          this.toastr.error(error.message, 'Error');
        }
      });
    } else {
      this.clienteForm.markAllAsTouched();
    }
  }
}