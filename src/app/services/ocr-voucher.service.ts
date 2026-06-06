import { Injectable } from '@angular/core';
import { extractVoucherData, VoucherFields } from '../utils/voucher-parser';

export interface VoucherOcrData extends VoucherFields {
  rawText: string;
  confidence: number;
}

type TesseractWorker = {
  recognize: (image: string) => Promise<{ data: { text: string; confidence: number } }>;
  terminate: () => Promise<void>;
};

@Injectable({ providedIn: 'root' })
export class OcrVoucherService {
  private workerPromise: Promise<TesseractWorker> | null = null;

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
        logger: () => {}
      });
      return worker as unknown as TesseractWorker;
    })();

    return this.workerPromise;
  }

  async extractFromImage(dataUrl: string): Promise<VoucherOcrData> {
    const worker = await this.getWorker();
    const { data } = await worker.recognize(dataUrl);
    return {
      ...extractVoucherData(data.text),
      rawText: data.text,
      confidence: data.confidence
    };
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
