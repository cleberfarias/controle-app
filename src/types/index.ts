export interface ContaFixa {
  id: number;
  nome: string;
  valor: number;
  tipo: 'fixa' | 'variavel';
  venc: string;
  pagoMes: Record<string, boolean>;
}

export interface Parcelada {
  id: number;
  nome: string;
  tipo: 'dividida' | 'parcelada';
  valorTotal: number;
  divisor: number;
  parcelaAtual: number;
  parcelasPagas: number;
  pagoMes: Record<string, boolean>;
}

export interface Recebivel {
  id: number;
  cliente: string;
  aPagar: number;
  p1: number;
  p2: number;
  recebidoMes: Record<string, boolean>;
}

export interface FinanciamentoConfig {
  banco: string;
  tipo: string;
  sistema: 'PRICE' | 'SAC';
  valorFinanciado: number;
  prazo: number;
  inicio: string;
  jurosAnual: number;
  jurosMensal: number;
  parcelaInicial: number;
  seguroInicial: number;
  taxaAdmin: number;
  indiceCorrecao: 'TR' | 'IPCA' | 'Nenhum';
}

export interface AmortizacaoExtra {
  id: number;
  data: string;
  valor: number;
  origem: 'proprio' | 'fgts';
  estrategia: 'prazo' | 'parcela';
  aposParcela: number;
}

export interface AppState {
  mes: string;
  salario: number;
  beneficio: number;
  comissao: number;
  poupanca: number;
  investimento: number;
  fixas: ContaFixa[];
  parcs: Parcelada[];
  recs: Recebivel[];
  fin: FinanciamentoConfig;
  finPagas: Record<number, boolean>;
  finAmorts: AmortizacaoExtra[];
}
