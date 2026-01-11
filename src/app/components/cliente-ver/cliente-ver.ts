import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ClienteService } from '../../services/cliente.service';
import { Cliente } from '../../models/cliente.model';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-cliente-ver',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './cliente-ver.html',
  styleUrls: ['./cliente-ver.scss']
})
export class ClienteVer implements OnInit {
  cliente?: Cliente;
  loading: boolean = true;

  constructor(
    private route: ActivatedRoute,
    private clienteService: ClienteService,
    private toastr: ToastrService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.cargarCliente(Number(id));
    } else {
      this.toastr.error('ID de cliente no válido');
      this.regresar();
    }
  }

  cargarCliente(id: number): void {
    this.clienteService.obtenerClientePorId(id).subscribe({
      next: (data) => {
        this.cliente = data;
        this.loading = false;
      },
      error: (err) => {
        this.toastr.error('No se pudo cargar la información del cliente');
        this.regresar();
      }
    });
  }

  regresar(): void {
    this.router.navigate(['/secretaria-menu/clientes']);
  }
}