import { Component, ElementRef, HostListener, OnInit, AfterViewInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ChatWidgetComponent } from '../chat-widget/chat-widget.component';
import { EmpresaService } from '../../services/empresa.service';
import { EmpresaPublic } from '../../models/empresa.model';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

interface Proyecto {
  id: number;
  nombre: string;
  ubicacion: string;
  area: string;
  precioDesde: string;
  imagen: string;
  estado: 'Disponible' | 'Próximamente' | 'Últimas unidades';
  lotes: number;
  codigo: string;
  coord: string;
}

interface Beneficio {
  icono: string;
  titulo: string;
  descripcion: string;
}

interface Estadistica {
  valor: number;
  prefijo: string;
  sufijo: string;
  label: string;
}

@Component({
  selector: 'app-landing-merruic',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, ChatWidgetComponent],
  templateUrl: './landing-merruic.html',
  styleUrls: ['./landing-merruic.scss']
})
export class LandingMerruicComponent implements OnInit, AfterViewInit, OnDestroy {

  readonly anioActual = new Date().getFullYear();
  empresaData: EmpresaPublic | null = null;

  constructor(
    private empresaService: EmpresaService,
    private sanitizer: DomSanitizer,
    private host: ElementRef<HTMLElement>
  ) {}

  ngOnInit(): void {
    this.empresaService.obtenerEmpresa().subscribe(e => this.empresaData = e);
  }

  get telefono(): string { return this.empresaData?.celular || ''; }

  get telefonoLimpio(): string {
    return this.empresaData?.whatsapp?.replace(/[^\d]/g, '') || '';
  }

  get whatsappUrl(): string {
    const num = this.telefonoLimpio;
    return `https://wa.me/${num}?text=${encodeURIComponent('Hola, estoy interesado en conocer más sobre los lotes disponibles.')}`;
  }

  get correo(): string { return this.empresaData?.email || ''; }

  get logoHeader(): string { return this.empresaData?.logoSmallUrl || this.empresaData?.logoUrl || 'https://res.cloudinary.com/dlgqaifrk/image/upload/f_auto,q_auto/v1785274320/ChatGPT%20Image%2028%20jul%202026%2C%2003_48_23%20p.m._1785274320104.png'; }

  get logoFooter(): string { return this.empresaData?.logoUrl || this.empresaData?.logoSmallUrl || 'https://res.cloudinary.com/dlgqaifrk/image/upload/f_auto,q_auto/v1785274320/ChatGPT%20Image%2028%20jul%202026%2C%2003_48_23%20p.m._1785274320104.png'; }

  get nombreComercial(): string { return this.empresaData?.nombreComercial || 'Inmobiliaria Merruic'; }

  get ruc(): string { return this.empresaData?.ruc || ''; }

  get mapaUrl(): SafeResourceUrl {
    const dir = encodeURIComponent(this.empresaData?.direccion || 'Lima, Peru');
    return this.sanitizer.bypassSecurityTrustResourceUrl(
      `https://www.google.com/maps?q=${dir}&output=embed`
    );
  }

  menuAbierto = signal(false);
  scrolled = signal(false);

  readonly proyectos: Proyecto[] = [
    {
      id: 1,
      nombre: 'Villa Hermosa',
      ubicacion: 'Carabayllo, Lima',
      area: 'Desde 120 m²',
      precioDesde: 'S/ 35,000',
      imagen: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&q=80&auto=format&fit=crop',
      estado: 'Disponible',
      lotes: 48,
      codigo: 'VH-01',
      coord: '11°51\'S 77°01\'O'
    },
    {
      id: 2,
      nombre: 'Los Olivos de Carabayllo',
      ubicacion: 'Carabayllo, Lima',
      area: 'Desde 90 m²',
      precioDesde: 'S/ 28,500',
      imagen: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80&auto=format&fit=crop',
      estado: 'Últimas unidades',
      lotes: 12,
      codigo: 'LOC-02',
      coord: '11°50\'S 77°02\'O'
    },
    {
      id: 3,
      nombre: 'El Mirador',
      ubicacion: 'Carabayllo, Lima',
      area: 'Desde 150 m²',
      precioDesde: 'S/ 45,000',
      imagen: 'https://images.unsplash.com/photo-1558036117-15d82a90b9b1?w=800&q=80&auto=format&fit=crop',
      estado: 'Disponible',
      lotes: 32,
      codigo: 'EM-03',
      coord: '11°52\'S 77°00\'O'
    }
  ];

