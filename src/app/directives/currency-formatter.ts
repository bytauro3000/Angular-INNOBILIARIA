import { Directive, ElementRef, HostListener, Renderer2 } from '@angular/core';
import { NgControl } from '@angular/forms';
import { DecimalPipe } from '@angular/common';

@Directive({
  selector: '[appCurrencyFormatter]',
  standalone: true,
  providers: [DecimalPipe]
})
export class CurrencyFormatterDirective {
  private currencySymbol: string = '$ ';

  constructor(
    private el: ElementRef,
    private control: NgControl,
    private decimalPipe: DecimalPipe,
    private renderer: Renderer2
  ) {}

  @HostListener('input', ['$event'])
  onInput(event: any) {
    const input = event.target as HTMLInputElement;
    let rawValue = input.value;

    // 1. Limpiar todo lo que no sea número o punto
    let cleanValue = rawValue.replace(/[^0-9.]/g, '');
    
    // Evitar múltiples puntos decimales
    const parts = cleanValue.split('.');
    if (parts.length > 2) cleanValue = parts[0] + '.' + parts.slice(1).join('');

    if (cleanValue === '') {
      this.control.control?.setValue(null);
      this.renderer.setProperty(input, 'value', '');
      return;
    }

    // 2. Convertir a número para el Form (valor puro)
    const numericValue = parseFloat(cleanValue);
    this.control.control?.setValue(numericValue, { emitEvent: false });

    // 3. Formatear visualmente para el input
    // Solo formateamos con comas la parte entera para no romper la escritura del decimal
    let formattedValue = '';
    const integerPart = parts[0];
    const decimalPart = parts[1];

    const formattedInteger = this.decimalPipe.transform(integerPart, '1.0-0', 'en-US') || '';
    
    formattedValue = this.currencySymbol + formattedInteger;
    
    // Si el usuario puso un punto, lo mantenemos visible
    if (cleanValue.includes('.')) {
      formattedValue += '.' + (decimalPart !== undefined ? decimalPart : '');
    }

    // 4. Actualizar el input y gestionar la posición del cursor
    const start = input.selectionStart || 0;
    const oldLength = input.value.length;
    
    this.renderer.setProperty(input, 'value', formattedValue);

    // Ajustar el cursor para que no salte al final
    const newLength = formattedValue.length;
    const selection = start + (newLength - oldLength);
    input.setSelectionRange(selection, selection);
  }

  @HostListener('blur')
  onBlur() {
    // Al salir, aseguramos que tenga los dos decimales (.00)
    const value = this.control.value;
    if (value !== null && !isNaN(value)) {
      const finalFormat = this.currencySymbol + this.decimalPipe.transform(value, '1.2-2', 'en-US');
      this.renderer.setProperty(this.el.nativeElement, 'value', finalFormat);
    }
  }

  @HostListener('focus')
  onFocus() {
    // Si hay un valor, forzamos el re-formateo para asegurar que el símbolo esté ahí
    this.onInput({ target: this.el.nativeElement });
  }
}