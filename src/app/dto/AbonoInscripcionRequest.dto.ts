import { TipoComprobante } from '../enums/tipocomprobante';
import { MedioPago } from '../enums/mediopago.enum';

export interface AbonoInscripcionRequest {
  idInscripcion:                  number;
  idContrato:                     number;
  tipoServicio:                   string;
  montoPagado:                    number;
  fechaPago:                      string;
  medioPago:                      MedioPago | string;
  numeroOperacion?:               string;
  observaciones?:                 string;
  tipoComprobante:                TipoComprobante;
  numeroComprobantePersonalizado?: string;
}