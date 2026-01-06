export interface DashboardData {
  lotes: number;
  parceleros: number;
  vendedores: number;
  programas: number;
  clientes: number;
  
  graficoLotes: {
    [nombrePrograma: string]: {
      Disponible?: number;
      Separado?: number;
      Vendido?: number;
    }
  };

  graficoContratos: {
    [nombrePrograma: string]: {
      CONTADO?: number;
      FINANCIADO?: number;
    }
  };
}