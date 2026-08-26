import { Directive, ElementRef, Input, OnInit, OnDestroy, AfterViewInit, forwardRef } from '@angular/core';
import { NG_VALUE_ACCESSOR, ControlValueAccessor } from '@angular/forms';
import flatpickr from 'flatpickr';
import { Spanish } from 'flatpickr/dist/l10n/es';

/**
 * Directiva flatpickr — calendario con ControlValueAccessor para usar con [(ngModel)].
 * Mapea el valor como string "YYYY-MM-DD" (compatible con el backend).
 */
@Directive({
  selector: '[appFlatpickr]',
  standalone: true,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => FlatpickrDirective),
      multi: true,
    },
  ],
})
export class FlatpickrDirective implements OnInit, AfterViewInit, OnDestroy, ControlValueAccessor {

  private fp: flatpickr.Instance | null = null;
  private onChange: (value: string | null) => void = () => {};
  private onTouched: () => void = () => {};
  private lastValue: string | null = null;

  @Input() minDate?: string;
  @Input() maxDate?: string;

  constructor(private el: ElementRef<HTMLInputElement>) {}

  ngOnInit(): void {
    this.el.nativeElement.readOnly = true;
    this.el.nativeElement.classList.add('flatpickr-input');
  }

  ngAfterViewInit(): void {
    this.fp = flatpickr(this.el.nativeElement, {
      locale: Spanish,
      dateFormat: 'd/m/Y',
      altInput: true,
      altFormat: 'd/m/Y',
      disableMobile: true,
      onChange: (selectedDates: Date[], dateStr: string) => {
        this.lastValue = selectedDates.length > 0 ? this.toIso(selectedDates[0]) : null;
        this.onChange(this.lastValue);
        this.onTouched();
      },
      ...(this.minDate ? { minDate: this.minDate } : {}),
      ...(this.maxDate ? { maxDate: this.maxDate } : {}),
    });
  }

  ngOnDestroy(): void {
    this.fp?.destroy();
    this.fp = null;
  }

  // ControlValueAccessor
  writeValue(value: string | Date | null): void {
    if (value == null) {
      this.lastValue = null;
      if (this.fp) this.fp.clear();
      this.el.nativeElement.value = '';
      return;
    }
    const iso = value instanceof Date ? this.toIso(value) : value;
    this.lastValue = iso;
    if (this.fp) {
      this.fp.setDate(iso, false);
    } else {
      // Antes de inicializar: mostrar texto legible dd/mm/aaaa
      const [y, m, d] = iso.split('-');
      this.el.nativeElement.value = `${d}/${m}/${y}`;
    }
  }

  registerOnChange(fn: (value: string | null) => void): void { this.onChange = fn; }
  registerOnTouched(fn: () => void): void { this.onTouched = fn; }
  setDisabledState(isDisabled: boolean): void { this.el.nativeElement.disabled = isDisabled; }

  private toIso(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }
}