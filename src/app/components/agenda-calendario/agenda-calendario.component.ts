import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Title } from '@angular/platform-browser';
import { ToastrService } from 'ngx-toastr';
import { EmpresaService } from '../../services/empresa.service';
import { AgendaService, AgendaEvent } from '../../services/agenda.service';

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  isHoliday: boolean;
  holidayName?: string;
  events: AgendaEvent[];
}

interface Holiday {
  month: number;
  day: number;
  name: string;
  description: string;
}

@Component({
  selector: 'app-agenda-calendario',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './agenda-calendario.html',
  styleUrls: ['./agenda-calendario.scss']
})
export class AgendaCalendarioComponent implements OnInit {

  currentDate = new Date();
  viewDate = new Date();
  calendarDays: CalendarDay[] = [];
  events: AgendaEvent[] = [];
  weekDays = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
  months = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  selectedDate: Date | null = null;
  selectedDayEvents: AgendaEvent[] = [];

  showEventModal = false;
  editingEvent: AgendaEvent | null = null;

  newEvent: Partial<AgendaEvent> = {
    fecha: '',
    hora: '',
    titulo: '',
    descripcion: '',
    nombreCliente: '',
    telefonoCliente: '',
    estado: 'PENDIENTE'
  };

  cargando = false;

  private holidays: Holiday[] = [
    { month: 0, day: 1, name: 'Año Nuevo', description: 'Celebración del Año Nuevo' },
    { month: 4, day: 1, name: 'Día del Trabajador', description: 'Día Internacional del Trabajador' },
    { month: 5, day: 7, name: 'Día de la Bandera', description: 'Día de la Bandera del Perú' },
    { month: 5, day: 29, name: 'San Pedro y San Pablo', description: 'Festividad de San Pedro y San Pablo' },
    { month: 6, day: 28, name: 'Fiestas Patrias', description: 'Día de la Independencia del Perú' },
    { month: 6, day: 29, name: 'Fiestas Patrias', description: 'Día de las Fuerzas Armadas' },
    { month: 7, day: 6, name: 'Batalla de Junín', description: 'Aniversario de la Batalla de Junín' },
    { month: 7, day: 29, name: 'Santa Rosa de Lima', description: 'Día de Santa Rosa de Lima' },
    { month: 8, day: 24, name: 'Día de las FF.AA.', description: 'Día de las Fuerzas Armadas del Perú' },
    { month: 9, day: 8, name: 'Combate de Angamos', description: 'Aniversario del Combate Naval de Angamos' },
    { month: 10, day: 1, name: 'Todos los Santos', description: 'Día de Todos los Santos' },
    { month: 11, day: 8, name: 'Inmaculada Concepción', description: 'Día de la Inmaculada Concepción' },
    { month: 11, day: 25, name: 'Navidad', description: 'Celebración de la Navidad' }
  ];

  constructor(
    private agendaService: AgendaService,
    private cdr: ChangeDetectorRef,
    private toastr: ToastrService,
    private titleService: Title,
    private empresaService: EmpresaService
  ) {}

  ngOnInit(): void {
    this.empresaService.obtenerEmpresa().subscribe(e => {
      this.titleService.setTitle('Agenda | ' + (e?.nombreComercial || 'Inmobiliaria Ivan'));
    });
    this.loadEvents();
  }

  loadEvents(): void {
    this.cargando = true;
    const year = this.viewDate.getFullYear();
    const month = this.viewDate.getMonth();
    const inicio = new Date(year, month, 1);
    const fin = new Date(year, month + 1, 0);
    const inicioStr = this.formatDate(inicio);
    const finStr = this.formatDate(fin);

    this.agendaService.listarPorRango(inicioStr, finStr).subscribe({
      next: (data) => {
        this.events = data;
        this.generateCalendar();
        this.cargando = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.events = [];
        this.generateCalendar();
        this.cargando = false;
      }
    });
  }

