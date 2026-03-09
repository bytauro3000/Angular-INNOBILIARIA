import { Component, EventEmitter, Input, Output, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'app-voucher-preview',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="voucher-container">
      <!-- Área de selección -->
      <div class="upload-area" (click)="fileInput.click()" [class.disabled]="disabled">
        <input #fileInput type="file" multiple accept="image/*" (change)="onFilesSelected($event)" [disabled]="disabled" style="display: none">
        <i class="bi bi-cloud-upload"></i>
        <span>Seleccionar imágenes</span>
      </div>

      <!-- Miniaturas -->
      <div class="preview-list" *ngIf="files.length > 0">
        <div class="preview-item" *ngFor="let file of files; let i = index">
          <img [src]="file.url" (click)="openLightbox(i)" alt="voucher">
          <button class="remove-btn" (click)="removeFile(i)" [disabled]="disabled" title="Eliminar">
            <i class="bi bi-x"></i>
          </button>
        </div>
      </div>

      <!-- Lightbox -->
      <div class="lightbox" *ngIf="lightboxIndex !== null" (click)="closeLightbox()">
        <img [src]="files[lightboxIndex].url" (click)="$event.stopPropagation()" alt="voucher grande">
        <button class="close-lightbox" (click)="closeLightbox()"><i class="bi bi-x-lg"></i></button>
      </div>
    </div>
  `,
  styleUrls: ['./voucher-preview.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => VoucherPreviewComponent),
      multi: true
    }
  ]
})
export class VoucherPreviewComponent implements ControlValueAccessor {
  @Input() disabled: boolean = false;
  @Output() filesChange = new EventEmitter<File[]>();

  files: { file: File; url: string }[] = [];
  lightboxIndex: number | null = null;

  private onChange: (value: File[]) => void = () => {};
  private onTouched: () => void = () => {};

  onFilesSelected(event: any): void {
    const selectedFiles = Array.from(event.target.files) as File[];
    for (const file of selectedFiles) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.files.push({ file, url: e.target.result });
        this.emitChange();
      };
      reader.readAsDataURL(file);
    }
  }

  removeFile(index: number): void {
    this.files.splice(index, 1);
    this.emitChange();
  }

  openLightbox(index: number): void {
    this.lightboxIndex = index;
  }

  closeLightbox(): void {
    this.lightboxIndex = null;
  }

  private emitChange(): void {
    const fileList = this.files.map(f => f.file);
    this.onChange(fileList);
    this.filesChange.emit(fileList);
  }

  // ControlValueAccessor
  writeValue(obj: any): void {}
  registerOnChange(fn: any): void { this.onChange = fn; }
  registerOnTouched(fn: any): void { this.onTouched = fn; }
  setDisabledState(isDisabled: boolean): void { this.disabled = isDisabled; }
}