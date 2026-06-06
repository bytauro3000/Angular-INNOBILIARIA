import { PendienteInscripcionDTO } from "./PendienteInscripcion.dto";

export interface InscripcionResumenDTO {
  idContrato:     number;
  nombreCliente:  string;
  manzana:        string;
  numeroLote:     string;
  nombrePrograma?: string;
  tieneLuz:       boolean;
  tieneAgua:      boolean;

  /** true si tiene una inscripción de LUZ en estado PENDIENTE_PAGO */
  tienePendienteLuz:   boolean;
  /** true si tiene una inscripción de AGUA en estado PENDIENTE_PAGO */
  tienePendienteAgua:  boolean;

  /** Datos de la inscripción de LUZ pendiente (si existe) */
  pendienteLuz?:  PendienteInscripcionDTO;
  /** Datos de la inscripción de AGUA pendiente (si existe) */
  pendienteAgua?: PendienteInscripcionDTO;
}