  generateCalendar(): void {
    const year = this.viewDate.getFullYear();
    const month = this.viewDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    let startOffset = firstDay.getDay() - 1;
    if (startOffset < 0) startOffset = 6;

    const days: CalendarDay[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const prevMonthEnd = new Date(year, month, 0);
    for (let i = startOffset - 1; i >= 0; i--) {
      const date = new Date(year, month - 1, prevMonthEnd.getDate() - i);
      days.push(this.createDay(date, false, today));
    }

    for (let d = 1; d <= lastDay.getDate(); d++) {
      const date = new Date(year, month, d);
      days.push(this.createDay(date, true, today));
    }

    const totalCells = Math.ceil(days.length / 7) * 7;
    let nextDay = 1;
    while (days.length < totalCells) {
      const date = new Date(year, month + 1, nextDay++);
      days.push(this.createDay(date, false, today));
    }

    this.calendarDays = days;
  }

  private createDay(date: Date, isCurrentMonth: boolean, today: Date): CalendarDay {
    const dateStr = this.formatDate(date);
    const dayEvents = this.events.filter(e => e.fecha === dateStr);
    const holiday = this.holidays.find(h => h.month === date.getMonth() && h.day === date.getDate());

    return {
      date,
      isCurrentMonth,
      isToday: date.getTime() === today.getTime(),
      isHoliday: !!holiday,
      holidayName: holiday?.name,
      events: dayEvents
    };
  }

  private formatDate(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  previousMonth(): void {
    this.viewDate = new Date(this.viewDate.getFullYear(), this.viewDate.getMonth() - 1, 1);
    this.loadEvents();
  }

  nextMonth(): void {
    this.viewDate = new Date(this.viewDate.getFullYear(), this.viewDate.getMonth() + 1, 1);
    this.loadEvents();
  }

  goToToday(): void {
    this.viewDate = new Date();
    this.loadEvents();
  }

  selectDay(day: CalendarDay): void {
    this.selectedDate = day.date;
    this.selectedDayEvents = day.events;
  }

  openEventModal(day?: CalendarDay): void {
    this.editingEvent = null;
    const fecha = day ? this.formatDate(day.date) : this.formatDate(this.viewDate);
    this.newEvent = {
      fecha,
      hora: '09:00',
      titulo: '',
      descripcion: '',
      nombreCliente: '',
      telefonoCliente: '',
      estado: 'PENDIENTE'
    };
    this.showEventModal = true;
  }

  editEvent(event: AgendaEvent): void {
    this.editingEvent = event;
    this.newEvent = { ...event };
    this.showEventModal = true;
  }

  closeEventModal(): void {
    this.showEventModal = false;
    this.editingEvent = null;
  }

  saveEvent(): void {
    if (!this.newEvent.titulo || !this.newEvent.titulo.trim()) {
      this.toastr.warning('El título es obligatorio', 'Atención');
      return;
    }
    if (!this.newEvent.fecha) {
      this.toastr.warning('La fecha es obligatoria', 'Atención');
      return;
    }

    const eventData: AgendaEvent = {
      fecha: this.newEvent.fecha,
      hora: this.newEvent.hora || undefined,
      titulo: this.newEvent.titulo.trim(),
      descripcion: this.newEvent.descripcion?.trim() || undefined,
      nombreCliente: this.newEvent.nombreCliente?.trim() || undefined,
      telefonoCliente: this.newEvent.telefonoCliente?.trim() || undefined,
      estado: this.newEvent.estado as any || 'PENDIENTE'
    };

    if (this.editingEvent && this.editingEvent.idAgenda) {
      this.agendaService.actualizar(this.editingEvent.idAgenda, eventData).subscribe({
        next: () => {
          this.toastr.success('Evento actualizado correctamente', 'Éxito');
          this.closeEventModal();
          this.loadEvents();
        },
        error: () => this.toastr.error('Error al actualizar el evento', 'Error')
      });
    } else {
      this.agendaService.crear(eventData).subscribe({
        next: () => {
          this.toastr.success('Evento registrado correctamente', 'Éxito');
          this.closeEventModal();
          this.loadEvents();
        },
        error: () => this.toastr.error('Error al registrar el evento', 'Error')
      });
    }
  }

  cambiarEstadoEvento(event: AgendaEvent, estado: 'PENDIENTE' | 'COMPLETADO' | 'CANCELADO'): void {
    if (!event.idAgenda) return;
    this.agendaService.cambiarEstado(event.idAgenda, estado).subscribe({
      next: () => {
        event.estado = estado;
        this.toastr.success('Estado actualizado', 'Éxito');
      },
      error: () => this.toastr.error('Error al cambiar estado', 'Error')
    });
  }

  eliminarEvento(event: AgendaEvent): void {
    if (!event.idAgenda) return;
    if (confirm('¿Está segura de eliminar este evento?')) {
      this.agendaService.eliminar(event.idAgenda).subscribe({
        next: () => {
          this.toastr.success('Evento eliminado', 'Éxito');
          this.selectedDayEvents = this.selectedDayEvents.filter(e => e.idAgenda !== event.idAgenda);
          this.loadEvents();
        },
        error: () => this.toastr.error('Error al eliminar', 'Error')
      });
    }
  }

  getEstadoColor(estado: string): string {
    switch (estado) {
      case 'PENDIENTE': return 'pendiente';
      case 'COMPLETADO': return 'completado';
      case 'CANCELADO': return 'cancelado';
      default: return 'pendiente';
    }
  }

  getEstadoLabel(estado: string): string {
    switch (estado) {
      case 'PENDIENTE': return 'Pendiente';
      case 'COMPLETADO': return 'Completado';
      case 'CANCELADO': return 'Cancelado';
      default: return 'Pendiente';
    }
  }

  getEventosMes(): number {
    return this.events.length;
  }

  getPendientesMes(): number {
    return this.events.filter(e => e.estado === 'PENDIENTE').length;
  }

  getHoyLabel(): string {
    const hoy = new Date();
    const hoyStr = this.formatDate(hoy);
    const eventosHoy = this.events.filter(e => e.fecha === hoyStr);
    return eventosHoy.length > 0 ? `${eventosHoy.length} evento(s) hoy` : 'Sin eventos hoy';
  }
}