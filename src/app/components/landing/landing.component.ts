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
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, ChatWidgetComponent],
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.scss']
})
export class LandingComponent implements OnInit, AfterViewInit, OnDestroy {

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

  get telefono(): string { return this.empresaData?.celular || '987 891 788'; }

  get telefonoFijo(): string { return this.empresaData?.telefono || '(01) 413-8679'; }

  get telefonoLimpio(): string {
    return this.empresaData?.whatsapp?.replace(/[^\d]/g, '') || '51987891788';
  }

  get ruc(): string { return this.empresaData?.ruc || '20537853108'; }

  get whatsappUrl(): string {
    const num = this.telefonoLimpio;
    return `https://wa.me/${num}?text=${encodeURIComponent('Hola, estoy interesado en conocer más sobre los lotes disponibles.')}`;
  }

  get correo(): string { return this.empresaData?.email || 'inmobiliariaivan.eirl@gmail.com'; }

  get logoUrl(): string { return this.empresaData?.logoSmallUrl || this.empresaData?.logoUrl || 'https://res.cloudinary.com/dlgqaifrk/image/upload/f_auto,q_auto/v1773725974/logogrande_rfvxhu.png'; }

  get logoHeader(): string { return this.empresaData?.logoSmallUrl || this.empresaData?.logoUrl || 'https://res.cloudinary.com/dlgqaifrk/image/upload/f_auto,q_auto,w_320/v1773725974/logogrande_rfvxhu.png'; }

  get logoFooter(): string { return this.empresaData?.logoUrl || this.empresaData?.logoSmallUrl || 'https://res.cloudinary.com/dlgqaifrk/image/upload/f_auto,q_auto,w_180/v1773725974/logogrande_rfvxhu.png'; }

  get nombreComercial(): string { return this.empresaData?.nombreComercial || 'Inmobiliaria Ivan'; }

