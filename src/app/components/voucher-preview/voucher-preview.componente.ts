import { Component, EventEmitter, Input, Output, OnDestroy, forwardRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { OcrVoucherService, VoucherOcrData } from '../../services/ocr-voucher.service';

@Component({
  selector: 'app-voucher-preview',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="voucher-container">
      <div class="upload-area" (click)="fileInput.click()" [class.disabled]="disabled">
        <input #fileInput type="file" multiple accept="image/*" (change)="onFilesSelected($event)" [disabled]="disabled" style="display: none">
        <i class="bi bi-cloud-upload"></i>
        <span>Seleccionar imágenes</span>
      </div>

      <div class="preview-list" *ngIf="files.length > 0">
        <div class="preview-item" *ngFor="let file of files; let i = index">
          <img [src]="file.url" (click)="openLightbox(i)" alt="voucher">
          <div class="ocr-badge" *ngIf="enableOcr && i === 0" [class.ocr-processing]="ocrProcessing" [class.ocr-done]="!ocrProcessing && ocrProcessed">
            <i class="bi" [class.bi-hourglass-split]="ocrProcessing" [class.bi-check-circle-fill]="!ocrProcessing && ocrProcessed"></i>
            <span>{{ ocrProcessing ? 'Analizando...' : (ocrProcessed ? 'OCR listo' : '') }}</span>
          </div>
          <button class="remove-btn" (click)="removeFile(i)" [disabled]="disabled" title="Eliminar">
            <i class="bi bi-x"></i>
          </button>
        </div>
      </div>

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
export class VoucherPreviewComponent implements ControlValueAccessor, OnDestroy {
  @Input() disabled: boolean = false;
  @Input() enableOcr: boolean = false;
  @Output() filesChange = new EventEmitter<File[]>();
  @Output() ocrData = new EventEmitter<VoucherOcrData>();

  files: { file: File; url: string }[] = [];
  lightboxIndex: number | null = null;
  ocrProcessing: boolean = false;
  ocrProcessed: boolean = false;

  private ocrService = inject(OcrVoucherService);
  private ocrDoneForFileName: string | null = null;

  private onChange: (value: File[]) => void = () => {};
  private onTouched: () => void = () => {};

  onFilesSelected(event: any): void {
    const selectedFiles = Array.from(event.target.files) as File[];
    for (const file of selectedFiles) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        const fileEntry = { file, url: e.target.result };
        this.files.push(fileEntry);
        this.emitChange();

        if (this.enableOcr && this.ocrDoneForFileName !== file.name) {
          this.ocrDoneForFileName = file.name;
          this.runOcr(fileEntry);
        }
      };
      reader.readAsDataURL(file);
    }
  }

  removeFile(index: number): void {
    const removed = this.files[index];
    this.files.splice(index, 1);
    this.emitChange();
    if (removed && this.ocrDoneForFileName === removed.file.name) {
      this.ocrDoneForFileName = null;
      this.ocrProcessed = false;
    }
  }

  openLightbox(index: number): void {
    this.lightboxIndex = index;
  }

  closeLightbox(): void {
    this.lightboxIndex = null;
  }

  private async runOcr(fileEntry: { file: File; url: string }): Promise<void> {
    this.ocrProcessing = true;
    this.ocrProcessed = false;
    try {
      const data = await this.ocrService.extractFromImage(fileEntry.url);
      this.ocrData.emit(data);
    } catch (err) {
      console.error('OCR error:', err);
      this.ocrData.emit({ numeroOperacion: null, fechaPago: null, rawText: '', confidence: 0 });
    } finally {
      this.ocrProcessing = false;
      this.ocrProcessed = true;
    }
  }

  private emitChange(): void {
    const fileList = this.files.map(f => f.file);
    this.onChange(fileList);
    this.filesChange.emit(fileList);
  }

  ngOnDestroy(): void {
    this.ocrService.terminate();
  }

  writeValue(obj: any): void {}
  registerOnChange(fn: any): void { this.onChange = fn; }
  registerOnTouched(fn: any): void { this.onTouched = fn; }
  setDisabledState(isDisabled: boolean): void { this.disabled = isDisabled; }
}
