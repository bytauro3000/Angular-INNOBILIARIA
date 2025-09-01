import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { GenerarLetrasRequest } from '../../dto/generarletra.dto';
import { DistritoService } from '../../services/distrito.service';
import { Distrito } from '../../models/distrito.model';
import { LetrasCambioService } from '../../services/letracambio.service';
import { ToastrService } from 'ngx-toastr';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { Router } from '@angular/router';

@Component({
  selector: 'app-letracambio-insertar',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './letracambio-insertar.html',
  styleUrls: ['./letracambio-insertar.scss'],
})
export class LetracambioInsertarComponent implements OnInit {
  idContrato!: number; // Ahora se obtiene desde la URL
  @Output() letrasGeneradas = new EventEmitter<void>();

  generarLetrasRequest: GenerarLetrasRequest = this.crearRequestConFechaLocal();
  distritos: Distrito[] = [];
  cargando = false;
  success: string | null = null;

  constructor(
    private distritoService: DistritoService,
    private letrasService: LetrasCambioService,
    private toastr: ToastrService,
    private route: ActivatedRoute,
    private router: Router 
  ) {}

  ngOnInit(): void {
    this.obtenerIdContratoDesdeRuta();
    this.cargarDistritos();
  }

  obtenerIdContratoDesdeRuta(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('idContrato');
      this.idContrato = id ? +id : 0;
      console.log('ID de contrato recibido:', this.idContrato);
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
      idDistrito: 0,
      fechaGiro: todayString,
      fechaVencimientoInicial: todayString,
      importe: '',
      importeLetras: '',
    };
  }

  onGenerarLetras(): void {
  if (!this.idContrato || this.idContrato <= 0) {
    this.toastr.error('No se puede generar letras sin un ID de contrato válido.');
    return;
  }

  this.cargando = true;
  this.success = null;

  const importeDesformateado = this.unformatCurrency(this.generarLetrasRequest.importe);
  this.generarLetrasRequest.importe = importeDesformateado;

  this.letrasService.generarLetras(this.idContrato, this.generarLetrasRequest).subscribe({
    next: () => {
      this.toastr.success('Las letras de cambio se generaron exitosamente.', 'Éxito');
      this.cargando = false;

      // ✅ Redirige al listado de letras del contrato generado
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
    const rawValue = value.replace(/[^0-9.]/g, '');
    this.generarLetrasRequest.importe = rawValue;
    this.convertirImporteALetras(rawValue);
  }

  onImporteBlur(): void {
    this.generarLetrasRequest.importe = this.formatCurrency(this.generarLetrasRequest.importe);
  }

  onImporteFocus(): void {
    this.generarLetrasRequest.importe = this.unformatCurrency(this.generarLetrasRequest.importe);
  }

  private convertirImporteALetras(valor: string): void {
    const valorFloat = parseFloat(valor);
    if (!isNaN(valorFloat)) {
      const parteEntera = Math.floor(valorFloat);
      const parteDecimal = Math.round((valorFloat - parteEntera) * 100);
      const letras = this.numeroALetras(parteEntera).toUpperCase();
      const centavos = parteDecimal.toString().padStart(2, '0');
      this.generarLetrasRequest.importeLetras = `${letras} CON ${centavos}/100 DÓLARES AMERICANOS`;
    } else {
      this.generarLetrasRequest.importeLetras = '';
    }
  }

  private formatCurrency(value: string): string {
    let rawValue = value.replace(/[^0-9.]/g, '');
    if (!rawValue) return '';
    let floatVal = parseFloat(rawValue);
    if (isNaN(floatVal)) return '';
    return floatVal.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  private unformatCurrency(value: string): string {
    return value.replace(/[$,]/g, '');
  }

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
}
