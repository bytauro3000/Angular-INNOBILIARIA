import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { LetrasCambioService } from '../../services/letracambio.service';
import { LetraCambio } from '../../models/letra-cambio.model';
import { FormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import Swal from 'sweetalert2';
import { jsPDF } from 'jspdf';
import { ReporteLetraCambioDTO } from '../../dto/reporteletracambio.dto';
import { ReporteCronogramaPagosClientesDTO } from '../../dto/reportecronogramapagocli.dto';
//Importa el módulo y la librería
import { FontAwesomeModule, FaIconLibrary } from '@fortawesome/angular-fontawesome';
//Importa los iconos específicos
import { faPrint, faCalendarAlt, faTrash } from '@fortawesome/free-solid-svg-icons';
@Component({
  selector: 'app-letracambio-listar',
  standalone: true,
  templateUrl: './letracambios-listar.html',
  styleUrls: ['./letracambios-listar.scss'],
  imports: [CommonModule, FormsModule, FontAwesomeModule],
})
export class LetracambioListarComponent implements OnInit {
  letras: LetraCambio[] = [];
  letrasFiltradas: LetraCambio[] = [];
  paginatedLetras: LetraCambio[] = [];

  terminoBusqueda: string = '';

  idContrato: number = 0;
  cargando: boolean = false;
  error: string | null = null;

  // Paginación
  pageSize: number = 9;
  currentPage: number = 1;
  totalPages: number = 0;

  //Define propiedades para usar los iconos en el HTML
  faPrint = faPrint;
  faCalendarAlt = faCalendarAlt;
  faTrash = faTrash;

  // Edición en línea
  editingLetraId: number | null = null;
  campoEditando: 'importe' | 'importeLetras' | null = null;
  valorTemporal: string | number = '';

  constructor(
    private letrasService: LetrasCambioService,
    private route: ActivatedRoute,
    private toastr: ToastrService,
    //Inyecta la librería de iconos en el constructor
    library: FaIconLibrary
  ) {
    //Registra los iconos instalados
    library.addIcons(faPrint, faCalendarAlt, faTrash);
  }

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('idContrato');
      this.idContrato = id ? +id : 0;

      if (this.idContrato > 0) {
        this.cargarLetras();
      } else {
        this.error = 'ID de contrato inválido.';
      }
    });
  }

  cargarLetras(): void {
    this.cargando = true;
    this.error = null;

    this.letrasService.listarPorContrato(this.idContrato).subscribe({
      next: letras => {
        this.letras = letras;
        this.letrasFiltradas = [...letras];
        this.aplicarPaginacion();
        this.cargando = false;
      },
      error: () => {
        this.error = 'Ocurrió un error al cargar las letras.';
        this.cargando = false;
      }
    });
  }

  //>>>>>>>>>>>>>>>>>>>>>>>>> INICIO DE IMPRIMIR LETRAS <<<<<<<<<<<<<<<<<<<<<<<//
  imprimirLetras(): void {
    this.cargando = true;

    // Obtener el reporte de letras del contrato
    this.letrasService.obtenerReportePorContrato(this.idContrato).subscribe({
      next: (reportes: ReporteLetraCambioDTO[]) => {
        // >>>>>>> BLOQUE DE CORRECCIÓN: ORDENAMIENTO ASCENDENTE <<<<<<<
      // Esto ordena las letras comparando la parte numérica de "numeroLetra" (ej. "1/110")
      reportes.sort((a, b) => {
        const numA = parseInt(a.numeroLetra.split('/')[0]);
        const numB = parseInt(b.numeroLetra.split('/')[0]);
        return numA - numB;
      });
      // >>>>>>>>>>>>>>>>>>>>>>>>> FIN BLOQUE <<<<<<<<<<<<<<<<<<<<<<<<<<<
        const doc = new jsPDF({
          orientation: 'landscape', // Orientación horizontal
          unit: 'mm',
          format: [216, 110],  // Tamaño de página 21 cm de ancho x 11 cm de alto
        });

        // Establecer la fuente para todo el documento (Times New Roman, negrita, tamaño 12)
        doc.setFont('times');
        doc.setFontSize(14);

        const espaciadoVertical = 10;  // Espacio entre las filas de datos

        // Iterar sobre los reportes para mostrarlos en el PDF
        reportes.forEach((reporte, index) => {
          // Si no es la primera letra, agregar una nueva página
          if (index > 0) {
            doc.addPage();  // Nueva página para cada letra
          }

          let y = 30;  // Reseteamos la posición Y para cada letra

          // Añadir la información de cada letra en la posición adecuada
          // Primera fila
          doc.setFontSize(10);
          doc.text(reporte.numeroLetra, 50, 22); // Número Letra
          doc.text(this.formatearFechaVista(reporte.fechaGiro), 99, 24); // Fecha de Giro formateada
          doc.text(reporte.distritoNombre, 129, 22); // Distrito Letra
          doc.text(this.formatearFechaVista(reporte.fechaVencimiento), 155, 24); // Fecha de Vencimiento formateada
          // Formatear el importe con separadores de miles y dos decimales
          const importeFormateado = reporte.importe.toLocaleString('en-US', { style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2 });
          doc.text(`$. ${importeFormateado}`, 182, 22); // Importe con separadores de miles y decimales
          y += espaciadoVertical;

          // Segunda fila
          doc.text(reporte.importeLetras, 43, 38); // Importe en Letras
          y += espaciadoVertical;

          // Tercera fila (Nombre completo del cliente 1)
          if (reporte.cliente1Nombre) {
            const cliente1Info = reporte.cliente1Apellidos
              ? reporte.cliente1Nombre + ' ' + reporte.cliente1Apellidos
              : reporte.cliente1Nombre;

            doc.text(cliente1Info, 54, 49); // Cliente 1: Nombres, Apellidos (si existe)
            y += espaciadoVertical;
          }

          // Cuarta fila (Nombre2 + Apellidos2 + DNI del Cliente 2)
          if (reporte.cliente2Nombre) {
            const cliente2Info = reporte.cliente2Apellidos
              ? reporte.cliente2Nombre + ' ' + reporte.cliente2Apellidos
              : reporte.cliente2Nombre;

            doc.text(cliente2Info + ' ' + `DNI/RUC: ${reporte.cliente2NumDocumento}`, 44, 53); // Cliente 2: Nombres, Apellidos (si existe) y DNI
            y += espaciadoVertical;
          }

          // Sexta fila (Dirección del cliente 1)
          doc.text(reporte.cliente1Direccion, 52, 58); // Dirección Cliente 1
          y += espaciadoVertical;

          // Quinta fila (DNI del cliente 1)
          doc.text(reporte.cliente1NumDocumento, 50, 64); // DNI Cliente 1
          y += espaciadoVertical;


          // Séptima fila (Distrito del cliente 1)
          doc.text(`distrito: ${reporte.cliente1Distrito}`, 88, 62); // Distrito Cliente 1
          y += espaciadoVertical;

          // Espacio adicional entre registros
          y += espaciadoVertical;
        });

        // 1. Crear el objeto binario
        const blob = doc.output('blob');

        // 2. Crear la URL temporal
        const url = URL.createObjectURL(blob);

        // 3. Abrir en pestaña nueva
        const pdfWindow = window.open(url, '_blank');

        // 4. Liberar memoria (La línea recomendada)
        if (pdfWindow) {
          // Liberamos el objeto después de que el navegador haya tenido tiempo de cargarlo
          setTimeout(() => URL.revokeObjectURL(url), 100);
        }

        this.cargando = false;
      },
      error: () => {
        this.toastr.error('Ocurrió un error al generar el reporte PDF.', 'Error');
        this.cargando = false;
      }
    });
  }

  //>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> INICIO <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<//

  // Nueva función para generar el PDF del cronograma de pagos
  imprimirCronogramaPagos(): void {
    this.cargando = true;

    this.letrasService.obtenerReporteCronogramaPagosPorContrato(this.idContrato).subscribe({
      next: (reporte: ReporteCronogramaPagosClientesDTO[]) => {
        if (!reporte || reporte.length === 0) {
          this.toastr.info('No hay datos para generar el cronograma de pagos.', 'Sin datos');
          this.cargando = false;
          return;
        }

        const doc = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: 'a4',
        });

        const margin = 15;
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const tableWidth = 124;
        const tableX = (pageWidth - tableWidth) / 2;
        const rowHeight = 7;

        let y = 10;
        let currentPage = 1;

        // Ancho de columnas
        const colWidths = { 'N°': 30, 'Vencimiento': 60, 'Importe': 40 };
        const colStarts = {
          'N°': tableX,
          'Vencimiento': tableX + colWidths['N°'],
          'Importe': tableX + colWidths['N°'] + colWidths['Vencimiento'],
        };

        // ENCABEZADO INICIAL (Página 1)
        this.addHeader(doc, reporte[0], currentPage, margin);
        y = 70; // Posición fija después del header de la primera página

        this.drawTableHeader(doc, y, margin, colWidths, colStarts, tableWidth);
        y += rowHeight;

        let totalImporte = 0;

        reporte.forEach((letra, index) => {
          // CONTROL DE SALTO DE PÁGINA
          if (y + rowHeight > pageHeight - 20) { // 20mm de margen inferior
            doc.addPage();
            currentPage++;
            y = margin; // Iniciar en el margen superior en páginas nuevas

            // En páginas nuevas (2, 3...), solo dibujamos la cabecera de la tabla
            this.drawTableHeader(doc, y, margin, colWidths, colStarts, tableWidth);
            y += rowHeight;
            doc.setFont('times', 'normal');
          }

          const numeroLetra = letra.numeroLetra.split('/')[0];
          doc.setFont('times', 'normal');
          doc.setDrawColor(200, 200, 200);
          doc.rect(tableX, y, tableWidth, rowHeight);

          doc.text(numeroLetra, colStarts['N°'] + colWidths['N°'] / 2, y + 4.5, { align: 'center' });
          doc.text(this.formatearFechaVista(letra.fechaVencimiento), colStarts['Vencimiento'] + colWidths['Vencimiento'] / 2, y + 4.5, { align: 'center' });
          doc.text(`$ ${letra.importe.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, colStarts['Importe'] + colWidths['Importe'] / 2, y + 4.5, { align: 'center' });

          // Líneas verticales
          doc.line(colStarts['Vencimiento'], y, colStarts['Vencimiento'], y + rowHeight);
          doc.line(colStarts['Importe'], y, colStarts['Importe'], y + rowHeight);

          totalImporte += letra.importe;
          y += rowHeight;
        });

        // FILA DE TOTALES
        if (y + rowHeight > pageHeight - margin) {
          doc.addPage();
          y = margin;
        }
        doc.setFont('times', 'bold');
        doc.rect(tableX, y, tableWidth, rowHeight);
        doc.text('SUMA DE IMPORTE:', colStarts['N°'] + (colWidths['N°'] + colWidths['Vencimiento']) / 2, y + 4.5, { align: 'center' });
        doc.text(`$ ${totalImporte.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, colStarts['Importe'] + colWidths['Importe'] / 2, y + 4.5, { align: 'center' });

        // 2. LÓGICA DE FIRMAS
        y += 35; // Espacio para que el cliente firme arriba de la línea

        // Verificar si hay espacio para las firmas (necesitamos unos 30mm)
        if (y + 30 > pageHeight - margin) {
          doc.addPage();
          y = margin + 25; // Si salta de página, dar espacio inicial
        }

        const lineWidth = 60; // Largo de la línea de firma
        doc.setFontSize(9);
        doc.setFont('times', 'normal');

        if (reporte[0].cliente2Nombre) {
          // --- DISEÑO PARA 2 CLIENTES ---
          const posX1 = margin + 10;
          const posX2 = pageWidth - margin - lineWidth - 10;

          // Firma Cliente 1 (Izquierda)
          doc.text('__________________________', posX1 + lineWidth / 2, y, { align: 'center' });
          doc.text(`${reporte[0].cliente1Nombre} ${reporte[0].cliente1Apellidos ?? ''}`, posX1 + lineWidth / 2, y + 5, { align: 'center' });
          doc.text(`DNI: ${reporte[0].cliente1NumDocumento}`, posX1 + lineWidth / 2, y + 9, { align: 'center' });

          // Firma Cliente 2 (Derecha)
          doc.text('__________________________', posX2 + lineWidth / 2, y, { align: 'center' });
          doc.text(`${reporte[0].cliente2Nombre} ${reporte[0].cliente2Apellidos ?? ''}`, posX2 + lineWidth / 2, y + 5, { align: 'center' });
          doc.text(`DNI: ${reporte[0].cliente2NumDocumento}`, posX2 + lineWidth / 2, y + 9, { align: 'center' });

        } else {
          // --- DISEÑO PARA 1 SOLO CLIENTE (Centrado) ---
          const posXCentrado = pageWidth / 2;

          doc.text('__________________________', posXCentrado, y, { align: 'center' });
          doc.text(`${reporte[0].cliente1Nombre} ${reporte[0].cliente1Apellidos ?? ''}`, posXCentrado, y + 5, { align: 'center' });
          doc.text(`DNI: ${reporte[0].cliente1NumDocumento}`, posXCentrado, y + 9, { align: 'center' });
        }

        // PAGINACIÓN FINAL
        const pageCount = (doc.internal as any).getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
          doc.setPage(i);
          doc.setFontSize(8);
          doc.setFont('times', 'normal');
          doc.text(`Página ${i} de ${pageCount}`, pageWidth - margin, pageHeight - 10, { align: 'right' });
        }

        const blob = doc.output('blob');
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
        setTimeout(() => URL.revokeObjectURL(url), 100);
        this.cargando = false;
      },
      error: () => {
        this.toastr.error('Error al generar el cronograma.', 'Error');
        this.cargando = false;
      }
    });
  }

  // Dibuja el encabezado de la tabla
  private drawTableHeader(doc: jsPDF, y: number, margin: number, colWidths: any, colStarts: any, tableWidth: number): void {
    doc.setFontSize(8);
    doc.setFont('times', 'bold');
    doc.setFillColor(200, 200, 200);

    // Dibuja el rectángulo de fondo para toda la cabecera
    doc.rect(colStarts['N°'], y, tableWidth, 7, 'F');  // Usar el ancho de la tabla centrada

    // Dibuja los textos de la cabecera centrados en sus respectivas columnas
    doc.text('N° Letra', colStarts['N°'] + colWidths['N°'] / 2, y + 4.5, { align: 'center' });
    doc.text('Vencimiento', colStarts['Vencimiento'] + colWidths['Vencimiento'] / 2, y + 4.5, { align: 'center' });
    doc.text('Importe', colStarts['Importe'] + colWidths['Importe'] / 2, y + 4.5, { align: 'center' });

    // Dibujar líneas verticales (separadores de las cabeceras) con el mismo color que las líneas horizontales
    doc.setDrawColor(200, 200, 200); // Color igual a las líneas horizontales
    doc.line(colStarts['N°'] + colWidths['N°'], y, colStarts['N°'] + colWidths['N°'], y + 7); // Línea vertical después de la columna "N°"
    doc.line(colStarts['Vencimiento'] + colWidths['Vencimiento'], y, colStarts['Vencimiento'] + colWidths['Vencimiento'], y + 7); // Línea vertical después de la columna "Vencimiento"
  }

  // La función 'addHeader' debe ir aquí, dentro de la clase, como un método privado.
  private addHeader(doc: jsPDF, data: ReporteCronogramaPagosClientesDTO, page: number, margin: number): void {
    const pageWidth = doc.internal.pageSize.getWidth();
    let y = 15;

    // Título y fecha
    doc.setFontSize(14);
    doc.setFont('times', 'bold');
    doc.text('CRONOGRAMA DE PAGOS', pageWidth / 2, y, { align: 'center' });
    doc.setFontSize(10);
    doc.setFont('times', 'normal');
    doc.text(`Fecha de Emisión: ${new Date().toLocaleDateString()}`, pageWidth - margin, y, { align: 'right' });

    y += 10;
    doc.setFontSize(10);
    doc.text(`Proyecto: ${data.programaNombre}`, margin, y);
    doc.text(`Vendedor: ${data.vendedorNombre} ${data.vendedorApellidos}`, 145, y);

    // Información del cliente
    y += 5;
    doc.setFont('times', 'bold');
    doc.text('Datos del Cliente', margin, y);
    doc.setFont('times', 'normal');
    doc.text(`Nombre 1: ${data.cliente1Nombre} ${data.cliente1Apellidos ?? ''}`, margin, y + 5);
    doc.text(`DNI: ${data.cliente1NumDocumento}`, 145, y + 5);
    doc.text(`Dirección: ${data.cliente1Direccion}`, margin, y + 15);
    doc.text(`Distrito: ${data.cliente1Distrito}`, 145, y + 15);
    doc.text(`Celular: ${data.cliente1Celular}`, 145, y);
    doc.text(`Teléfono: ${data.cliente1Telefono}`, 145, y + 20);

    doc.setFont('times', 'normal');
    doc.text(`Nombre 2: ${data.cliente2Nombre ?? ''} ${data.cliente2Apellidos ?? ''}`, margin, y + 10);
    doc.text(`DNI: ${data.cliente2NumDocumento ?? ''}`, 145, y + 10);

    // Información del lote
    y += 20;
    doc.setFont('times', 'bold');
    doc.text('Datos del Lote', margin, y);
    doc.setFont('times', 'normal');

    doc.text(`Lote 1: Manzana ${data.lote1Manzana ?? ''}, Lote ${data.lote1NumeroLote ?? ''} - Área: ${data.lote1Area ?? ''} m²`, margin, y + 5);
    // Lote 2: Si hay datos, mostrar Lote 2, si no mostrar vacío
    if (data.lote2Manzana && data.lote2NumeroLote && data.lote2Area) {
      doc.text(
        `Lote 2: Manzana ${data.lote2Manzana}, Lote ${data.lote2NumeroLote} - Área: ${data.lote2Area} m²`,
        margin,
        y + 10
      );
    } else {
      // Si Lote 2 no tiene datos, mostrar solo "Lote 2:" vacío
      doc.text('Lote 2: ', margin, y + 10);
    }
    doc.text(`N° de Letras:${data.cantidadLetras}`, 94, y + 5);
    doc.setFont('times', 'bold');
    doc.text(`Inicial: $. ${data.inicial?.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 145, y + 5);

    doc.text(`Monto Total: $. ${data.montoTotal?.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 94, y + 10);
    doc.text(`Saldo: $. ${data.saldo?.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 145, y + 10);


    // **Eliminado el if(page === 1) para que no se imprima aquí, ya que se hará en un bucle al final**
  }


  //>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> FIN <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<//
  filtrarLetras(): void {
    const termino = this.terminoBusqueda.trim().toLowerCase();

    if (!termino) {
      this.letrasFiltradas = [...this.letras];
    } else {
      this.letrasFiltradas = this.letras.filter(letra => {
        const parteAntesDeSlash = letra.numeroLetra?.split('/')[0].toLowerCase();
        return parteAntesDeSlash === termino;
      });
    }

    this.currentPage = 1;
    this.aplicarPaginacion();
  }

  aplicarPaginacion(): void {
    this.totalPages = Math.ceil(this.letrasFiltradas.length / this.pageSize);
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    this.paginatedLetras = this.letrasFiltradas.slice(start, end);
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.aplicarPaginacion();
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.aplicarPaginacion();
    }
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.aplicarPaginacion();
    }
  }

  getPagesArray(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  eliminarLetras(): void {
    Swal.fire({
      title: '¿Estás seguro?',
      text: '¡No podrás revertir esto!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    }).then(result => {
      if (result.isConfirmed) {
        this.cargando = true;
        this.error = null;

        this.letrasService.eliminarPorContrato(this.idContrato).subscribe({
          next: () => {
            this.toastr.success('Letras eliminadas correctamente.', '¡Éxito!');
            this.letras = [];
            this.letrasFiltradas = [];
            this.paginatedLetras = [];
            this.cargando = false;
          },
          error: () => {
            this.toastr.error('Error al eliminar las letras.', 'Error');
            this.cargando = false;
          }
        });
      }
    });
  }

  // ------------------------------------------------
  // Convierte número a letras con moneda en dólares americanos
  // ------------------------------------------------
  convertirNumeroALetras(valor: number): string {
    if (isNaN(valor) || valor === 0) return 'CERO CON 00/100 DÓLARES AMERICANOS';

    // Separar la parte entera y decimal
    const partes = valor.toFixed(2).split('.');
    const entero = parseInt(partes[0], 10);
    const decimal = partes[1]; // ya es string con dos dígitos

    let letras = this.numeroALetras(entero).toUpperCase();

    // Siempre agregamos la parte decimal con el formato CON XX/100
    letras += ` CON ${decimal}/100 DÓLARES AMERICANOS`;

    return letras;
  }

  // ------------------------------------------------
  // Función privada para convertir número entero a letras
  // ------------------------------------------------
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


  // ------------------------------
  // Métodos para edición en línea
  // ------------------------------

  iniciarEdicion(letra: LetraCambio, campo: 'importe' | 'importeLetras'): void {
    this.editingLetraId = letra.idLetra;
    this.campoEditando = campo;
    this.valorTemporal = letra[campo] ?? '';
  }

  onImporteInput(letra: LetraCambio, valor: string): void {
    const numero = Number(valor);
    if (!isNaN(numero)) {
      this.valorTemporal = numero;
      letra.importe = numero;
      letra.importeLetras = this.convertirNumeroALetras(numero);
    } else {
      this.valorTemporal = valor;
      letra.importeLetras = '';
    }
  }

  guardarEdicion(letra: LetraCambio): void {
    if (!this.campoEditando || this.editingLetraId === null) return;

    if (this.campoEditando === 'importe') {
      letra.importe = Number(this.valorTemporal);
      letra.importeLetras = this.convertirNumeroALetras(letra.importe);
    }

    this.letrasService.actualizarLetra(letra.idLetra, letra).subscribe({
      next: () => {
        this.toastr.success('Letra actualizada correctamente.', 'Éxito');
      },
      error: () => {
        this.toastr.error('Error al actualizar la letra.', 'Error');
      },
      complete: () => {
        this.cancelarEdicion();
      }
    });
  }

  cancelarEdicion(): void {
    this.editingLetraId = null;
    this.campoEditando = null;
    this.valorTemporal = '';
  }

  // Función auxiliar para formatear fechas de YYYY-MM-DD a DD/MM/YYYY
  private formatearFechaVista(fechaStr: string | Date): string {
    if (!fechaStr) return '';
    // Convertimos a string por si viene como objeto Date
    const fecha = typeof fechaStr === 'string' ? fechaStr : fechaStr.toISOString().split('T')[0];
    const [anio, mes, dia] = fecha.split('-');
    return `${dia}/${mes}/${anio}`;
  }
}

