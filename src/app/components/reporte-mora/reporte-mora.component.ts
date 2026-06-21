import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReporteMoraService } from '../../services/reporte-mora.service';
import { ReporteClientesMoraDTO, FilaClienteMora } from '../../dto/reporte-mora.dto';
import { ToastrService } from 'ngx-toastr';
import { HttpErrorResponse } from '@angular/common/http';
import { obtenerFechaPeru } from '../../utils/fecha-peru';

@Component({
  selector: 'app-reporte-mora',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './reporte-mora.html',
  styleUrls: ['./reporte-mora.scss']
})
export class ReporteMoraComponent implements OnInit {

  grupos: ReporteClientesMoraDTO[] = [];
  cargando = true;
  descargandoPdf = false;
  enviandoWhatsapp = new Map<number, boolean>();

  constructor(
    private reporteMoraService: ReporteMoraService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.cargarReporte();
  }

  cargarReporte(): void {
    this.cargando = true;
    this.reporteMoraService.obtenerClientesEnMora().subscribe({
      next: (data) => {
        // El backend ya devuelve los grupos ordenados por MZ → LT,
        // pero aplicamos el mismo criterio en frontend como respaldo.
        this.grupos = data.map(grupo => ({
          ...grupo,
          clientes: [...grupo.clientes].sort((a, b) => {
            const mzA = a.manzanas?.[0] ?? '';
            const mzB = b.manzanas?.[0] ?? '';
            const mzCmp = mzA.localeCompare(mzB);
            if (mzCmp !== 0) return mzCmp;
            return this.parseLote(a.numeroLotes?.[0]) - this.parseLote(b.numeroLotes?.[0]);
          })
        }));
        this.cargando = false;
      },
      error: () => {
        this.toastr.error('Error al cargar el reporte de clientes en mora', 'Error');
        this.cargando = false;
      }
    });
  }

  /** Convierte "02", "10", "A3" → número para ordenar correctamente */
  private parseLote(lote: string | undefined): number {
    const num = parseInt((lote ?? '').replace(/\D/g, ''), 10);
    return isNaN(num) ? 0 : num;
  }

  get totalClientes(): number {
    return this.grupos.reduce((sum, g) => sum + g.clientes.length, 0);
  }

  simbolo(moneda: string): string {
    return moneda === 'USD' ? '$' : 'S/';
  }

  /**
   * Convierte "yyyy-MM-dd" → "dd/MM/yyyy"
   * El backend envía LocalDate serializado como array [year, month, day]
   * o como string ISO, dependiendo de la config de Jackson.
   */
  formatFecha(fecha: any): string {
    if (!fecha) return '—';
    // Jackson con LocalDate sin módulo serializa como [yyyy, MM, dd]
    if (Array.isArray(fecha)) {
      const [y, m, d] = fecha as number[];
      return `${String(d).padStart(2,'0')}/${String(m).padStart(2,'0')}/${y}`;
    }
    // Con jackson-datatype-jsr310 serializa como "yyyy-MM-dd"
    const parts = String(fecha).split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return String(fecha);
  }

  descargarPdf(): void {
    this.descargandoPdf = true;
    this.reporteMoraService.descargarPdf().subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `reporte-mora-${obtenerFechaPeru()}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
        this.descargandoPdf = false;
      },
      error: () => {
        this.toastr.error('No se pudo descargar el PDF', 'Error');
        this.descargandoPdf = false;
      }
    });
  }

  enviarWhatsapp(fila: FilaClienteMora): void {
    if (!fila.celular) {
      this.toastr.warning(`El cliente "${fila.nombreClientes}" no tiene celular registrado`, 'WhatsApp');
      return;
    }
    const celular = fila.celular.replace(/\D/g, '');
    const celularLimpio = celular.startsWith('51') ? celular : '51' + celular;
    if (celularLimpio === '51' || celularLimpio.match(/^510+$/)) {
      this.toastr.warning(`El celular de "${fila.nombreClientes}" no es válido`, 'WhatsApp');
      return;
    }

    this.enviandoWhatsapp.set(fila.idContrato, true);
    this.reporteMoraService.enviarWhatsapp(fila).subscribe({
      next: (res: any) => {
        this.enviandoWhatsapp.set(fila.idContrato, false);
        if (res.success) {
          this.toastr.success(`Mensaje enviado a ${fila.nombreClientes}`, 'WhatsApp');
        } else {
          this.toastr.error(res.error || 'Error al enviar mensaje', 'WhatsApp');
        }
      },
      error: (err: HttpErrorResponse) => {
        this.enviandoWhatsapp.set(fila.idContrato, false);
        const msg = err.error?.error || 'Error de conexión con el servidor';
        this.toastr.error(msg, 'WhatsApp');
      }
    });
  }
}