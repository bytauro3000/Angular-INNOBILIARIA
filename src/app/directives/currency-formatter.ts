import { Directive, ElementRef, HostListener, Renderer2, OnInit } from '@angular/core';
import { NgControl } from '@angular/forms';
import { DecimalPipe } from '@angular/common';

@Directive({
  selector: '[appCurrencyFormatter]',
  standalone: true,
  providers: [DecimalPipe]
})
export class CurrencyFormatterDirective implements OnInit {
  private currencySymbol: string = '$ ';

  constructor(
    private el: ElementRef,
    private control: NgControl,
    private decimalPipe: DecimalPipe,
    private renderer: Renderer2
  ) {}

  ngOnInit(): void {
    // Suscribirse a cambios del formControl para formatear cuando llega el valor del servidor
    this.control.control?.valueChanges.subscribe(value => {
      // Solo formatear si el input no tiene foco (el usuario no está escribiendo)
      if (document.activeElement !== this.el.nativeElement) {
        this.aplicarFormato(value);
      }
    });

    // Formatear el valor inicial si ya existe
    const valorInicial = this.control.control?.value;
    if (valorInicial !== null && valorInicial !== undefined && valorInicial !== 0) {
      // Esperar que el DOM esté listo
      setTimeout(() => this.aplicarFormato(valorInicial), 0);
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
      // Emitir para que valueChanges dispare y recalcule el saldo
      this.control.control?.setValue(value, { emitEvent: true });
    }
  }

  @HostListener('focus')
  onFocus() {
    this.onInput({ target: this.el.nativeElement });
  }
}