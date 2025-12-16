// vendedor.component.ts (Componente de la Lista)
import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Vendedor } from '../../models/vendedor.model';
import { VendedorService } from '../../services/vendedor.service';
// IMPORTAMOS EL NUEVO COMPONENTE MODAL:
import { VendedorInsertar } from '../vendedor-insertar/vendedor-insertar';

@Component({
  selector: 'app-vendedor',
  standalone: true,
  // AÑADIR EL NUEVO COMPONENTE EN IMPORTS
  imports: [CommonModule, FormsModule, VendedorInsertar], 
  templateUrl: './vendedor.html',
  styleUrls: ['./vendedor.scss']
})
export class VendedorComponent implements OnInit {
  
  // REFERENCIA AL COMPONENTE HIJO
  @ViewChild('registroModal') registroModal!: VendedorInsertar;
  
  vendedores: Vendedor[] = [];
  

  constructor(
    private vendedorService: VendedorService
    // ELIMINAMOS la inyección de DistritoService y ToastrService si no se usan directamente
  ) {}

  ngOnInit(): void {
    this.cargarVendedores();
  }

  // Ahora, el método abrirModal solo invoca al método del componente hijo.
  abrirModal(vendedor?: Vendedor) {
    this.registroModal.abrirModal(vendedor);
  }

  cargarVendedores() {
    this.vendedorService.listarVendedores().subscribe(data => {
      this.vendedores = data;
    });
  }

  // MANTENEMOS la funcionalidad de eliminar, que requiere recargar la lista
  eliminarVendedor(id: number) {
    this.vendedorService.eliminarVendedor(id).subscribe(() => {
      this.cargarVendedores();
    });
  }

  // MANTENEMOS la funcionalidad de exportar:
  descargarExcel() { /* ... */ }
  exportarPDF() { /* ... */ }
}