import { Component, HostListener, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

interface Proyecto {
  id: number;
  nombre: string;
  ubicacion: string;
  area: string;
  precioDesde: string;
  imagen: string;
  estado: 'Disponible' | 'Próximamente' | 'Últimas unidades';
  lotes: number;
}

interface Beneficio {
  icono: string;
  titulo: string;
  descripcion: string;
}

interface Testimonio {
  nombre: string;
  comentario: string;
  calificacion: number;
  imagen: string;
  rol: string;
}

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.scss']
})
export class LandingComponent {

  readonly anioActual = new Date().getFullYear();
  readonly telefono = '987 891 788';
  readonly telefonoLimpio = '51987891788';
  readonly ruc = '20537853108';
  readonly whatsappUrl = `https://wa.me/${this.telefonoLimpio}?text=${encodeURIComponent('Hola, estoy interesado en conocer más sobre los lotes disponibles.')}`;
  readonly correo = 'inmobiliariaivan.eirl@gmail.com';

  // Logo optimizado para Cloudinary (auto formato + auto calidad + ancho fijo)
  readonly logoUrl = 'https://res.cloudinary.com/dlgqaifrk/image/upload/f_auto,q_auto/v1773725974/logogrande_rfvxhu.png';
  readonly logoHeader = 'https://res.cloudinary.com/dlgqaifrk/image/upload/f_auto,q_auto,w_320/v1773725974/logogrande_rfvxhu.png';
  readonly logoFooter = 'https://res.cloudinary.com/dlgqaifrk/image/upload/f_auto,q_auto,w_180/v1773725974/logogrande_rfvxhu.png';

  menuAbierto = signal(false);
  scrolled = signal(false);

  readonly proyectos: Proyecto[] = [
    {
      id: 1,
      nombre: 'Residencial Los Pinos de Carabayllo',
      ubicacion: 'Carabayllo, Lima',
      area: 'Desde 120 m²',
      precioDesde: 'S/ 35,000',
      imagen: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&q=80&auto=format&fit=crop',
      estado: 'Disponible',
      lotes: 48
    },
    {
      id: 2,
      nombre: 'Lomas de Carabayllo',
      ubicacion: 'Carabayllo, Lima',
      area: 'Desde 90 m²',
      precioDesde: 'S/ 28,500',
      imagen: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&q=80&auto=format&fit=crop&sat=-100',
      estado: 'Últimas unidades',
      lotes: 12
    },
    {
      id: 3,
      nombre: 'Villa El Sol',
      ubicacion: 'Carabayllo, Lima',
      area: 'Desde 150 m²',
      precioDesde: 'S/ 45,000',
      imagen: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80&auto=format&fit=crop',
      estado: 'Disponible',
      lotes: 32
    },
    {
      id: 4,
      nombre: 'Praderas del Norte',
      ubicacion: 'Carabayllo, Lima',
      area: 'Desde 100 m²',
      precioDesde: 'S/ 32,000',
      imagen: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&q=80&auto=format&fit=crop&hue=30',
      estado: 'Próximamente',
      lotes: 0
    }
  ];

  readonly beneficios: Beneficio[] = [
    {
      icono: 'fa-file-contract',
      titulo: 'Título de propiedad inmediato',
      descripcion: 'Todos nuestros lotes cuentan con títulos de propiedad saneados e inscritos en Registros Públicos.'
    },
    {
      icono: 'fa-hand-holding-usd',
      titulo: 'Financiamiento directo',
      descripcion: 'Pago al contado o financiamiento directo sin intereses ocultos. Cuotas adaptadas a tu bolsillo.'
    },
    {
      icono: 'fa-road',
      titulo: 'Servicios básicos',
      descripcion: 'Lotes con acceso a agua, desagüe, luz eléctrica y pistas de acceso en todos nuestros proyectos.'
    },
    {
      icono: 'fa-shield-alt',
      titulo: 'Inversión segura',
      descripcion: 'Más de 15 años en el mercado inmobiliario respaldan cada uno de nuestros proyectos en Carabayllo.'
    },
    {
      icono: 'fa-tree',
      titulo: 'Áreas verdes',
      descripcion: 'Proyectos diseñados con áreas verdes, parques y zonas de recreación para toda la familia.'
    },
    {
      icono: 'fa-map-marker-alt',
      titulo: 'Ubicación estratégica',
      descripcion: 'Carabayllo es una de las zonas con mayor crecimiento y plusvalía en Lima Norte.'
    }
  ];

  readonly testimonios: Testimonio[] = [
    {
      nombre: 'Carlos Mendoza',
      comentario: 'Compramos nuestro terreno hace 3 años y la plusvalía ha sido increíble. El equipo nos asesoró en todo momento y el proceso fue muy transparente.',
      calificacion: 5,
      imagen: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80&auto=format&fit=crop&crop=face',
      rol: 'Propietario - Los Pinos de Carabayllo'
    },
    {
      nombre: 'María Quispe',
      comentario: 'Excelente atención y seriedad. Recibí mi título de propiedad en el tiempo prometido. Ya estoy construyendo mi casa con mucha tranquilidad.',
      calificacion: 5,
      imagen: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&q=80&auto=format&fit=crop&crop=face',
      rol: 'Propietaria - Villa El Sol'
    },
    {
      nombre: 'Jorge Ramírez',
      comentario: 'Invertí en dos lotes y la verdad no me arrepiento. La ubicación es perfecta y la zona tiene todos los servicios. Recomendados 100%.',
      calificacion: 5,
      imagen: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&q=80&auto=format&fit=crop&crop=face',
      rol: 'Inversionista'
    }
  ];

  formContacto = {
    nombre: '',
    telefono: '',
    correo: '',
    mensaje: ''
  };

  enviando = signal(false);
  enviado = signal(false);

  @HostListener('window:scroll')
  onScroll(): void {
    this.scrolled.set(window.scrollY > 50);
  }

  scrollA(id: string, event: Event): void {
    event.preventDefault();
    this.menuAbierto.set(false);
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  toggleMenu(): void {
    this.menuAbierto.update(v => !v);
  }

  enviarContacto(event: Event): void {
    event.preventDefault();
    if (this.enviando()) return;
    this.enviando.set(true);
    setTimeout(() => {
      this.enviando.set(false);
      this.enviado.set(true);
      this.formContacto = { nombre: '', telefono: '', correo: '', mensaje: '' };
      setTimeout(() => this.enviado.set(false), 5000);
    }, 1200);
  }

  getEstrellas(cal: number): number[] {
    return Array.from({ length: cal }, (_, i) => i);
  }
}