  get mapaUrl(): SafeResourceUrl {
    const dir = encodeURIComponent(this.empresaData?.direccion || 'Av. Alfredo Mendiola 3623 Los Olivos Lima');
    return this.sanitizer.bypassSecurityTrustResourceUrl(
      `https://www.google.com/maps?q=${dir}&output=embed`
    );
  }

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
      lotes: 48,
      codigo: 'PARCELA-01',
      coord: '11°51\'S 77°01\'O'
    },
    {
      id: 2,
      nombre: 'Lomas de Carabayllo',
      ubicacion: 'Carabayllo, Lima',
      area: 'Desde 90 m²',
      precioDesde: 'S/ 28,500',
      imagen: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&q=80&auto=format&fit=crop&sat=-100',
      estado: 'Últimas unidades',
      lotes: 12,
      codigo: 'PARCELA-02',
      coord: '11°50\'S 77°02\'O'
    },
    {
      id: 3,
      nombre: 'Villa El Sol',
      ubicacion: 'Carabayllo, Lima',
      area: 'Desde 150 m²',
      precioDesde: 'S/ 45,000',
      imagen: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80&auto=format&fit=crop',
      estado: 'Disponible',
      lotes: 32,
      codigo: 'PARCELA-03',
      coord: '11°52\'S 77°00\'O'
    },
    {
      id: 4,
      nombre: 'Praderas del Norte',
      ubicacion: 'Carabayllo, Lima',
      area: 'Desde 100 m²',
      precioDesde: 'S/ 32,000',
      imagen: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800&q=80&auto=format&fit=crop&hue=30',
      estado: 'Próximamente',
      lotes: 0,
      codigo: 'PARCELA-04',
      coord: '11°49\'S 77°01\'O'
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

  readonly estadisticas: Estadistica[] = [
    { valor: 15, prefijo: '+', sufijo: '', label: 'años de experiencia' },
    { valor: 500, prefijo: '+', sufijo: '', label: 'familias atendidas' },
    { valor: 100, prefijo: '', sufijo: '%', label: 'con título saneado' }
  ];

  formContacto = {
    nombre: '',
    telefono: '',
    correo: '',
    mensaje: ''
  };

  enviando = signal(false);
  enviado = signal(false);

  private scrollTriggers: ScrollTrigger[] = [];

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

  /* ============================================================ */
  /*  GSAP / ScrollTrigger — parallax + reveals                    */
  /* ============================================================ */

  ngAfterViewInit(): void {
    if (typeof window === 'undefined') return; // guard SSR

    gsap.registerPlugin(ScrollTrigger);

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    // Esperamos un frame para asegurar que el DOM (incluyendo *ngFor) esté pintado
    requestAnimationFrame(() => {
      const root = this.host.nativeElement;
      this.initHeroAnimation(root);
      this.initConstruccionScroll(root);
      this.initSectionReveals(root);
      this.initProyectosParallax(root);
      this.initBeneficiosStagger(root);
      this.initEstadisticas(root);
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
    const contour = root.querySelector<HTMLElement>('.hero-contour');
    if (!hero) return;

    // Parallax: la imagen se expande y se desplaza más lento que el scroll
    if (heroImg) {
      const st = gsap.fromTo(heroImg,
        { scale: 1.08, yPercent: 0 },
        {
          scale: 1.28,
          yPercent: 14,
          ease: 'none',
          scrollTrigger: {
            trigger: hero,
            start: 'top top',
            end: 'bottom top',
            scrub: true
          }
        }
      ).scrollTrigger;
      this.track(st);
    }

    // Capa de curvas de nivel (topográficas) con parallax inverso
    if (contour) {
      const st = gsap.to(contour, {
        yPercent: -22,
        ease: 'none',
        scrollTrigger: {
          trigger: hero,
          start: 'top top',
          end: 'bottom top',
          scrub: 0.6
        }
      }).scrollTrigger;
      this.track(st);
    }

    // Entrada del contenido (timeline al cargar, no ligada al scroll)
    const tl = gsap.timeline({ defaults: { ease: 'power3.out', duration: 1 } });
    tl.from('.hero-badge', { opacity: 0, y: 18, duration: 0.7 })
      .from('.hero-content h1', { opacity: 0, y: 34 }, '-=0.45')
      .from('.hero-subtitle', { opacity: 0, y: 22 }, '-=0.6')
      .from('.hero-ctas > a', { opacity: 0, y: 18, stagger: 0.12, duration: 0.7 }, '-=0.55')
      .from('.hero-stats .stat', { opacity: 0, y: 18, stagger: 0.1, duration: 0.6 }, '-=0.45');
  }

  private initConstruccionScroll(root: HTMLElement): void {
    const seccion = root.querySelector<HTMLElement>('.construccion');
    const svg = root.querySelector<HTMLElement>('.construccion-svg');
    if (!seccion || !svg) return;

    const capas = Array.from(svg.querySelectorAll<SVGGElement>('.layer'));
    const fases = Array.from(root.querySelectorAll<HTMLElement>('.construccion-fase'));
    const dots = Array.from(root.querySelectorAll<HTMLElement>('.dot'));

    const totalCapas = capas.length;

    // Función para actualizar texto de fase + dots
    const actualizarFase = (progreso: number) => {
      const faseIndex = Math.min(Math.floor(progreso * (totalCapas - 0.001)), totalCapas - 1);
      fases.forEach((f, idx) => f.classList.toggle('is-active', idx === faseIndex));
      dots.forEach((d, idx) => d.classList.toggle('is-active', idx === faseIndex));
    };

    // ÚNICO ScrollTrigger — gestiona timeline + texto de fase
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: seccion,
        start: 'top top',
        end: 'bottom bottom',
        scrub: 0.4,
        onUpdate: (self: ScrollTrigger) => actualizarFase(self.progress)
      }
    });

    // Capa base visible desde el inicio
    if (capas[0]) gsap.set(capas[0], { opacity: 1, y: 0 });

    for (let i = 1; i < totalCapas; i++) {
      const capa = capas[i];
      const inicio = i / totalCapas;
      const fin = (i + 1) / totalCapas;
      const duracion = fin - inicio;

      // Trazar paths en esa capa
      const capaPaths = capa.querySelectorAll<SVGPathElement>('path.draw-path');
      const capaLines = capa.querySelectorAll<SVGLineElement>('line.draw-path');
      const capaRects = capa.querySelectorAll<SVGRectElement>('rect.draw-path');

      capaPaths.forEach(p => {
        try {
          const len = p.getTotalLength ? p.getTotalLength() : 200;
          tl.fromTo(p, { strokeDasharray: len, strokeDashoffset: len },
                       { strokeDashoffset: 0, duration: duracion * 0.8, ease: 'none' }, inicio);
        } catch {}
      });

      capaLines.forEach(l => {
        tl.fromTo(l, { strokeDasharray: 200, strokeDashoffset: 200 },
                     { strokeDashoffset: 0, duration: duracion * 0.7, ease: 'none' }, inicio);
      });

      capaRects.forEach(r => {
        const w = r.width.baseVal.value || 100;
        const h = r.height.baseVal.value || 100;
        const perim = 2 * (w + h);
        tl.fromTo(r, { strokeDasharray: perim, strokeDashoffset: perim },
                     { strokeDashoffset: 0, duration: duracion * 0.6, ease: 'none' }, inicio);
      });

      tl.fromTo(capa, { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: duracion * 0.6, ease: 'power2.out' }, inicio);
    }

    // Estado inicial
    actualizarFase(0);

    this.track(tl.scrollTrigger);
  }

  private initSectionReveals(root: HTMLElement): void {
    root.querySelectorAll<HTMLElement>('.section-head').forEach(head => {
      const st = gsap.from(head, {
        opacity: 0,
        y: 36,
        duration: 0.9,
        ease: 'power3.out',
        scrollTrigger: { trigger: head, start: 'top 85%' }
      }).scrollTrigger;
      this.track(st);
    });

    const nosotrosGrid = root.querySelector('.nosotros-grid');
    if (nosotrosGrid) {
      const st = gsap.from(root.querySelectorAll('.nosotros-card'), {
        opacity: 0,
        y: 40,
        stagger: 0.15,
        duration: 0.85,
        ease: 'power3.out',
        scrollTrigger: { trigger: nosotrosGrid, start: 'top 85%' }
      }).scrollTrigger;
      this.track(st);
    }

    const contactoGrid = root.querySelector('.contacto-grid');
    if (contactoGrid) {
      const st1 = gsap.from(root.querySelectorAll('.contacto-info > *'), {
        opacity: 0,
        x: -28,
        stagger: 0.08,
        duration: 0.8,
        ease: 'power3.out',
        scrollTrigger: { trigger: contactoGrid, start: 'top 78%' }
      }).scrollTrigger;
      this.track(st1);

      const st2 = gsap.from('.contacto-mapa', {
        opacity: 0,
        x: 28,
        duration: 0.9,
        ease: 'power3.out',
        scrollTrigger: { trigger: contactoGrid, start: 'top 78%' }
      }).scrollTrigger;
      this.track(st2);
    }
  }

  private initProyectosParallax(root: HTMLElement): void {
    const cards = root.querySelectorAll<HTMLElement>('.proyecto-card');

    cards.forEach(card => {
      const img = card.querySelector<HTMLElement>('.proyecto-img img');
      const corners = card.querySelectorAll<SVGPathElement>('.frame-corner path');

      // Efecto parallax: la imagen se expande suavemente mientras la tarjeta cruza el viewport
      if (img) {
        const st = gsap.fromTo(img,
          { scale: 1.32, yPercent: -8 },
          {
            scale: 1.06,
            yPercent: 8,
            ease: 'none',
            scrollTrigger: {
              trigger: card,
              start: 'top bottom',
              end: 'bottom top',
              scrub: true
            }
          }
        ).scrollTrigger;
        this.track(st);
      }

      // Revelado de la tarjeta
      const stReveal = gsap.from(card, {
        opacity: 0,
        y: 70,
        duration: 0.9,
        ease: 'power3.out',
        scrollTrigger: { trigger: card, start: 'top 90%', toggleActions: 'play none none reverse' }
      }).scrollTrigger;
      this.track(stReveal);

      // Trazado de las esquinas tipo "estaca de agrimensor"
      if (corners.length) {
        corners.forEach(p => {
          const len = p.getTotalLength ? p.getTotalLength() : 40;
          gsap.set(p, { strokeDasharray: len, strokeDashoffset: len });
        });
        const stCorners = gsap.to(corners, {
          strokeDashoffset: 0,
          duration: 0.7,
          stagger: 0.12,
          ease: 'power2.out',
          scrollTrigger: { trigger: card, start: 'top 88%' }
        }).scrollTrigger;
        this.track(stCorners);
      }
    });
  }

  private initBeneficiosStagger(root: HTMLElement): void {
    const grid = root.querySelector('.beneficios-grid');
    if (!grid) return;
    const st = gsap.from(root.querySelectorAll('.beneficio-card'), {
      opacity: 0,
      y: 34,
      scale: 0.96,
      stagger: 0.1,
      duration: 0.7,
      ease: 'power3.out',
      scrollTrigger: { trigger: grid, start: 'top 85%' }
    }).scrollTrigger;
    this.track(st);
  }

  private initEstadisticas(root: HTMLElement): void {
    const nums = root.querySelectorAll<HTMLElement>('.stat-num');
    nums.forEach(el => {
      const target = Number(el.getAttribute('data-valor') || '0');
      const prefijo = el.getAttribute('data-prefijo') || '';
      const sufijo = el.getAttribute('data-sufijo') || '';
      const proxy = { val: 0 };
      const st = gsap.to(proxy, {
        val: target,
        duration: 1.6,
        ease: 'power2.out',
        scrollTrigger: { trigger: el, start: 'top 92%', once: true },
        onUpdate: () => {
          el.textContent = `${prefijo}${Math.round(proxy.val)}${sufijo}`;
        }
      }).scrollTrigger;
      this.track(st);
    });
  }
}
