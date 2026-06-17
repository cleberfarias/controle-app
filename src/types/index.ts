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

export interface AppState {
  mes: string;
  salario: number;
  beneficio: number;
  comissao: number;
  poupanca: number;
  pctInvest: number;
  fixas: ContaFixa[];
  parcs: Parcelada[];
  recs: Recebivel[];
}
