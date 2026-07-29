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

  telefono = '';
  telefonoLimpio = '';
  whatsappUrl = '';
  correo = '';
  logoHeader = 'https://res.cloudinary.com/dlgqaifrk/image/upload/f_auto,q_auto/v1785274320/ChatGPT%20Image%2028%20jul%202026%2C%2003_48_23%20p.m._1785274320104.png';
  logoFooter = 'https://res.cloudinary.com/dlgqaifrk/image/upload/f_auto,q_auto/v1785274320/ChatGPT%20Image%2028%20jul%202026%2C%2003_48_23%20p.m._1785274320104.png';
  nombreComercial = 'Inmobiliaria Merruic';
  ruc = '';
  mapaUrl: SafeResourceUrl;

  constructor(
    private empresaService: EmpresaService,
    private sanitizer: DomSanitizer,
    private host: ElementRef<HTMLElement>
  ) {
    this.mapaUrl = this.sanitizer.bypassSecurityTrustResourceUrl(
      'https://www.google.com/maps?q=Lima&output=embed'
    );
  }

  ngOnInit(): void {
    this.empresaService.obtenerEmpresa().subscribe(e => {
      this.empresaData = e;
      if (!e) return;
      this.telefono = e.celular || '';
      this.telefonoLimpio = (e.whatsapp || '').replace(/[^\d]/g, '');
      const num = this.telefonoLimpio;
      this.whatsappUrl = `https://wa.me/${num}?text=${encodeURIComponent('Hola, estoy interesado en conocer más sobre los lotes disponibles.')}`;
      this.correo = e.email || '';
      this.logoHeader = e.logoSmallUrl || e.logoUrl || this.logoHeader;
      this.logoFooter = e.logoUrl || e.logoSmallUrl || this.logoFooter;
      this.nombreComercial = e.nombreComercial || this.nombreComercial;
      this.ruc = e.ruc || '';
      const dir = encodeURIComponent(e.direccion || 'Lima, Peru');
      this.mapaUrl = this.sanitizer.bypassSecurityTrustResourceUrl(
        `https://www.google.com/maps?q=${dir}&output=embed`
      );
    });
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

  readonly videoFases = [
    { pct: 0, izq: 'El terreno vacío te espera', der: 'Lotes desde 120 m² en Carabayllo' },
    { pct: 0.25, izq: 'Cimientos sólidos', der: 'Terreno con título saneado' },
    { pct: 0.50, izq: 'Paredes que protegen', der: 'Financiamiento directo sin bancos' },
    { pct: 0.75, izq: 'Techo que abriga', der: 'Servicios básicos incluidos' },
    { pct: 1, izq: 'Tu hogar terminado', der: 'Inversión segura, plusvalía garantizada' }
  ];

  readonly videoUrl = 'https://res.cloudinary.com/cqjufsgf/video/upload/f_auto,q_auto,vc_auto/v1785303126/videolanding_rtxtoc.mp4';

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
      this.initVideoScroll(root);
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

  private initVideoScroll(root: HTMLElement): void {
    const seccion = root.querySelector<HTMLElement>('.video-section');
    const video = root.querySelector<HTMLVideoElement>('.video-section video');
    const izqEl = root.querySelector<HTMLElement>('.video-izq');
    const derEl = root.querySelector<HTMLElement>('.video-der');
    if (!seccion || !video || !izqEl || !derEl) return;

    let duracion = video.duration || 4;

    const actualizarFase = (progreso: number) => {
      const fases = this.videoFases;
      let fase = fases[0];
      for (let i = fases.length - 1; i >= 0; i--) {
        if (progreso >= fases[i].pct) { fase = fases[i]; break; }
      }
      izqEl.textContent = fase.izq;
      derEl.textContent = fase.der;
    };

    const st = gsap.to(video, {
      currentTime: duracion,
      ease: 'none',
      scrollTrigger: {
        trigger: seccion,
        start: 'top bottom',
        end: 'bottom top',
        scrub: 1,
        onUpdate: (self: ScrollTrigger) => {
          const prog = self.progress;
          video.currentTime = prog * duracion;
          actualizarFase(prog);
        }
      }
    }).scrollTrigger;
    this.track(st);
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
