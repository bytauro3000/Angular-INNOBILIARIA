import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { GenerarLetrasRequest } from '../../dto/generarletra.dto';
import { GrupoLetras } from '../../dto/grupo-letras.dto';
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
import { CurrencyFormatterDirective } from '../../directives/currency-formatter';

@Component({
  selector: 'app-letracambio-insertar',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, CurrencyFormatterDirective],
  templateUrl: './letracambio-insertar.html',
  styleUrls: ['./letracambio-insertar.scss'],
})
export class LetracambioInsertarComponent implements OnInit {
  idContrato!: number;
  @Output() letrasGeneradas = new EventEmitter<void>();

  tieneLetras: boolean = false;
  monedaContrato: Moneda = 'USD';

  /** Total de letras del contrato (usado para validar en modo grupos) */
  cantidadLetrasContrato: number = 0;
  /** Saldo del contrato (usado para mostrar diferencia en modo grupos) */
  saldoContrato: number = 0;

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
  ) { }

  ngOnInit(): void {
    this.obtenerIdContratoDesdeRuta();
    this.cargarDistritos();
  }

  /** Llamado por ngModel cuando la directiva actualiza el valor numérico del importe */
  onImporteModelChange(valor: any): void {
    this.onImporteChange(typeof valor === 'number' ? valor : parseFloat(valor));
  }

  obtenerIdContratoDesdeRuta(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('idContrato');
      this.idContrato = id ? +id : 0;

      if (this.idContrato > 0) {
        this.cargarDatosContrato();
        this.verificarLetrasExistentes();
      }
    });
  }

  cargarDatosContrato(): void {
    this.contratoService.obtenerContratoPorId(this.idContrato).subscribe({
      next: (contrato) => {
        this.monedaContrato = contrato.moneda || 'USD';
        this.cantidadLetrasContrato = contrato.cantidadLetras || 0;
        this.saldoContrato = contrato.saldo || 0;

        // Usar la fecha del contrato como fecha de giro (emisión)
        if (contrato.fechaContrato) {
          const fechaStr = String(contrato.fechaContrato).substring(0, 10);
          this.generarLetrasRequest.fechaGiro = fechaStr;
        }
      },
      error: () => {
        this.monedaContrato = 'USD';
      }
    });
  }

  verificarLetrasExistentes(): void {
    this.letrasService.existenLetrasBatch([this.idContrato]).subscribe({
      next: (resultado) => {
        this.tieneLetras = resultado[this.idContrato] ?? false;
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
      modoGrupos: false,
      grupos: [],
      usarUltimoDiaMes: false,
    };
  }

  // ── Lógica de selección de modo ────────────────────────────────────────────

  /** Activa modo automático y desactiva los demás */
  activarModoAutomatico(): void {
    this.generarLetrasRequest.modoAutomatico = true;
    this.generarLetrasRequest.modoGrupos = false;
    this.generarLetrasRequest.importe = '';
    this.generarLetrasRequest.importeLetras = '';
    this.generarLetrasRequest.grupos = [];
  }

  /** Activa modo manual (importe fijo) y desactiva los demás */
  activarModoManual(): void {
    this.generarLetrasRequest.modoAutomatico = false;
    this.generarLetrasRequest.modoGrupos = false;
    this.generarLetrasRequest.grupos = [];
  }

  /** Activa modo grupos y desactiva los demás */
  activarModoGrupos(): void {
    this.generarLetrasRequest.modoAutomatico = false;
    this.generarLetrasRequest.modoGrupos = true;
    this.generarLetrasRequest.importe = '';
    this.generarLetrasRequest.importeLetras = '';
    if (this.generarLetrasRequest.grupos.length === 0) {
      this.agregarGrupo();
    }
  }

  // ── Gestión de grupos ──────────────────────────────────────────────────────

  agregarGrupo(): void {
    this.generarLetrasRequest.grupos.push({ cantidad: 0, importe: '' });
  }

  eliminarGrupo(index: number): void {
    this.generarLetrasRequest.grupos.splice(index, 1);
  }

  /**
   * Calcula el subtotal de un grupo (cantidad × importe).
   * Se usa desde el template para evitar regex en expresiones Angular.
   */
  calcularSubtotalGrupo(grupo: GrupoLetras): number {
    const imp = parseFloat(String(grupo.importe).replace(/[^0-9.]/g, '')) || 0;
    return (grupo.cantidad || 0) * imp;
  }

  /** Suma de las cantidades ingresadas en todos los grupos */
  get totalLetrasGrupos(): number {
    return this.generarLetrasRequest.grupos.reduce(
      (sum, g) => sum + (g.cantidad || 0), 0
    );
  }

  /** Suma total de (cantidad × importe) de todos los grupos */
  get totalMontoGrupos(): number {
    return this.generarLetrasRequest.grupos.reduce((sum, g) => {
      const imp = parseFloat(String(g.importe).replace(/[^0-9.]/g, '')) || 0;
      return sum + imp * (g.cantidad || 0);
    }, 0);
  }

  /** Diferencia entre la suma de grupos y el saldo del contrato */
  get diferenciaSaldo(): number {
    return parseFloat((this.totalMontoGrupos - this.saldoContrato).toFixed(2));
  }

  /** ¿Coincide la suma de cantidades con las del contrato? */
  get cantidadGruposOk(): boolean {
    return this.cantidadLetrasContrato > 0 &&
      this.totalLetrasGrupos === this.cantidadLetrasContrato;
  }

  /** ¿Coincide el monto total de grupos con el saldo del contrato? */
  get montoGruposOk(): boolean {
    return this.saldoContrato > 0 && this.diferenciaSaldo === 0;
  }

  // ── Helpers del formulario ─────────────────────────────────────────────────

  get diaDeFechaVencimiento(): number {
    const fechaStr = this.generarLetrasRequest.fechaVencimientoInicial;
    if (!fechaStr) return 0;
    return new Date(fechaStr + 'T00:00:00').getDate();
  }

  get simboloMoneda(): string {
    return this.monedaContrato === 'PEN' ? 'S/ ' : '$ ';
  }

  get mostrarCheckUltimoDia(): boolean {
    const fechaStr = this.generarLetrasRequest.fechaVencimientoInicial;
    if (!fechaStr) return false;
    const fecha = new Date(fechaStr + 'T00:00:00');
    const diasDelMes = new Date(fecha.getFullYear(), fecha.getMonth() + 1, 0).getDate();
    return fecha.getDate() === diasDelMes && diasDelMes <= 30;
  }

  onFechaVencimientoChange(): void {
    if (!this.mostrarCheckUltimoDia) {
      this.generarLetrasRequest.usarUltimoDiaMes = false;
    }
  }

  onGenerarLetras(): void {
    if (!this.idContrato || this.idContrato <= 0) {
      this.toastr.error('No se puede generar letras sin un ID de contrato válido.');
      return;
    }

    if (this.generarLetrasRequest.modoGrupos) {
      if (this.generarLetrasRequest.grupos.length === 0) {
        this.toastr.error('Debe agregar al menos un grupo de letras.', 'Error');
        return;
      }
      if (!this.cantidadGruposOk) {
        this.toastr.error(
          `La suma de letras en los grupos (${this.totalLetrasGrupos}) debe ser igual a la cantidad del contrato (${this.cantidadLetrasContrato}).`,
          'Error de cantidad'
        );
        return;
      }
      if (!this.montoGruposOk) {
        this.toastr.error(
          `El monto total de los grupos (${this.simboloMoneda}${this.totalMontoGrupos.toLocaleString('es-PE', { minimumFractionDigits: 2 })}) debe ser igual al saldo del contrato (${this.simboloMoneda}${this.saldoContrato.toLocaleString('es-PE', { minimumFractionDigits: 2 })}).`,
          'Error de monto'
        );
        return;
      }
    }

    this.cargando = true;
    this.success = null;

    if (!this.generarLetrasRequest.modoAutomatico && !this.generarLetrasRequest.modoGrupos) {
      const raw = String(this.generarLetrasRequest.importe).replace(/[^0-9.]/g, '');
      this.generarLetrasRequest.importe = raw;
    }

    this.letrasService.generarLetras(this.idContrato, this.generarLetrasRequest).subscribe({
      next: () => {
        this.toastr.success('Las letras de cambio se generaron exitosamente.', 'Éxito');
        this.cargando = false;
        this.tieneLetras = true;
        this.letrasGeneradas.emit();
        this.router.navigate(['/secretaria-menu/letras/listar', this.idContrato]);
      },
      error: (err) => {
        const mensajeBackend = err?.error?.message || err?.error || 'Revise los datos ingresados.';
        this.toastr.error(mensajeBackend, 'Error al generar letras');
        this.cargando = false;
        console.error(err);
      },
    });
  }

  onImporteChange(valor: number | null): void {
    if (this.generarLetrasRequest.modoAutomatico || valor == null || isNaN(valor)) {
      this.generarLetrasRequest.importeLetras = '';
      return;
    }
    const parteEntera = Math.floor(valor);
    const parteDecimal = Math.round((valor - parteEntera) * 100);
    const letras = this.numeroALetras(parteEntera).toUpperCase();
    const centavos = parteDecimal.toString().padStart(2, '0');
    const sufijo = this.monedaContrato === 'PEN' ? 'SOLES' : 'DÓLARES AMERICANOS';
    this.generarLetrasRequest.importeLetras = `${letras} CON ${centavos}/100 ${sufijo}`;
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
      letras += miles === 1 ? "mil" : this.numeroALetras(miles) + " mil";
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