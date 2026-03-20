import { Directive, ElementRef, HostListener, Renderer2, OnInit, Input, OnChanges, SimpleChanges } from '@angular/core';
import { NgControl } from '@angular/forms';
import { DecimalPipe } from '@angular/common';

@Directive({
  selector: '[appCurrencyFormatter]',
  standalone: true,
  providers: [DecimalPipe]
})
export class CurrencyFormatterDirective implements OnInit, OnChanges {

  @Input() currencySymbol: string = '$ ';

  constructor(
    private el: ElementRef,
    private control: NgControl,
    private decimalPipe: DecimalPipe,
    private renderer: Renderer2
  ) {}

  ngOnInit(): void {
    this.control.control?.valueChanges.subscribe(value => {
      if (document.activeElement !== this.el.nativeElement) {
        this.aplicarFormato(value);
      }
    });

    const valorInicial = this.control.control?.value;
    if (valorInicial !== null && valorInicial !== undefined && valorInicial !== 0) {
      setTimeout(() => this.aplicarFormato(valorInicial), 0);
    }
  }

  // Se dispara cada vez que cambia currencySymbol desde el componente padre
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['currencySymbol'] && !changes['currencySymbol'].firstChange) {
      const value = this.control.control?.value;
      // Reformatear inmediatamente con el nuevo símbolo
      if (value !== null && value !== undefined && !isNaN(Number(value)) && Number(value) !== 0) {
        this.aplicarFormato(value);
      } else {
        // Si el valor es 0 o vacío, limpiar el símbolo del input
        const current = this.el.nativeElement.value;
        const limpio = current.replace(/[^0-9.]/g, '');
        if (limpio) {
          this.renderer.setProperty(this.el.nativeElement, 'value', this.currencySymbol + limpio);
        }
      }
    }
  }

  private aplicarFormato(value: any) {
    if (value !== null && value !== undefined && !isNaN(Number(value)) && Number(value) !== 0) {
      const finalFormat = this.currencySymbol + this.decimalPipe.transform(Number(value), '1.2-2', 'en-US');
      this.renderer.setProperty(this.el.nativeElement, 'value', finalFormat);
    }
  }

  @HostListener('input', ['$event'])
  onInput(event: any) {
    const input = event.target as HTMLInputElement;
    let rawValue = input.value;

    let cleanValue = rawValue.replace(/[^0-9.]/g, '');

    const parts = cleanValue.split('.');
    if (parts.length > 2) cleanValue = parts[0] + '.' + parts.slice(1).join('');

    if (cleanValue === '') {
      this.control.control?.setValue(null, { emitEvent: false });
      this.renderer.setProperty(input, 'value', '');
      return;
    }

    const numericValue = parseFloat(cleanValue);
    this.control.control?.setValue(numericValue, { emitEvent: false });

    const integerPart = parts[0];
    const decimalPart = parts[1];
    const formattedInteger = this.decimalPipe.transform(integerPart, '1.0-0', 'en-US') || '';

    let formattedValue = this.currencySymbol + formattedInteger;
    if (cleanValue.includes('.')) {
      formattedValue += '.' + (decimalPart !== undefined ? decimalPart : '');
    }

    const start = input.selectionStart || 0;
    const oldLength = input.value.length;
    this.renderer.setProperty(input, 'value', formattedValue);
    const newLength = formattedValue.length;
    input.setSelectionRange(start + (newLength - oldLength), start + (newLength - oldLength));
  }

  @HostListener('blur')
  onBlur() {
    const value = this.control.value;
    if (value !== null && !isNaN(value)) {
      const finalFormat = this.currencySymbol + this.decimalPipe.transform(value, '1.2-2', 'en-US');
      this.renderer.setProperty(this.el.nativeElement, 'value', finalFormat);
      this.control.control?.setValue(value, { emitEvent: true });
    }
  }

  @HostListener('focus')
  onFocus() {
    this.onInput({ target: this.el.nativeElement });
  }
}