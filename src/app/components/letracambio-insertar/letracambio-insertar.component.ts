import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { GenerarLetrasRequest } from '../../dto/generarletra.dto';
import { DistritoService } from '../../services/distrito.service';
import { Distrito } from '../../models/distrito.model';
import { LetrasCambioService } from '../../services/letracambio.service';
import { ToastrService } from 'ngx-toastr';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { ContratoService } from '../../services/contrato.service';
import { Moneda } from '../../dto/moneda.enum';
import { Router } from '@angular/router';

@Component({
  selector: 'app-letracambio-insertar',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './letracambio-insertar.html',
  styleUrls: ['./letracambio-insertar.scss'],
})
export class LetracambioInsertarComponent implements OnInit {
  idContrato!: number;
  @Output() letrasGeneradas = new EventEmitter<void>();

  tieneLetras: boolean = false;
  monedaContrato: Moneda = 'USD';

  generarLetrasRequest: GenerarLetrasRequest = this.crearRequestConFechaLocal();
  distritos: Distrito[] = [];
  cargando = false;
  success: string | null = null;

  constructor(
    private distritoService: DistritoService,
    private letrasService: LetrasCambioService,
    private toastr: ToastrService,
    private route: ActivatedRoute,
    private router: Router,
    private contratoService: ContratoService
  ) {}

  ngOnInit(): void {
    this.obtenerIdContratoDesdeRuta();
    this.cargarDistritos();
  }

  obtenerIdContratoDesdeRuta(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('idContrato');
      this.idContrato = id ? +id : 0;

      if (this.idContrato > 0) {
        this.cargarMonedaContrato();
        // Siempre consultamos al backend si ya existen letras reales generadas.
        // NO usamos el queryParam 'cantidadLetras' del contrato porque ese campo
        // representa las letras planificadas al crear el contrato, no las generadas.
        this.verificarLetrasExistentes();
      }
    });
  }

  cargarMonedaContrato(): void {
    this.contratoService.obtenerContratoPorId(this.idContrato).subscribe({
      next: (contrato) => { this.monedaContrato = contrato.moneda || 'USD'; },
      error: () => { this.monedaContrato = 'USD'; }
    });
  }

  verificarLetrasExistentes(): void {
    // Usa el endpoint liviano GET /api/letras/existe/{idContrato}
    // que devuelve solo true/false sin traer los datos de las letras
    this.letrasService.existenLetras(this.idContrato).subscribe({
      next: (existe) => {
        this.tieneLetras = existe;
      },
      error: () => {
        this.tieneLetras = false;
      }
    });
  }

  cargarDistritos(): void {
    this.distritoService.listarDistritos().subscribe({
      next: (data) => (this.distritos = data),
      error: (err) => console.error(err),
    });
  }

  crearRequestConFechaLocal(): GenerarLetrasRequest {
    const today = new Date();
    const year = today.getFullYear();
    const month = (today.getMonth() + 1).toString().padStart(2, '0');
    const day = today.getDate().toString().padStart(2, '0');
    const todayString = `${year}-${month}-${day}`;

    return {
      idDistrito: 8,
      fechaGiro: todayString,
      fechaVencimientoInicial: todayString,
      importe: '',
      importeLetras: '',
      modoAutomatico: true,
    };
  }

  onGenerarLetras(): void {
    if (!this.idContrato || this.idContrato <= 0) {
      this.toastr.error('No se puede generar letras sin un ID de contrato válido.');
      return;
    }

    this.cargando = true;
    this.success = null;

    if (!this.generarLetrasRequest.modoAutomatico) {
      const importeDesformateado = this.unformatCurrency(this.generarLetrasRequest.importe);
      this.generarLetrasRequest.importe = importeDesformateado;
    }

    this.letrasService.generarLetras(this.idContrato, this.generarLetrasRequest).subscribe({
      next: () => {
        this.toastr.success('Las letras de cambio se generaron exitosamente.', 'Éxito');
        this.cargando = false;
        this.tieneLetras = true;
        this.letrasGeneradas.emit();

        if (this.generarLetrasRequest.modoAutomatico) {
          this.letrasService.listarPorContrato(this.idContrato).subscribe({
            next: (letras) => {
              if (letras.length > 0) {
                const importe = letras[0].importe;
                this.generarLetrasRequest.importe = importe.toString();
                this.convertirImporteALetras(this.generarLetrasRequest.importe);
              }
            },
            error: (err) => {
              console.error('Error al obtener letras generadas', err);
            }
          });
        }

        this.router.navigate(['/secretaria-menu/letras/listar', this.idContrato]);
      },
      error: (err) => {
        this.toastr.error('Error al generar letras. Revise los datos.', 'Error');
        this.cargando = false;
        console.error(err);
      },
    });
  }

  onImporteChange(value: string): void {
    if (!this.generarLetrasRequest.modoAutomatico) {
      const rawValue = value.replace(/[^0-9.]/g, '');
      this.generarLetrasRequest.importe = rawValue;
      this.convertirImporteALetras(rawValue);
    }
  }

  onImporteBlur(): void {
    if (!this.generarLetrasRequest.modoAutomatico) {
      this.generarLetrasRequest.importe = this.formatCurrency(this.generarLetrasRequest.importe);
    }
  }

  onImporteFocus(): void {
    if (!this.generarLetrasRequest.modoAutomatico) {
      this.generarLetrasRequest.importe = this.unformatCurrency(this.generarLetrasRequest.importe);
    }
  }

  private convertirImporteALetras(valor: string): void {
    const valorFloat = parseFloat(valor);
    if (!isNaN(valorFloat)) {
      const parteEntera = Math.floor(valorFloat);
      const parteDecimal = Math.round((valorFloat - parteEntera) * 100);
      const letras = this.numeroALetras(parteEntera).toUpperCase();
      const centavos = parteDecimal.toString().padStart(2, '0');
      const sufijo = this.monedaContrato === 'PEN' ? 'SOLES' : 'DÓLARES AMERICANOS';
      this.generarLetrasRequest.importeLetras = `${letras} CON ${centavos}/100 ${sufijo}`;
    } else {
      this.generarLetrasRequest.importeLetras = '';
    }
  }

  private formatCurrency(value: string): string {
    let rawValue = value.replace(/[^0-9.]/g, '');
    if (!rawValue) return '';
    let floatVal = parseFloat(rawValue);
    if (isNaN(floatVal)) return '';
    const currencyCode = this.monedaContrato === 'PEN' ? 'PEN' : 'USD';
    return floatVal.toLocaleString('en-US', {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  private unformatCurrency(value: string): string {
    return value.replace(/[$,S\/. ]/g, '');
  }

  private numeroALetras(num: number): string {
    const unidades = ["", "uno", "dos", "tres", "cuatro", "cinco", "seis", "siete", "ocho", "nueve"];
    const especiales = ["diez", "once", "doce", "trece", "catorce", "quince", "dieciséis", "diecisiete", "dieciocho", "diecinueve"];
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

    if (num >= 10 && num <= 19) {
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
}