import { Injectable } from '@angular/core';
import { extractVoucherData, VoucherFields } from '../utils/voucher-parser';

export interface VoucherOcrData extends VoucherFields {
  rawText: string;
  confidence: number;
  fileName?: string;
}

type TesseractWorker = {
  recognize: (image: string) => Promise<{ data: { text: string; confidence: number } }>;
  terminate: () => Promise<void>;
};

type TesseractLoggerMessage = { status?: string; progress?: number };

@Injectable({ providedIn: 'root' })
export class OcrVoucherService {
  private workerPromise: Promise<TesseractWorker> | null = null;
  /** Progreso (0 a 1) del OCR activo; se notifica solo si hay un listener. */
  private progressListener: ((progress: number) => void) | null = null;

  private async getWorker(): Promise<TesseractWorker> {
    if (this.workerPromise) return this.workerPromise;

    this.workerPromise = (async () => {
      // Tesseract.js v7 es CommonJS: `module.exports = { createWorker, ... }`.
      // El bundler de Angular para producción envuelve el CJS y deja los named
      // exports en `.default`. En dev server expone los named exports directo.
      // Usamos `??` para que funcione en ambos entornos.
      const TesseractModule = await import('tesseract.js');
      const Tesseract = (TesseractModule as any).default ?? TesseractModule;
      const worker = await Tesseract.createWorker('spa', 1, {
        logger: (m: TesseractLoggerMessage) => {
          if (typeof m?.progress === 'number') this.progressListener?.(m.progress);
        }
      });
      return worker as unknown as TesseractWorker;
    })();

    return this.workerPromise;
  }

  /**
   * Precarga el worker (wasm + idioma) en segundo plano para que el primer
   * OCR no tenga que esperar la descarga completa.
   */
  warmup(): void {
    this.getWorker().catch(() => {
      // Si falla, el primer OCR real reintenta la creación del worker.
    });
  }

  /** Escucha el progreso del OCR en curso (0 a 1); null deja de escuchar. */
  setProgressListener(listener: ((progress: number) => void) | null): void {
    this.progressListener = listener;
  }

  async extractFromImage(dataUrl: string): Promise<VoucherOcrData> {
    const worker = await this.getWorker();
    const image = await this.prepareForOcr(dataUrl);
    const { data } = await worker.recognize(image);
    return {
      ...extractVoucherData(data.text),
      rawText: data.text,
      confidence: data.confidence
    };
  }

  /**
   * Reduce imágenes muy grandes antes de reconocer: Tesseract es mucho más
   * rápido con lados ≤ ~1800px y la calidad sigue siendo suficiente para
   * leer fecha y número de operación.
   */
  private prepareForOcr(dataUrl: string): Promise<string> {
    return new Promise(resolve => {
      const img = new Image();
      img.onload = () => {
        const maxDim = 1800;
        const ladoMax = Math.max(img.naturalWidth, img.naturalHeight);
        if (ladoMax <= maxDim) {
          resolve(dataUrl);
          return;
        }
        const escala = maxDim / ladoMax;
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(img.naturalWidth * escala));
        canvas.height = Math.max(1, Math.round(img.naturalHeight * escala));
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(dataUrl);
          return;
        }
        // Fondo blanco por si la imagen tiene transparencia (evita texto ilegible).
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.75));
      };
      img.onerror = () => resolve(dataUrl);
      img.src = dataUrl;
    });
  }

  async terminate(): Promise<void> {
    if (this.workerPromise) {
      try {
        const worker = await this.workerPromise;
        await worker.terminate();
      } catch {
        // ignore termination errors
      }
      this.workerPromise = null;
    }
  }
}
