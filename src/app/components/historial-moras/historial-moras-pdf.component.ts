import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { ReporteMorasService, HistorialMorasData } from '../../services/reporte-moras.service';
import { HistorialMorasPdf } from '../../utils/historial-moras-pdf';

@Component({
  selector: 'app-historial-moras-pdf',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './historial-moras-pdf.component.html',
  styleUrls: ['./historial-moras-pdf.component.scss']
})
export class HistorialMorasPdfComponent implements OnInit {

  @Input() idContrato!: number;
  @Input() fechaCalculo?: string;
  @Output() cerrar = new EventEmitter<void>();

  loading = false;
  data:    HistorialMorasData | null = null;
  /** Pestaña activa en el modal: 'preview' | 'tabla' */
  tab:     'preview' | 'tabla' = 'preview';

  constructor(
    private reporteSvc: ReporteMorasService,
    private toastr:     ToastrService
  ) {}

  ngOnInit(): void {
    if (this.idContrato) this.cargar();
  }

  cargar(): void {
    this.loading = true;
    this.reporteSvc.cargar(this.idContrato, this.fechaCalculo).subscribe({
      next: (data) => {
        this.data = data;
        this.loading = false;
        if (data.bloqueA.length === 0 && data.bloqueAPagadas.length === 0 && data.bloqueB.length === 0 && data.bloqueAAnuladas.length === 0) {
          this.toastr.info('Este contrato no tiene moras para mostrar.', 'Sin datos');
        }
      },
      error: (err) => {
        this.loading = false;
        this.toastr.error(err.error?.message || 'No se pudo cargar el historial de moras.', 'Error');
      }
    });
  }

  async descargarPdf(): Promise<void> {
    if (!this.data) return;
    try {
      this.toastr.info('Generando PDF…', 'Por favor espere');
      const d = this.data;
      const lote = d.contrato.lotes?.[0];
      const mz = lote?.manzana || '';
      const lt = lote?.numeroLote || '';
      const prog = lote?.nombrePrograma || '';
      const filename = `HISTORIAL DE MORA DE LA ${mz} LT. ${lt} - ${prog}`.trim();
      await HistorialMorasPdf.generar(this.data, filename);
      this.toastr.success('PDF generado correctamente.', 'Éxito');
    } catch (e) {
      console.error(e);
      this.toastr.error('No se pudo generar el PDF.', 'Error');
    }
  }

  imprimir(): void {
    const styleId = 'print-historial-moras';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        @media print {
          @page { margin: 0; }
          html, body { margin: 0 !important; padding: 0 !important; height: auto !important; }
          * { visibility: hidden !important; }
          .print-document { visibility: visible !important; }
          .print-document * { visibility: visible !important; }
          .modal-overlay {
            position:        absolute !important;
            top:             0 !important;
            left:            0 !important;
            background:      #fff !important;
            padding:         0 !important;
            backdrop-filter: none !important;
            display:         block !important;
            width:           100% !important;
            height:          auto !important;
          }
          .modal-container {
            box-shadow:    none !important;
            max-height:    none !important;
            border-radius: 0 !important;
            overflow:      visible !important;
            display:       block !important;
            width:         100% !important;
            height:        auto !important;
          }
          .modal-body {
            overflow:      visible !important;
            background:    #fff !important;
            padding:       0 !important;
            max-height:    none !important;
            height:        auto !important;
          }
          .print-document {
            position:   static !important;
            box-shadow: none !important;
            padding:    0.2in 0.5in !important;
            width:      auto !important;
            margin:     0 !important;
          }
          .modal-header, .tabs-bar, .modal-footer, .tabla-vista, .loading-skeleton {
            display: none !important;
          }
          .doc-total-mora {
            color: #000 !important;
            background: none !important;
            border: none !important;
            font-weight: 700 !important;
          }
          .doc-total-mora strong {
            font-weight: 400 !important;
          }
          .doc-banda.banda-azul {
            background: #1e4db7 !important;
            color: #fff !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .doc-banda.banda-naranja {
            background: #ea580c !important;
            color: #fff !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .doc-banda.banda-verde {
            background: #16a34a !important;
            color: #fff !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `;
      document.head.appendChild(style);
    }
    window.print();
  }

  // ── Helpers para el template ─────────────────────────────
  fmtNumero(n: number): string {
    return (n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  fmtFecha(iso: string | null | undefined): string {
    if (!iso) return '—';
    const d = new Date(iso.length === 10 ? iso + 'T00:00:00' : iso);
    if (isNaN(d.getTime())) return iso;
    return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
  }
  fmtFechaHora(d: Date): string {
    return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}  ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
  }
  /** Fecha actual del reporte (sin hora) para moras PENDIENTES — "F. Actual" */
  fmtFechaActual(): string {
    if (!this.data) return '—';
    const d = this.data.fechaEmision;
    return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
  }
  comprobante(i: { bloque?: 'REGISTRADA' | 'PENDIENTE'; tipoComprobante: string | null; numeroComprobante: string | null }): string {
    // En MORAS PENDIENTES no hay comprobante: la celda va vacía
    if (i.bloque === 'PENDIENTE') return '';
    const t = (i.tipoComprobante || '').trim();
    const n = (i.numeroComprobante || '').trim();
    if (!t && !n) return '—';
    return `${t} ${n}`.trim();
  }
  get totalRegistrado(): number {
    return this.data?.bloqueA.reduce((s, i) => s + (i.montoMoraTotal || 0), 0) ?? 0;
  }
  get totalPendiente(): number {
    return this.data?.bloqueB.reduce((s, i) => s + (i.montoMoraTotal || 0), 0) ?? 0;
  }
  get hayContenido(): boolean {
    return !!this.data && (this.data.bloqueA.length > 0 || this.data.bloqueAPagadas.length > 0 || this.data.bloqueB.length > 0 || this.data.bloqueAAnuladas.length > 0);
  }
  abreviarDistrito(nombre: string): string {
    const mapa: Record<string, string> = {
      'SAN MARTIN DE PORRES': 'S.M.P.',
      'SAN JUAN DE LURIGANCHO': 'S.J.L.',
      'VILLA MARIA DEL TRIUNFO': 'V.M.T.',
      'VILLA EL SALVADOR': 'V.E.S.',
      'SANTIAGO DE SURCO': 'SURCO',
      'SAN JUAN DE MIRAFLORES': 'S.J.M.',
      'ATE VITARTE': 'ATE',
      'MAGDALENA DEL MAR': 'MAGDALENA',
    };
    const up = nombre.toUpperCase().trim();
    for (const [key, val] of Object.entries(mapa)) {
      if (up.includes(key)) return val;
    }
    return nombre;
  }
}
