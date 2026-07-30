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
      <div class="upload-area"
        (click)="triggerFileInput()"
        [class.disabled]="disabled"
        [class.dragging]="isDragging"
        (dragover)="onDragOver($event)"
        (dragleave)="onDragLeave($event)"
        (drop)="onDrop($event)">
        <input #fileInput type="file" accept="image/*" (change)="onFileSelected($event)" [disabled]="disabled" style="display: none">
        <i class="bi bi-cloud-upload"></i>
        <span>{{ isDragging ? 'Suelta la imagen aquí' : 'Seleccionar o arrastrar imagen' }}</span>
      </div>

      <div class="preview-list" *ngIf="files.length > 0">
        <div class="preview-item" *ngFor="let file of files; let i = index">
          <img [src]="file.url" (click)="openLightbox(i)" alt="voucher">
          <button class="crop-btn" (click)="openCrop(i)" title="Recortar">
            <i class="bi bi-crop"></i>
          </button>
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

      <div class="crop-overlay" *ngIf="cropState">
        <div class="crop-modal" (mousedown)="$event.stopPropagation()">
          <div class="crop-header">
            <span>Recortar imagen</span>
            <button class="crop-close-btn" (click)="cancelCrop()"><i class="bi bi-x-lg"></i></button>
          </div>
          <div class="crop-image-wrap" #cropWrap (mousedown)="onCropBgMouseDown($event)">
            <img #cropImg [src]="cropState.url" (load)="onCropImgLoad()" alt="recortar">
            <div class="crop-selection"
              [style.left.px]="cropState.offsetX + cropState.x"
              [style.top.px]="cropState.offsetY + cropState.y"
              [style.width.px]="cropState.w"
              [style.height.px]="cropState.h"
              (mousedown)="onSelMouseDown($event)">
              <div class="crop-handle nw" data-dir="nw"></div>
              <div class="crop-handle ne" data-dir="ne"></div>
              <div class="crop-handle sw" data-dir="sw"></div>
              <div class="crop-handle se" data-dir="se"></div>
            </div>
          </div>
          <div class="crop-actions">
            <button class="crop-cancel" (click)="cancelCrop()">Cancelar</button>
            <button class="crop-confirm" (click)="confirmCrop()">Aplicar recorte</button>
          </div>
        </div>
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

  isDragging = false;
  cropState: { url: string; x: number; y: number; w: number; h: number; imgW: number; imgH: number; offsetX: number; offsetY: number; originalFile: File; editIndex: number } | null = null;
  private dragState: { startX: number; startY: number; origX: number; origY: number; origW: number; origH: number; dir: string } | null = null;

  private ocrService = inject(OcrVoucherService);
  private ocrDoneForFileNames: Set<string> = new Set();

  private onChange: (value: File[]) => void = () => {};
  private onTouched: () => void = () => {};

  triggerFileInput(): void {
    if (this.disabled) return;
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e: any) => {
      const file = e.target?.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev: any) => {
        this.openCropForFile(file, ev.target.result);
      };
      reader.readAsDataURL(file);
    };
    input.click();
  }

  onFileSelected(event: any): void {
    const file = event.target?.files?.[0];
    if (!file) return;
    this.processFile(file);
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    if (!this.disabled) this.isDragging = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
    if (this.disabled) return;
    const file = event.dataTransfer?.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) return;
    this.processFile(file);
  }

  private processFile(file: File): void {
    const reader = new FileReader();
    reader.onload = (e: any) => {
      this.openCropForFile(file, e.target.result);
    };
    reader.readAsDataURL(file);
  }

  private openCropForFile(file: File, url: string): void {
    this.cropState = { url, x: 0, y: 0, w: 0, h: 0, imgW: 0, imgH: 0, offsetX: 0, offsetY: 0, originalFile: file, editIndex: -1 };
    this.dragState = null;
  }

  openCrop(index: number): void {
    const f = this.files[index];
    if (!f) return;
    this.cropState = { url: f.url, x: 0, y: 0, w: 0, h: 0, imgW: 0, imgH: 0, offsetX: 0, offsetY: 0, originalFile: f.file, editIndex: index };
    this.dragState = null;
  }

  onCropImgLoad(): void {
    if (!this.cropState) return;
    const img = document.querySelector('.crop-image-wrap img') as HTMLImageElement;
    if (!img) return;
    const w = img.naturalWidth;
    const h = img.naturalHeight;
    const container = img.parentElement;
    if (!container) return;
    const cw = container.clientWidth;
    const ch = container.clientHeight;
    const scale = Math.min(cw / w, ch / h, 1);
    const dw = Math.round(w * scale);
    const dh = Math.round(h * scale);
    const offsetX = Math.round((cw - dw) / 2);
    const offsetY = Math.round((ch - dh) / 2);
    const margin = Math.round(Math.min(dw, dh) * 0.04);
    this.cropState = {
      ...this.cropState,
      imgW: w,
      imgH: h,
      offsetX: Math.max(offsetX, 0),
      offsetY: Math.max(offsetY, 0),
      x: margin,
      y: margin,
      w: dw - margin * 2,
      h: dh - margin * 2
    };
  }

  onCropBgMouseDown(e: MouseEvent): void {
    if (!this.cropState || this.dragState) return;
    const wrap = e.currentTarget as HTMLElement;
    const rect = wrap.getBoundingClientRect();
    if (!rect) return;
    const px = e.clientX - rect.left - this.cropState.offsetX;
    const py = e.clientY - rect.top - this.cropState.offsetY;
    const minSize = 40;
    this.cropState = { ...this.cropState, x: px, y: py, w: minSize, h: minSize };
    this.dragState = { startX: e.clientX, startY: e.clientY, origX: px, origY: py, origW: minSize, origH: minSize, dir: 'se' };
    this.initDragListeners();
  }

  onSelMouseDown(e: MouseEvent): void {
    e.stopPropagation();
    if (!this.cropState || this.disabled) return;
    const target = e.target as HTMLElement;
    const dir = target.getAttribute('data-dir') || 'move';
    this.dragState = {
      startX: e.clientX, startY: e.clientY,
      origX: this.cropState.x, origY: this.cropState.y,
      origW: this.cropState.w, origH: this.cropState.h,
      dir
    };
    this.initDragListeners();
  }

  private initDragListeners(): void {
    const onMove = (me: MouseEvent) => this.onDragMove(me);
    const onUp = () => { this.dragState = null; document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }

  private onDragMove(e: MouseEvent): void {
    if (!this.cropState || !this.dragState) return;
    const wrap = document.querySelector('.crop-image-wrap');
    if (!wrap) return;
    const rect = wrap.getBoundingClientRect();
    const dx = e.clientX - this.dragState.startX;
    const dy = e.clientY - this.dragState.startY;
    const { dir, origX, origY, origW, origH } = this.dragState;
    const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));
    let { x, y, w, h, offsetX, offsetY, imgW, imgH } = this.cropState;
    const mw = 40;
    const cropImg = document.querySelector('.crop-image-wrap img') as HTMLImageElement;
    const aw = cropImg ? cropImg.clientWidth || (rect.width - offsetX * 2) : rect.width;
    const ah = cropImg ? cropImg.clientHeight || (rect.height - offsetY * 2) : rect.height;
    if (dir === 'move') {
      x = clamp(origX + dx, 0, aw - origW);
      y = clamp(origY + dy, 0, ah - origH);
    } else if (dir === 'se') {
      w = clamp(origW + dx, mw, aw - origX);
      h = clamp(origH + dy, mw, ah - origY);
    } else if (dir === 'sw') {
      w = clamp(origW - dx, mw, origX + origW);
      x = origX + origW - w;
      h = clamp(origH + dy, mw, ah - origY);
    } else if (dir === 'ne') {
      w = clamp(origW + dx, mw, aw - origX);
      h = clamp(origH - dy, mw, origY + origH);
      y = origY + origH - h;
    } else if (dir === 'nw') {
      w = clamp(origW - dx, mw, origX + origW);
      x = origX + origW - w;
      h = clamp(origH - dy, mw, origY + origH);
      y = origY + origH - h;
    }
    this.cropState = { ...this.cropState, x, y, w, h };
  }

  cancelCrop(): void {
    this.cropState = null;
    this.dragState = null;
  }

  confirmCrop(): void {
    if (!this.cropState) return;
    const { x, y, w, h, offsetX, offsetY, originalFile, editIndex } = this.cropState;
    const img = document.querySelector('.crop-image-wrap img') as HTMLImageElement;
    if (!img) return;
    const scaleX = img.naturalWidth / (img.clientWidth || 1);
    const scaleY = img.naturalHeight / (img.clientHeight || 1);
    const sx = Math.round((x) * scaleX);
    const sy = Math.round((y) * scaleY);
    const sw = Math.round(w * scaleX);
    const sh = Math.round(h * scaleY);
    const canvas = document.createElement('canvas');
    canvas.width = sw;
    canvas.height = sh;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);
    canvas.toBlob(blob => {
      if (!blob) return;
      const name = originalFile.name.replace(/(\.\w+)$/, '_cropped$1');
      const croppedFile = new File([blob], name, { type: originalFile.type });
      const croppedUrl = URL.createObjectURL(blob);
      const entry = { file: croppedFile, url: croppedUrl };
      if (editIndex >= 0 && editIndex < this.files.length) {
        URL.revokeObjectURL(this.files[editIndex].url);
        this.files[editIndex] = entry;
      } else {
        this.files.push(entry);
      }
      this.cropState = null;
      this.dragState = null;
      this.emitChange();
      if (this.enableOcr) {
        this.ocrDoneForFileNames.add(croppedFile.name);
        this.runOcr(entry);
      }
    }, originalFile.type);
  }

  removeFile(index: number): void {
    const removed = this.files[index];
    URL.revokeObjectURL(removed.url);
    this.files.splice(index, 1);
    this.emitChange();
    if (removed) {
      this.ocrDoneForFileNames.delete(removed.file.name);
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
      this.ocrData.emit({ ...data, fileName: fileEntry.file.name });
    } catch (err) {
      console.error('OCR error:', err);
      this.ocrData.emit({ numeroOperacion: null, fechaPago: null, rawText: '', confidence: 0, fileName: fileEntry.file.name });
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
    this.files.forEach(f => URL.revokeObjectURL(f.url));
    this.ocrService.terminate();
  }

  writeValue(obj: any): void {
    if (obj === null || obj === undefined || (Array.isArray(obj) && obj.length === 0)) {
      this.files.forEach(f => URL.revokeObjectURL(f.url));
      this.files = [];
      this.ocrDoneForFileNames.clear();
      this.ocrProcessed = false;
    }
  }
  registerOnChange(fn: any): void { this.onChange = fn; }
  registerOnTouched(fn: any): void { this.onTouched = fn; }
  setDisabledState(isDisabled: boolean): void { this.disabled = isDisabled; }
}
