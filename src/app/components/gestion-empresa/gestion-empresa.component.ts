import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EmpresaService } from '../../services/empresa.service';
import { EmpresaResponse, EmpresaRequest } from '../../models/empresa.model';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-gestion-empresa',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './gestion-empresa.component.html',
  styleUrls: ['./gestion-empresa.component.scss']
})
export class GestionEmpresaComponent implements OnInit {
  empresas: EmpresaResponse[] = [];
  showForm = false;
  editando = false;
  empresaId: number | null = null;
  cargando = false;
  logoGrandeFile: File | null = null;
  logoPequenoFile: File | null = null;
  logoGrandePreview: string | null = null;
  logoPequenoPreview: string | null = null;
  subiendoLogoGrande = false;
  subiendoLogoPequeno = false;

  form: EmpresaRequest = {
    nombreLegal: '',
    nombreComercial: '',
    ruc: '',
    direccion: '',
    telefono: '',
    celular: '',
    email: '',
    paginaWeb: '',
    whatsapp: '',
    representanteLegal: '',
    representanteDni: '',
    partidaElectronica: '',
    ubigeo: '',
    distrito: '',
    provincia: '',
    departamento: '',
  };

  constructor(
    private empresaService: EmpresaService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.cargarEmpresas();
  }

  cargarEmpresas(): void {
    this.cargando = true;
    this.empresaService.listarTodas().subscribe({
      next: (data) => {
        this.empresas = data;
        this.cargando = false;
      },
      error: () => {
        this.toastr.error('Error al cargar empresas', 'Error');
        this.cargando = false;
      }
    });
  }

  activarEmpresa(id: number): void {
    this.empresaService.activar(id).subscribe({
      next: () => {
        this.toastr.success('Empresa activa actualizada', 'Éxito');
        this.cargarEmpresas();
        this.empresaService.limpiarCache();
      },
      error: () => this.toastr.error('Error al activar empresa', 'Error')
    });
  }

  abrirNuevo(): void {
    this.editando = false;
    this.empresaId = null;
    this.form = {
      nombreLegal: '',
      nombreComercial: '',
      ruc: '',
      direccion: '',
      telefono: '',
      celular: '',
      email: '',
      paginaWeb: '',
      whatsapp: '',
      representanteLegal: '',
      representanteDni: '',
      partidaElectronica: '',
      ubigeo: '',
      distrito: '',
      provincia: '',
      departamento: '',
    };
    this.logoGrandeFile = null;
    this.logoPequenoFile = null;
    this.logoGrandePreview = null;
    this.logoPequenoPreview = null;
    this.showForm = true;
  }

  abrirEditar(empresa: EmpresaResponse): void {
    this.editando = true;
    this.empresaId = empresa.id;
    this.form = {
      nombreLegal: empresa.nombreLegal,
      nombreComercial: empresa.nombreComercial || '',
      ruc: empresa.ruc,
      direccion: empresa.direccion || '',
      telefono: empresa.telefono || '',
      celular: empresa.celular || '',
      email: empresa.email || '',
      logoUrl: empresa.logoUrl || '',
      logoSmallUrl: empresa.logoSmallUrl || '',
      paginaWeb: empresa.paginaWeb || '',
      whatsapp: empresa.whatsapp || '',
      representanteLegal: empresa.representanteLegal || '',
      representanteDni: empresa.representanteDni || '',
      partidaElectronica: empresa.partidaElectronica || '',
      ubigeo: empresa.ubigeo || '',
      distrito: empresa.distrito || '',
      provincia: empresa.provincia || '',
      departamento: empresa.departamento || '',
    };
    this.logoGrandeFile = null;
    this.logoPequenoFile = null;
    this.logoGrandePreview = empresa.logoUrl || null;
    this.logoPequenoPreview = empresa.logoSmallUrl || null;
    this.showForm = true;
  }

  cancelarForm(): void {
    this.showForm = false;
    this.editando = false;
    this.empresaId = null;
    this.logoGrandeFile = null;
    this.logoPequenoFile = null;
    this.logoGrandePreview = null;
    this.logoPequenoPreview = null;
  }

  onLogoGrandeSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      this.logoGrandeFile = input.files[0];
      const reader = new FileReader();
      reader.onload = () => this.logoGrandePreview = reader.result as string;
      reader.readAsDataURL(this.logoGrandeFile);
    }
  }

  onLogoPequenoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      this.logoPequenoFile = input.files[0];
      const reader = new FileReader();
      reader.onload = () => this.logoPequenoPreview = reader.result as string;
      reader.readAsDataURL(this.logoPequenoFile);
    }
  }

  private async subirLogos(): Promise<void> {
    if (this.logoGrandeFile) {
      this.subiendoLogoGrande = true;
      try {
        const resp = await this.empresaService.subirLogo(this.logoGrandeFile).toPromise();
        if (resp) this.form.logoUrl = resp.url;
      } catch {
        this.toastr.error('Error al subir logo grande', 'Error');
      } finally {
        this.subiendoLogoGrande = false;
      }
    }
    if (this.logoPequenoFile) {
      this.subiendoLogoPequeno = true;
      try {
        const resp = await this.empresaService.subirLogo(this.logoPequenoFile).toPromise();
        if (resp) this.form.logoSmallUrl = resp.url;
      } catch {
        this.toastr.error('Error al subir logo pequeño', 'Error');
      } finally {
        this.subiendoLogoPequeno = false;
      }
    }
  }

  async guardar(): Promise<void> {
    if (!this.form.nombreLegal || !this.form.ruc) {
      this.toastr.warning('Nombre legal y RUC son obligatorios', 'Validación');
      return;
    }

    this.cargando = true;
    await this.subirLogos();

    if (this.editando && this.empresaId) {
      this.empresaService.actualizar(this.empresaId, this.form).subscribe({
        next: () => {
          this.toastr.success('Empresa actualizada correctamente', 'Éxito');
          this.cancelarForm();
          this.cargarEmpresas();
        },
        error: () => {
          this.toastr.error('Error al actualizar empresa', 'Error');
          this.cargando = false;
        }
      });
    } else {
      this.empresaService.crear(this.form).subscribe({
        next: () => {
          this.toastr.success('Empresa creada correctamente', 'Éxito');
          this.cancelarForm();
          this.cargarEmpresas();
        },
        error: () => {
          this.toastr.error('Error al crear empresa', 'Error');
          this.cargando = false;
        }
      });
    }
  }

  confirmarEliminar(id: number, nombre: string): void {
    if (confirm(`¿Estás seguro de eliminar "${nombre}"?`)) {
      this.empresaService.eliminar(id).subscribe({
        next: () => {
          this.toastr.success('Empresa eliminada', 'Éxito');
          this.cargarEmpresas();
        },
        error: () => this.toastr.error('Error al eliminar empresa', 'Error')
      });
    }
  }
}