  readonly beneficios: Beneficio[] = [
    {
      icono: 'fa-file-contract',
      titulo: 'Título de propiedad',
      descripcion: 'Lotes con títulos saneados e inscritos en Registros Públicos. Seguridad jurídica para tu inversión.'
    },
    {
      icono: 'fa-hand-holding-usd',
      titulo: 'Financiamiento directo',
      descripcion: 'Facilidades de pago sin intermediarios. Cuotas fijas que se ajustan a tu presupuesto familiar.'
    },
    {
      icono: 'fa-road',
      titulo: 'Servicios básicos',
      descripcion: 'Agua, desagüe, luz y pistas de acceso. Todo listo para que construyas tu hogar.'
    },
    {
      icono: 'fa-shield-alt',
      titulo: 'Inversión segura',
      descripcion: 'Años de experiencia y decenas de familias satisfechas respaldan nuestro trabajo.'
    },
    {
      icono: 'fa-tree',
      titulo: 'Entorno natural',
      descripcion: 'Proyectos rodeados de áreas verdes, con parques y zonas de recreación familiar.'
    },
    {
      icono: 'fa-chart-line',
      titulo: 'Plusvalía asegurada',
      descripcion: 'Carabayllo es una zona en crecimiento constante. Tu terreno aumentará de valor con el tiempo.'
    }
  ];

  readonly estadisticas: Estadistica[] = [
    { valor: 15, prefijo: '+', sufijo: '', label: 'años de experiencia' },
    { valor: 240, prefijo: '+', sufijo: '', label: 'familias atendidas' },
    { valor: 35, prefijo: '~', sufijo: ' min', label: 'de Lima Centro' }
  ];

  private scrollTriggers: ScrollTrigger[] = [];

  @HostListener('window:scroll')
  onScroll(): void {
    this.scrolled.set(window.scrollY > 50);
  }

  scrollA(id: string, event: Event): void {
    event.preventDefault();
    this.menuAbierto.set(false);
    document.body.style.overflow = '';
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  toggleMenu(): void {
    this.menuAbierto.update(v => {
      document.body.style.overflow = v ? '' : 'hidden';
      return !v;
    });
  }

  ngAfterViewInit(): void {
    if (typeof window === 'undefined') return;
    gsap.registerPlugin(ScrollTrigger);
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    requestAnimationFrame(() => {
      const root = this.host.nativeElement;
      this.initHeroAnimation(root);
      this.initReveals(root);
      this.initCounters(root);
      ScrollTrigger.refresh();
    });
  }

  ngOnDestroy(): void {
    this.scrollTriggers.forEach(t => t.kill());
    this.scrollTriggers = [];
  }

  private track(trigger: ScrollTrigger | undefined | null): void {
    if (trigger) this.scrollTriggers.push(trigger);
  }

  private initHeroAnimation(root: HTMLElement): void {
    const hero = root.querySelector<HTMLElement>('.hero');
    const heroImg = root.querySelector<HTMLElement>('.hero-bg img');
    if (!hero) return;

    if (heroImg) {
      const st = gsap.fromTo(heroImg,
        { scale: 1.1, yPercent: 0 },
        { scale: 1.3, yPercent: 12, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true } }
      ).scrollTrigger;
      this.track(st);
    }

    gsap.from('.hero-content > *', {
      opacity: 0, y: 30, stagger: 0.12, duration: 0.9, ease: 'power3.out', delay: 0.3
    });
  }

  private initReveals(root: HTMLElement): void {
    root.querySelectorAll('.reveal').forEach(el => {
      const st = gsap.from(el, {
        opacity: 0, y: 40, duration: 0.9, ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 85%', toggleActions: 'play none none reverse' }
      }).scrollTrigger;
      this.track(st);
    });

    root.querySelectorAll('.reveal-stagger > *').forEach((el, i) => {
      const st = gsap.from(el, {
        opacity: 0, y: 30, duration: 0.7, delay: i * 0.1, ease: 'power3.out',
        scrollTrigger: { trigger: el.parentElement, start: 'top 85%' }
      }).scrollTrigger;
      this.track(st);
    });
  }

  private initCounters(root: HTMLElement): void {
    root.querySelectorAll<HTMLElement>('.stat-num').forEach(el => {
      const target = Number(el.getAttribute('data-valor') || '0');
      const prefijo = el.getAttribute('data-prefijo') || '';
      const sufijo = el.getAttribute('data-sufijo') || '';
      const proxy = { val: 0 };
      const st = gsap.to(proxy, {
        val: target, duration: 1.8, ease: 'power2.out',
        scrollTrigger: { trigger: el, start: 'top 92%', once: true },
        onUpdate: () => { el.textContent = `${prefijo}${Math.round(proxy.val)}${sufijo}`; }
      }).scrollTrigger;
      this.track(st);
    });
  }
}
