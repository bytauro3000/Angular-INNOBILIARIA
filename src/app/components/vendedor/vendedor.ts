import { Component, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Vendedor } from '../../models/vendedor.model';
import { VendedorService } from '../../services/vendedor.service';

import * as bootstrap from 'bootstrap';

@Component({
  selector: 'app-vendedor',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './vendedor.html',
  styleUrls: ['./vendedor.scss']
})
export class VendedorComponent implements OnInit, AfterViewInit {
  vendedores: Vendedor[] = [];
  nuevoVendedor: Vendedor = {
    nombre: '',
    apellidos: '',
    dni: '',
    celular: '',
    direccion: '',
    email: '',
    distrito: { idDistrito: 1, nombre: '' }
  };

  vendedorEditando: Vendedor | null = null;
  private modal?: bootstrap.Modal;

  constructor(private vendedorService: VendedorService) {}

  ngOnInit(): void {
    this.cargarVendedores();
  }

  ngAfterViewInit(): void {
    const modalEl = document.getElementById('vendedorModal');
    if (modalEl) {
      this.modal = new bootstrap.Modal(modalEl);
    }
  }

  abrirModal(vendedor?: Vendedor) {
    if (vendedor) {
      // EDITAR
      this.vendedorEditando = { ...vendedor };
      this.nuevoVendedor = { ...vendedor };
    } else {
      // CREAR
      this.vendedorEditando = null;
      this.resetForm();
    }
    this.modal?.show();
  }

  cerrarModal() {
    this.modal?.hide();
  }

  cargarVendedores() {
    this.vendedorService.listarVendedores().subscribe(data => {
      this.vendedores = data;
    });
  }

  guardarVendedor() {
    if (this.vendedorEditando && this.vendedorEditando.idVendedor) {
      // EDITAR
      this.vendedorService
        .actualizarVendedor(this.vendedorEditando.idVendedor, this.nuevoVendedor)
        .subscribe(() => {
          this.cargarVendedores();
          this.resetForm();
          this.cerrarModal();
        });
    } else {
      // CREAR
      this.vendedorService.crearVendedor(this.nuevoVendedor).subscribe(() => {
        this.cargarVendedores();
        this.resetForm();
        this.cerrarModal();
      });
    }
  }

  eliminarVendedor(id: number) {
    this.vendedorService.eliminarVendedor(id).subscribe(() => {
      this.cargarVendedores();
    });
  }

  resetForm() {
    this.nuevoVendedor = {
      nombre: '',
      apellidos: '',
      dni: '',
      celular: '',
      direccion: '',
      email: '',
      distrito: { idDistrito: 1, nombre: '' }
    };
  }
}
