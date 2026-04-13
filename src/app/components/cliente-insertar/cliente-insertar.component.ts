import { Component, OnInit, AfterViewInit, ViewChild, ElementRef, Output, EventEmitter, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import * as bootstrap from 'bootstrap';
import { Cliente } from '../../models/cliente.model';
import { EstadoCliente } from '../../enums/estadocliente.enum';
import { TipoCliente } from '../../enums/tipocliente.enum';
import { Genero } from '../../enums/Genero.enum';
import { EstadoCivil } from '../../enums/estadocivil.enum';
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
  Generos = Object.values(Genero);
  EstadosCiviles = Object.values(EstadoCivil);
  cargandoDni: boolean = false;
  SearchCountryField = SearchCountryField;
  CountryISO = CountryISO;
  preferredCountries: CountryISO[] = [CountryISO.Peru, CountryISO.UnitedStates, CountryISO.Mexico, CountryISO.Colombia];

  // Referencia al enum para usarlo en el HTML
  TipoCliente = TipoCliente;

  // Paises disponibles con su nacionalidad masculina y femenina
  // Se genera dinamicamente al cambiar genero
  paises: { nombre: string; bandera: string; nacionalidadM: string; nacionalidadF: string }[] = [
    { nombre: 'Venezuela',  bandera: 'https://flagcdn.com/40x30/ve.png', nacionalidadM: 'venezolano',     nacionalidadF: 'venezolana'     },
    { nombre: 'Colombia',   bandera: 'https://flagcdn.com/40x30/co.png', nacionalidadM: 'colombiano',     nacionalidadF: 'colombiana'     },
    { nombre: 'Chile',      bandera: 'https://flagcdn.com/40x30/cl.png', nacionalidadM: 'chileno',        nacionalidadF: 'chilena'        },
    { nombre: 'Ecuador',    bandera: 'https://flagcdn.com/40x30/ec.png', nacionalidadM: 'ecuatoriano',    nacionalidadF: 'ecuatoriana'    },
    { nombre: 'Bolivia',    bandera: 'https://flagcdn.com/40x30/bo.png', nacionalidadM: 'boliviano',      nacionalidadF: 'boliviana'      },
    { nombre: 'Argentina',  bandera: 'https://flagcdn.com/40x30/ar.png', nacionalidadM: 'argentino',      nacionalidadF: 'argentina'      },
    { nombre: 'Brasil',     bandera: 'https://flagcdn.com/40x30/br.png', nacionalidadM: 'brasileño',      nacionalidadF: 'brasileña'      },
    { nombre: 'México',     bandera: 'https://flagcdn.com/40x30/mx.png', nacionalidadM: 'mexicano',       nacionalidadF: 'mexicana'       },
    { nombre: 'España',     bandera: 'https://flagcdn.com/40x30/es.png', nacionalidadM: 'español',        nacionalidadF: 'española'       },
    { nombre: 'EEUU',       bandera: 'https://flagcdn.com/40x30/us.png', nacionalidadM: 'estadounidense', nacionalidadF: 'estadounidense' },
    { nombre: 'Otro',       bandera: 'https://flagcdn.com/40x30/un.png', nacionalidadM: 'extranjero',     nacionalidadF: 'extranjera'     },
  ];

  paisSeleccionado: { nombre: string; bandera: string; nacionalidadM: string; nacionalidadF: string } | null = null;
  dropdownPaisAbierto = false;

  get esCarnetExtranjeria(): boolean {
    return this.clienteForm?.get('tipoCliente')?.value === TipoCliente.CE;
  }

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
      nombre:    ['', [Validators.required, Validators.pattern(/^[a-zA-ZáéíóúüÁÉÍÓÚÜñÑ\s]+$/)]],
      apellidos: ['', [Validators.pattern(/^[a-zA-ZáéíóúüÁÉÍÓÚÜñÑ\s]*$/)]],
      tipoCliente: [TipoCliente.NATURAL, Validators.required],
      numDoc:      ['', Validators.required],
      estadoCivil: [EstadoCivil.SOLTERO, Validators.required],
      celular:     ['', Validators.required],
      telefono:    [''],
      direccion:   ['', Validators.required],
      email:       ['', [Validators.pattern(EMAIL_REGEX)]],
      genero:      ['', Validators.required],
      estado:      [EstadoCliente.ACTIVO, Validators.required],
      distrito:    this.fb.group({ idDistrito: ['', Validators.required] }),
      // Solo se envia cuando tipoCliente = CE, null para peruanos
      nacionalidad: [null],
    });

    this.clienteForm.get('tipoCliente')?.valueChanges.subscribe(tipo => {
      this.updateNumDocValidators(tipo);
      this.actualizarValidacionNacionalidad(tipo);
    });

    this.updateNumDocValidators(TipoCliente.NATURAL);
  }

  // Agrega o quita el validador de nacionalidad segun el tipo de cliente
  private actualizarValidacionNacionalidad(tipo: string): void {
    const ctrl = this.clienteForm.get('nacionalidad');
    if (!ctrl) return;
    if (tipo === TipoCliente.CE) {
      ctrl.setValidators([Validators.required]);
    } else {
      ctrl.clearValidators();
      ctrl.setValue(null);
    }
    ctrl.updateValueAndValidity();
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
    if (tipo === TipoCliente.CE) {
      // CE puede tener entre 9 y 12 caracteres alfanumericos
      control.setValidators([Validators.required, Validators.minLength(9), Validators.maxLength(12)]);
    } else {
      const length = tipo === TipoCliente.NATURAL ? 8 : 11;
      control.setValidators([Validators.required, Validators.minLength(length), Validators.maxLength(length)]);
    }
    control.updateValueAndValidity();
  }

  public getErrorMessage(controlName: string): string {
    const control = this.clienteForm.get(controlName);
    if (!control?.errors) return '';
    if (control.errors['required']) return 'Obligatorio.';
    if (controlName === 'email' && control.errors['pattern']) return 'Email inválido.';
    if (controlName === 'numDoc' && (control.errors['minlength'] || control.errors['maxlength'])) {
      const tipo = this.clienteForm.get('tipoCliente')?.value;
      if (tipo === TipoCliente.CE) return 'El C.E. debe tener entre 9 y 12 caracteres.';
      return `Debe tener ${tipo === TipoCliente.NATURAL ? 8 : 11} dígitos.`;
    }
    return 'Error.';
  }

  // Al cambiar el pais en el select, calcula la nacionalidad segun genero actual
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.pais-dropdown')) {
      this.dropdownPaisAbierto = false;
    }
  }

  seleccionarPais(pais: { nombre: string; bandera: string; nacionalidadM: string; nacionalidadF: string }): void {
    this.paisSeleccionado = pais;
    this.dropdownPaisAbierto = false;
    const genero = this.clienteForm.get('genero')?.value;
    const esFemenino = genero === Genero.Femenino;
    this.clienteForm.get('nacionalidad')?.setValue(
      esFemenino ? pais.nacionalidadF : pais.nacionalidadM,
      { emitEvent: false }
    );
  }

  // Mantener onPaisChange por compatibilidad aunque ya no se usa en el template
  onPaisChange(event: Event): void {}

  public onDniInput(): void {
    const dni = this.clienteForm.get('numDoc')?.value;
    const tipo = this.clienteForm.get('tipoCliente')?.value;

    if (tipo === TipoCliente.NATURAL && dni && dni.length === 8) {
      this.cargandoDni = true;
      this.clienteService.consultarDniExterno(dni).subscribe({
        next: (res) => {
          if (res && res.success) {
            this.clienteForm.patchValue({
              nombre: res.first_name,
              apellidos: `${res.first_last_name} ${res.second_last_name}`.trim()
            });
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
  }

  public abrirModalCliente(cliente?: Cliente): void {
    this.clienteForm.reset();
    if (cliente) {
      this.clienteForm.patchValue({
        ...cliente,
        estadoCivil: cliente.estadoCivil,
        genero: cliente.genero,
        distrito: { idDistrito: cliente.distrito?.idDistrito }
      });
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
        celular: celularData?.internationalNumber || String(formValue.celular || ''),
        // Si no es CE, aseguramos enviar null para que el backend use peruano/peruana
        nacionalidad: formValue.tipoCliente === TipoCliente.CE ? formValue.nacionalidad : null
      };

      this.clienteService.agregarCliente(nuevoCliente).subscribe({
        next: () => {
          this.toastr.success('Cliente insertado correctamente.');
          this.cerrarModal();
          this.clienteGuardado.emit();
        },
        error: (err) => this.toastr.error(err.error?.message || 'Error al guardar el cliente')
      });
    } else {
      this.clienteForm.markAllAsTouched();
    }
  }

  formatearTexto(event: any, controlName: string): void {
    const input = event.target as HTMLInputElement;
    let valor = input.value;
    if (valor) {
      valor = valor.toLowerCase().split(' ')
        .map(palabra => palabra.charAt(0).toUpperCase() + palabra.slice(1))
        .join(' ');
      this.clienteForm.get(controlName)?.setValue(valor, { emitEvent: false });
    }
  }

  formatearCelular(event: any): void {
    const input = event.target;
    let valor = input.value.replace(/\D/g, '');
    if (valor.length > 0) {
      const partes = [];
      for (let i = 0; i < valor.length; i += 3) {
        partes.push(valor.substr(i, 3));
      }
      valor = partes.join('-');
    }
    this.clienteForm.get('celular')?.setValue(valor, { emitEvent: false });
    input.value = valor;
  }

  manejarBackspace(event: KeyboardEvent): void {}
}