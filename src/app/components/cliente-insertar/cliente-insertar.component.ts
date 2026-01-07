import { Component, OnInit, AfterViewInit, ViewChild, ElementRef, Output, EventEmitter, OnDestroy } from '@angular/core';
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
export class ClienteInsertarComponent implements OnInit, AfterViewInit, OnDestroy {

  @ViewChild('modalElement') modalElement!: ElementRef;
  @ViewChild('numDocInput') numDocInput!: ElementRef; 
  @ViewChild('emailInput') emailInput!: ElementRef;

  private modal?: bootstrap.Modal;
  private tooltipInstances: Map<string, bootstrap.Tooltip> = new Map();

  @Output() clienteGuardado = new EventEmitter<void>();

  clienteForm!: FormGroup;
  distritos: Distrito[] = [];

  SearchCountryField = SearchCountryField;
  CountryISO = CountryISO;
  preferredCountries: CountryISO[] = [CountryISO.Peru, CountryISO.UnitedStates, CountryISO.Mexico, CountryISO.Colombia];

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
      next: (data) => this.distritos = data,
      error: (err) => console.error('Error al cargar distritos:', err)
    });
  }

  ngAfterViewInit(): void {
    this.modal = new bootstrap.Modal(this.modalElement.nativeElement);
    this.initProgrammaticTooltips();
  }

  ngOnDestroy(): void {
    this.tooltipInstances.forEach(instance => instance.dispose());
  }

  private initProgrammaticTooltips(): void {
    if (this.numDocInput) {
      this.tooltipInstances.set('numDoc', new bootstrap.Tooltip(this.numDocInput.nativeElement, { trigger: 'manual', placement: 'bottom' }));
    }
    if (this.emailInput) {
      this.tooltipInstances.set('email', new bootstrap.Tooltip(this.emailInput.nativeElement, { trigger: 'manual', placement: 'bottom' }));
    }
  }

  public onInputFocus(controlName: string): void {
    this.tooltipInstances.get(controlName)?.hide();
  }

  public onInputBlur(controlName: string): void {
    const control = this.clienteForm.get(controlName);
    const tooltip = this.tooltipInstances.get(controlName);
    if (control?.invalid && control?.touched && tooltip) {
      tooltip.setContent({ '.tooltip-inner': this.getErrorMessage(controlName) });
      tooltip.show();
    } else {
      tooltip?.hide();
    }
  }

  private inicializarFormulario(): void {
    const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
    this.clienteForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.pattern(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)]],
      apellidos: ['', [Validators.pattern(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]*$/)]],
      tipoCliente: [TipoCliente.NATURAL, Validators.required],
      numDoc: ['', Validators.required],
      celular: ['', Validators.required], 
      telefono: [''],
      direccion: ['', Validators.required],
      email: ['', [Validators.required, Validators.pattern(EMAIL_REGEX)]],
      estado: [EstadoCliente.ACTIVO, Validators.required],
      distrito: this.fb.group({ idDistrito: ['', Validators.required] }),
    });

    this.clienteForm.get('tipoCliente')?.valueChanges.subscribe(tipo => this.updateNumDocValidators(tipo));
    this.updateNumDocValidators(TipoCliente.NATURAL);
  }

  public limpiarNoNumericos(controlName: string): void {
    const control = this.clienteForm.get(controlName);
    if (control?.value) {
      const newValue = control.value.replace(/[^0-9]/g, '');
      if (control.value !== newValue) control.setValue(newValue, { emitEvent: false });
    }
  }

  private updateNumDocValidators(tipo: TipoCliente): void {
    const control = this.clienteForm.get('numDoc');
    if (!control) return;
    const length = tipo === TipoCliente.NATURAL ? 8 : 11;
    control.setValidators([Validators.required, Validators.minLength(length), Validators.maxLength(length)]);
    control.updateValueAndValidity();
  }

  public getErrorMessage(controlName: string): string {
    const control = this.clienteForm.get(controlName);
    if (!control?.errors) return '';
    if (control.errors['required']) return 'Obligatorio.';
    if (controlName === 'email' && control.errors['pattern']) return 'Email inválido.';
    if (controlName === 'numDoc' && (control.errors['minlength'] || control.errors['maxlength'])) {
      return `Debe tener ${this.clienteForm.get('tipoCliente')?.value === 'NATURAL' ? 8 : 11} dígitos.`;
    }
    return 'Error.';
  }

  public abrirModalCliente(cliente?: Cliente): void {
    this.clienteForm.reset();
    if (cliente) {
      this.clienteForm.patchValue({ ...cliente, distrito: { idDistrito: cliente.distrito?.idDistrito } });
    } else {
      this.inicializarFormulario();
    }
    this.modal?.show();
  }

  public cerrarModal(): void { this.modal?.hide(); }

  onSubmit(): void {
    if (this.clienteForm.valid) {
      const formValue = this.clienteForm.value;
      const celularData: any = formValue.celular;
      const nuevoCliente: Cliente = {
        ...formValue,
        celular: celularData?.internationalNumber || String(formValue.celular || '')
      };
      
      this.clienteService.agregarCliente(nuevoCliente).subscribe({
        next: () => {
          this.toastr.success('Cliente insertado correctamente.');
          this.cerrarModal();
          this.clienteGuardado.emit();
        },
        error: (err) => this.toastr.error(err.message)
      });
    } else {
      this.clienteForm.markAllAsTouched();
    }
  }

  // Método para convertir a formato Nombre Propio
formatearTexto(event: any, controlName: string): void {
  const input = event.target as HTMLInputElement;
  let valor = input.value;

  if (valor) {
    // Convierte: "ever nick" -> "Ever Nick"
    valor = valor.toLowerCase().split(' ')
      .map(palabra => palabra.charAt(0).toUpperCase() + palabra.slice(1))
      .join(' ');

    // Actualiza el valor en el formulario sin disparar eventos infinitos
    this.clienteForm.get(controlName)?.setValue(valor, { emitEvent: false });
  }
}
}