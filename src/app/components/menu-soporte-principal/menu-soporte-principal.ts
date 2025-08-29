import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { DashboardService } from '../../services/dashboard.service';

@Component({
  selector: 'app-menu-soporte-principal',
  standalone: true,
  imports: [RouterModule, CommonModule],
  templateUrl: './menu-soporte-principal.html',
  styleUrls: ['./menu-soporte-principal.scss']
})
export class MenuSoportePrincipal implements OnInit {

  cards = [
    { title: 'Lotes', icon: 'bi bi-box-seam', link: '/soporte-menu/lotes', color: 'card-lotes', total: 0 },
    { title: 'Parceleros', icon: 'bi bi-tree', link: '/soporte-menu/parceleros', color: 'card-parceleros', total: 0 },
    { title: 'Vendedores', icon: 'bi bi-person-badge', link: '/soporte-menu/vendedores', color: 'card-vendedores', total: 0 },
    { title: 'Programas', icon: 'bi bi-clipboard-check', link: '/soporte-menu/programas', color: 'card-programas', total: 0 }
  ];

  constructor(private dashboardService: DashboardService) {}

  ngOnInit(): void {
    this.dashboardService.getTotales().subscribe(data => {
      this.cards.find(c => c.title === 'Lotes')!.total = data.lotes;
      this.cards.find(c => c.title === 'Parceleros')!.total = data.parceleros;
      this.cards.find(c => c.title === 'Vendedores')!.total = data.vendedores;
      this.cards.find(c => c.title === 'Programas')!.total = data.programas;
    });
  }
}
