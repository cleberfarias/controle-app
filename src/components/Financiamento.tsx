import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText, BarChart3, Table, Calculator, Plus, Trash2, Info,
  ChevronLeft, ChevronRight, Home, Landmark, TrendingDown, Clock,
  DollarSign, Shield, PiggyBank, Target,
} from 'lucide-react';
import { GlassCard } from './GlassCard';
import { FinanciamentoConfig, AmortizacaoExtra } from '../types';
import { fmt } from '../hooks/useFinanceData';

interface ScheduleItem {
  num: number;
  dataVenc: string;
  parcela: number;
  juros: number;
  amort: number;
  seguro: number;
  taxa: number;
  total: number;
  saldoAntes: number;
  saldoApos: number;
  status: 'paga' | 'aberta' | 'atrasada';
}

interface Props {
  fin: FinanciamentoConfig;
  finPagas: Record<number, boolean>;
  finAmorts: AmortizacaoExtra[];
  updateFin: (partial: Partial<FinanciamentoConfig>) => void;
  toggleFinPaga: (num: number, checked: boolean) => void;
  addAmort: () => void;
  removeAmort: (id: number) => void;
  updateAmort: (id: number, field: string, value: any) => void;
}

type SubTab = 'cadastro' | 'resumo' | 'historico' | 'simulador';

const subTabs: { id: SubTab; label: string; icon: React.FC<any> }[] = [
  { id: 'cadastro', label: 'Cadastro', icon: FileText },
  { id: 'resumo', label: 'Resumo', icon: BarChart3 },
  { id: 'historico', label: 'Historico', icon: Table },
  { id: 'simulador', label: 'Simulador', icon: Calculator },
];

function gerarSchedule(fin: FinanciamentoConfig, finPagas: Record<number, boolean>, finAmorts: AmortizacaoExtra[]): ScheduleItem[] {
  if (!fin.valorFinanciado || !fin.prazo || !fin.jurosMensal) return [];
  const r = fin.jurosMensal / 100;
  const n = fin.prazo;
  let saldo = fin.valorFinanciado;
  const fator = Math.pow(1 + r, n);
  let currentPmt = saldo * (r * fator) / (fator - 1);
  const schedule: ScheduleItem[] = [];
  const [anoIni, mesIni] = (fin.inicio || '2024-09').split('-').map(Number);
  const amorts = finAmorts.filter(a => a.aposParcela > 0 && a.valor > 0).sort((a, b) => a.aposParcela - b.aposParcela);
  const hoje = new Date();

  for (let i = 1; i <= n && saldo > 0.01; i++) {
    const juros = saldo * r;
    const amort = Math.min(currentPmt, saldo + juros) - juros;
    const seguro = fin.seguroInicial || 0;
    const taxa = fin.taxaAdmin || 0;
    const total = currentPmt + seguro + taxa;
    const mesAtual = ((mesIni - 1 + (i - 1)) % 12) + 1;
    const anoAtual = anoIni + Math.floor((mesIni - 1 + (i - 1)) / 12);
    const dataVenc = anoAtual + '-' + String(mesAtual).padStart(2, '0') + '-02';
    const saldoAntes = saldo;
    saldo = Math.max(0, saldo - amort);
    const dataP = new Date(anoAtual, mesAtual - 1, 2);
    const isPago = finPagas[i];
    let status: 'paga' | 'aberta' | 'atrasada' = 'aberta';
    if (isPago) status = 'paga';
    else if (dataP < hoje) status = 'atrasada';

    schedule.push({ num: i, dataVenc, parcela: currentPmt, juros, amort, seguro, taxa, total, saldoAntes, saldoApos: saldo, status });

    for (const am of amorts) {
      if (am.aposParcela === i && saldo > 0.01) {
        const va = Math.min(am.valor, saldo);
        saldo = Math.max(0, saldo - va);
        const restante = n - i;
        if (am.estrategia === 'parcela' && restante > 0) {
          const fn = Math.pow(1 + r, restante);
          currentPmt = saldo * (r * fn) / (fn - 1);
        }
      }
    }
    if (saldo <= 0.01) break;
  }
  return schedule;
}

export const Financiamento: React.FC<Props> = ({ fin, finPagas, finAmorts, updateFin, toggleFinPaga, addAmort, removeAmort, updateAmort }) => {
  const [subTab, setSubTab] = useState<SubTab>('cadastro');
  const [histPage, setHistPage] = useState(0);
  const [simValor, setSimValor] = useState('');
  const [simOrigem, setSimOrigem] = useState<'proprio' | 'fgts'>('proprio');
  const [simEstrategia, setSimEstrategia] = useState<'prazo' | 'parcela'>('prazo');
  const [simFreq, setSimFreq] = useState<'unico' | 'mensal'>('mensal');
  const [simResult, setSimResult] = useState<React.ReactNode | null>(null);

  const schedule = useMemo(() => gerarSchedule(fin, finPagas, finAmorts), [fin, finPagas, finAmorts]);

  // Calcula parcela atual automaticamente pela data
  const parcelaAtual = useMemo(() => {
    if (!fin.inicio) return 0;
    const [anoIni, mesIni] = fin.inicio.split('-').map(Number);
    const hoje = new Date();
    const diff = (hoje.getFullYear() - anoIni) * 12 + (hoje.getMonth() + 1 - mesIni) + 1;
    return Math.max(1, Math.min(diff, fin.prazo));
  }, [fin.inicio, fin.prazo]);

  const pagas = useMemo(() => schedule.filter(p => p.status === 'paga'), [schedule]);
  const totalPago = pagas.reduce((s, p) => s + p.total, 0);
  const totalJuros = pagas.reduce((s, p) => s + p.juros, 0);
  const totalAmort = pagas.reduce((s, p) => s + p.amort, 0);
  const totalSeg = pagas.reduce((s, p) => s + p.seguro + p.taxa, 0);
  const ultimaPaga = pagas.length > 0 ? pagas[pagas.length - 1] : null;
  const saldoAtual = ultimaPaga ? ultimaPaga.saldoApos : fin.valorFinanciado;
  const restantes = schedule.length - pagas.length;
  const pctPago = schedule.length > 0 ? Math.round((pagas.length / schedule.length) * 100) : 0;

  const nM = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  const ultima = schedule[schedule.length - 1];
  const prevQuit = ultima ? (() => { const [y, m] = ultima.dataVenc.split('-'); return nM[parseInt(m) - 1] + '/' + y; })() : '-';

  const totalProj = schedule.reduce((s, p) => s + p.total, 0);
  const totalJurosProj = schedule.reduce((s, p) => s + p.juros, 0);
  const totalSegProj = schedule.reduce((s, p) => s + p.seguro + p.taxa, 0);

  const perPage = 12;
  const totalPages = Math.max(1, Math.ceil(schedule.length / perPage));
  const safePage = Math.min(histPage, totalPages - 1);
  const pageItems = schedule.slice(safePage * perPage, (safePage + 1) * perPage);

  // Saldo devedor estimado na parcela atual
  const saldoHoje = useMemo(() => {
    const item = schedule.find(p => p.num === parcelaAtual);
    return item ? item.saldoApos : fin.valorFinanciado;
  }, [schedule, parcelaAtual, fin.valorFinanciado]);

  // Parcela mensal calculada
  const pmtCalculado = useMemo(() => {
    const r = fin.jurosMensal / 100;
    const n = fin.prazo;
    if (!r || !n) return 0;
    const fator = Math.pow(1 + r, n);
    return fin.valorFinanciado * (r * fator) / (fator - 1);
  }, [fin.valorFinanciado, fin.jurosMensal, fin.prazo]);

  function simular() {
    const valor = parseFloat(simValor) || 0;
    if (!valor) {
      setSimResult(<p className="val-red" style={{ marginTop: 12 }}>Informe o valor extra que deseja amortizar.</p>);
      return;
    }
    const r = fin.jurosMensal / 100;
    const n = fin.prazo;
    const fator = Math.pow(1 + r, n);
    const pmtOrig = fin.valorFinanciado * (r * fator) / (fator - 1);
    const segTaxa = (fin.seguroInicial || 0) + (fin.taxaAdmin || 0);

    // Calcula saldo na parcela atual
    let saldoInicio = fin.valorFinanciado;
    for (let i = 1; i <= parcelaAtual && saldoInicio > 0; i++) saldoInicio -= (pmtOrig - saldoInicio * r);
    const saldoAntes = saldoInicio;
    const restAntes = n - parcelaAtual;

    // === CENARIO SEM AMORTIZAR: total que pagaria normalmente ===
    const totalSem = restAntes * (pmtOrig + segTaxa);

    if (simFreq === 'mensal') {
      // ── PAGAMENTO EXTRA TODO MES ──
      // Simula mes a mes: paga PMT normal + extra, ate quitar
      let saldo = saldoAntes;
      let meses = 0;
      let totalJurosCom = 0;
      let totalPagoCom = 0;

      while (saldo > 0.01 && meses < restAntes + 500) {
        const juros = saldo * r;
        const amortNormal = Math.min(pmtOrig - juros, saldo);
        saldo -= amortNormal;
        const amortExtra = Math.min(valor, saldo);
        saldo -= amortExtra;
        totalJurosCom += juros;
        totalPagoCom += pmtOrig + amortExtra + segTaxa;
        meses++;
      }

      // Cenario sem amortizar (mes a mes tambem, para juros exatos)
      let saldoSem = saldoAntes;
      let mesesSem = 0;
      let totalJurosSem = 0;
      while (saldoSem > 0.01 && mesesSem < restAntes + 100) {
        const juros = saldoSem * r;
        const amort = Math.min(pmtOrig - juros, saldoSem);
        saldoSem -= amort;
        totalJurosSem += juros;
        mesesSem++;
      }

      const mesesEcon = mesesSem - meses;
      const jurosEcon = Math.max(0, totalJurosSem - totalJurosCom);
      const totalExtroPago = meses * valor;

      // Data de quitacao estimada
      const [anoIni, mesIni] = (fin.inicio || '2024-09').split('-').map(Number);
      const mesQuit = ((mesIni - 1 + parcelaAtual + meses - 1) % 12) + 1;
      const anoQuit = anoIni + Math.floor((mesIni - 1 + parcelaAtual + meses - 1) / 12);
      const nMeses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
      const dataQuit = nMeses[mesQuit - 1] + '/' + anoQuit;

      const mesQuitSem = ((mesIni - 1 + parcelaAtual + mesesSem - 1) % 12) + 1;
      const anoQuitSem = anoIni + Math.floor((mesIni - 1 + parcelaAtual + mesesSem - 1) / 12);
      const dataQuitSem = nMeses[mesQuitSem - 1] + '/' + anoQuitSem;

      setSimResult(
        <GlassCard delay={0} hover3d={false} className="sim-result-card">
          <div className="section-header"><div className="section-title"><Target size={18} /> Resultado — {fmt(valor)}/mes extra</div></div>
          <p className="hint-text" style={{ marginBottom: 12 }}>
            Pagando {fmt(pmtOrig)} (parcela) + {fmt(valor)} (extra) = <strong style={{ color: 'var(--text-primary)' }}>{fmt(pmtOrig + valor)}/mes</strong>
          </p>
          <div className="resumo-table">
            <div className="resumo-row"><span>Saldo devedor hoje</span><span style={{ fontWeight: 600 }}>{fmt(saldoAntes)}</span></div>
            <div className="resumo-row" style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 12, marginTop: 4 }}>
              <span>Sem amortizar, quita em</span><span>{mesesSem} meses ({(mesesSem / 12).toFixed(1)} anos) — {dataQuitSem}</span>
            </div>
            <div className="resumo-row">
              <span>Com {fmt(valor)}/mes extra, quita em</span>
              <span className="val-green">{meses} meses ({(meses / 12).toFixed(1)} anos) — {dataQuit}</span>
            </div>
            <div className="resumo-row"><span>Meses que voce economiza</span><span className="val-green">{mesesEcon} meses ({(mesesEcon / 12).toFixed(1)} anos)</span></div>
            <div className="resumo-row"><span>Total extra que vai pagar</span><span>{fmt(totalExtroPago)} em {meses} meses</span></div>
            <div className="resumo-row resumo-total"><span>Economia total em juros</span><span className="val-green total-big">{fmt(jurosEcon)}</span></div>
          </div>
        </GlassCard>
      );

    } else {
      // ── PAGAMENTO UNICO ──
      const novoSaldo = Math.max(0, saldoAntes - valor);

      if (simEstrategia === 'prazo') {
        let novoPrazo = 0;
        if (pmtOrig > novoSaldo * r) novoPrazo = Math.ceil(-Math.log(1 - (novoSaldo * r) / pmtOrig) / Math.log(1 + r));
        const mesesEcon = restAntes - novoPrazo;
        const totalCom = novoPrazo * (pmtOrig + segTaxa) + valor;
        const jurosEcon = Math.max(0, totalSem - totalCom);
        setSimResult(
          <GlassCard delay={0} hover3d={false} className="sim-result-card">
            <div className="section-header"><div className="section-title"><Target size={18} /> Resultado — Pagamento unico de {fmt(valor)}</div></div>
            <p className="hint-text" style={{ marginBottom: 12 }}>Voce paga {fmt(valor)} uma vez agora. A parcela continua igual, mas quita antes.</p>
            <div className="resumo-table">
              <div className="resumo-row"><span>Saldo devedor hoje</span><span style={{ fontWeight: 600 }}>{fmt(saldoAntes)}</span></div>
              <div className="resumo-row"><span>Valor amortizado</span><span className="val-green">{fmt(valor)}</span></div>
              <div className="resumo-row"><span>Novo saldo devedor</span><span style={{ fontWeight: 600 }}>{fmt(novoSaldo)}</span></div>
              <div className="resumo-row" style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 12, marginTop: 4 }}><span>Parcela mensal (mantida)</span><span>{fmt(pmtOrig)}</span></div>
              <div className="resumo-row"><span>Prazo sem amortizar</span><span>{restAntes} meses ({(restAntes / 12).toFixed(1)} anos)</span></div>
              <div className="resumo-row"><span>Novo prazo</span><span className="val-green">{novoPrazo} meses ({(novoPrazo / 12).toFixed(1)} anos)</span></div>
              <div className="resumo-row"><span>Meses economizados</span><span className="val-green">{mesesEcon} meses ({(mesesEcon / 12).toFixed(1)} anos)</span></div>
              <div className="resumo-row resumo-total"><span>Economia em juros</span><span className="val-green total-big">{fmt(jurosEcon)}</span></div>
            </div>
          </GlassCard>
        );
      } else {
        const fn = Math.pow(1 + r, restAntes);
        const novoPmt = novoSaldo * (r * fn) / (fn - 1);
        const reducao = pmtOrig - novoPmt;
        const totalCom = restAntes * (novoPmt + segTaxa) + valor;
        const jurosEcon = Math.max(0, totalSem - totalCom);
        setSimResult(
          <GlassCard delay={0} hover3d={false} className="sim-result-card">
            <div className="section-header"><div className="section-title"><Target size={18} /> Resultado — Pagamento unico de {fmt(valor)}</div></div>
            <p className="hint-text" style={{ marginBottom: 12 }}>Voce paga {fmt(valor)} uma vez agora. O prazo continua, mas a parcela mensal diminui.</p>
            <div className="resumo-table">
              <div className="resumo-row"><span>Saldo devedor hoje</span><span style={{ fontWeight: 600 }}>{fmt(saldoAntes)}</span></div>
              <div className="resumo-row"><span>Valor amortizado</span><span className="val-green">{fmt(valor)}</span></div>
              <div className="resumo-row"><span>Novo saldo devedor</span><span style={{ fontWeight: 600 }}>{fmt(novoSaldo)}</span></div>
              <div className="resumo-row" style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 12, marginTop: 4 }}><span>Parcela atual</span><span>{fmt(pmtOrig)}</span></div>
              <div className="resumo-row"><span>Nova parcela</span><span className="val-green">{fmt(novoPmt)}</span></div>
              <div className="resumo-row"><span>Voce economiza por mes</span><span className="val-green">{fmt(reducao)}</span></div>
              <div className="resumo-row"><span>Prazo (mantido)</span><span>{restAntes} meses</span></div>
              <div className="resumo-row resumo-total"><span>Economia em juros</span><span className="val-green total-big">{fmt(jurosEcon)}</span></div>
            </div>
          </GlassCard>
        );
      }
    }
  }

  return (
    <div>
      {/* Sub-tab bar */}
      <div className="fin-subtab-bar">
        {subTabs.map(tab => (
          <motion.button
            key={tab.id}
            className={`fin-subtab ${subTab === tab.id ? 'active' : ''}`}
            onClick={() => setSubTab(tab.id)}
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.97 }}
          >
            <tab.icon size={14} />
            <span>{tab.label}</span>
          </motion.button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={subTab}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25 }}
        >

          {/* ─── CADASTRO ─── */}
          {subTab === 'cadastro' && (
            <div>
              <GlassCard delay={0.1} hover3d={false}>
                <div className="section-header">
                  <div className="section-title"><Landmark size={18} /> Dados do contrato</div>
                </div>
                <div className="config-grid">
                  <div className="field-3d">
                    <label>Banco</label>
                    <input value={fin.banco} onChange={e => updateFin({ banco: e.target.value })} />
                  </div>
                  <div className="field-3d">
                    <label>Tipo</label>
                    <input value={fin.tipo} onChange={e => updateFin({ tipo: e.target.value })} />
                  </div>
                  <div className="field-3d">
                    <label>Sistema</label>
                    <select value={fin.sistema} onChange={e => updateFin({ sistema: e.target.value as any })}>
                      <option value="PRICE">PRICE</option>
                      <option value="SAC">SAC</option>
                    </select>
                  </div>
                  <div className="field-3d">
                    <label>Valor financiado (R$)</label>
                    <input type="number" value={fin.valorFinanciado || ''} step="0.01" onChange={e => updateFin({ valorFinanciado: parseFloat(e.target.value) || 0 })} />
                  </div>
                  <div className="field-3d">
                    <label>Prazo (meses)</label>
                    <input type="number" value={fin.prazo || ''} min="1" onChange={e => updateFin({ prazo: parseInt(e.target.value) || 0 })} />
                  </div>
                  <div className="field-3d">
                    <label>1a parcela (mes/ano)</label>
                    <input type="month" value={fin.inicio} onChange={e => updateFin({ inicio: e.target.value })} />
                  </div>
                  <div className="field-3d">
                    <label>Juros nominal (% a.a.)</label>
                    <input type="number" value={fin.jurosAnual || ''} step="0.01" onChange={e => updateFin({ jurosAnual: parseFloat(e.target.value) || 0 })} />
                  </div>
                  <div className="field-3d">
                    <label>Juros mensal (% a.m.)</label>
                    <input type="number" value={fin.jurosMensal || ''} step="0.0001" onChange={e => updateFin({ jurosMensal: parseFloat(e.target.value) || 0 })} />
                  </div>
                  <div className="field-3d">
                    <label>Parcela inicial (R$)</label>
                    <input type="number" value={fin.parcelaInicial || ''} step="0.01" onChange={e => updateFin({ parcelaInicial: parseFloat(e.target.value) || 0 })} />
                  </div>
                  <div className="field-3d">
                    <label>Seguro inicial (R$)</label>
                    <input type="number" value={fin.seguroInicial || ''} step="0.01" onChange={e => updateFin({ seguroInicial: parseFloat(e.target.value) || 0 })} />
                  </div>
                  <div className="field-3d">
                    <label>Taxa administrativa (R$)</label>
                    <input type="number" value={fin.taxaAdmin || ''} step="0.01" onChange={e => updateFin({ taxaAdmin: parseFloat(e.target.value) || 0 })} />
                  </div>
                  <div className="field-3d">
                    <label>Indice de correcao</label>
                    <select value={fin.indiceCorrecao} onChange={e => updateFin({ indiceCorrecao: e.target.value as any })}>
                      <option value="TR">TR</option>
                      <option value="IPCA">IPCA</option>
                      <option value="Nenhum">Nenhum</option>
                    </select>
                  </div>
                </div>
              </GlassCard>

              <GlassCard delay={0.2} hover3d={false} style={{ marginTop: 16 }}>
                <div className="section-header">
                  <div className="section-title"><Info size={18} /> Regras do financiamento PRICE</div>
                </div>
                <div className="fin-rules">
                  <p>A parcela PRICE amortiza desde a 1a parcela — no inicio paga-se mais juros e menos amortizacao.</p>
                  <p>Com o tempo, a amortizacao cresce e os juros diminuem dentro da mesma parcela.</p>
                  <p>O saldo devedor pode ser atualizado pela TR (Taxa Referencial).</p>
                  <p>Seguro (MIP/DFI) e taxa administrativa <strong>nao reduzem</strong> a divida.</p>
                  <p>FGTS pode ser usado para amortizar conforme regras da Caixa (a cada 2 anos).</p>
                  <p>Atraso pode gerar multa de 2%, juros de mora e risco de execucao do contrato.</p>
                  <p>Em alienacao fiduciaria, atraso grave pode levar o imovel a leilao.</p>
                </div>
              </GlassCard>
            </div>
          )}

          {/* ─── RESUMO ─── */}
          {subTab === 'resumo' && (
            <div>
              <div className="fin-summary-grid">
                {[
                  { label: 'Saldo devedor atual', value: fmt(saldoAtual), color: '#ef4444', icon: TrendingDown },
                  { label: 'Total ja pago', value: fmt(totalPago), color: '#10b981', icon: DollarSign },
                  { label: 'Total em juros', value: fmt(totalJuros), color: '#ef4444', icon: TrendingDown },
                  { label: 'Total amortizado', value: fmt(totalAmort), color: '#6366f1', icon: Target },
                  { label: 'Seguro + Taxas', value: fmt(totalSeg), color: '#f59e0b', icon: Shield },
                  { label: 'Parcelas pagas', value: `${pagas.length} / ${schedule.length}`, color: '#10b981', icon: Clock },
                  { label: 'Parcelas restantes', value: `${restantes}`, color: '#f59e0b', icon: Clock },
                  { label: 'Previsao quitacao', value: prevQuit, color: '#6366f1', icon: Home },
                ].map((card, i) => (
                  <GlassCard key={card.label} delay={0.05 * i} className="summary-card">
                    <div className="summary-icon-wrap" style={{ background: `${card.color}18` }}>
                      <card.icon size={22} color={card.color} />
                    </div>
                    <div className="summary-label">{card.label}</div>
                    <div className="summary-value" style={{ color: card.color }}>{card.value}</div>
                  </GlassCard>
                ))}
              </div>

              <GlassCard delay={0.3} hover3d={false} style={{ maxWidth: 560 }}>
                <div className="section-header">
                  <div className="section-title"><BarChart3 size={18} /> Progresso do financiamento</div>
                </div>
                <div className="health-section" style={{ marginTop: 0 }}>
                  <div className="health-header">
                    <span>Amortizado</span>
                    <motion.span key={pctPago} initial={{ scale: 1.3 }} animate={{ scale: 1 }} style={{ fontWeight: 600, color: '#6366f1' }}>
                      {pctPago}%
                    </motion.span>
                  </div>
                  <div className="health-bar-bg">
                    <motion.div
                      className="health-bar-fill"
                      initial={{ width: 0 }}
                      animate={{ width: `${pctPago}%` }}
                      transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                      style={{ background: 'linear-gradient(90deg, #6366f1, #8b5cf6)' }}
                    />
                  </div>
                </div>

                <div className="resumo-table" style={{ marginTop: 20 }}>
                  <div className="resumo-row"><span>Valor financiado</span><span style={{ fontWeight: 600 }}>{fmt(fin.valorFinanciado)}</span></div>
                  <div className="resumo-row"><span>Total que pagara (projecao)</span><span className="val-red">{fmt(totalProj)}</span></div>
                  <div className="resumo-row"><span>Custo total dos juros</span><span className="val-red">{fmt(totalJurosProj)}</span></div>
                  <div className="resumo-row"><span>Custo total seguro + taxas</span><span className="val-amber">{fmt(totalSegProj)}</span></div>
                </div>
              </GlassCard>
            </div>
          )}

          {/* ─── HISTORICO ─── */}
          {subTab === 'historico' && (
            <GlassCard delay={0.1} hover3d={false}>
              <div className="section-header">
                <div className="section-title"><Table size={18} /> Historico de parcelas</div>
              </div>
              <div className="fin-hist-nav">
                <motion.button className="btn-nav" onClick={() => setHistPage(p => Math.max(0, p - 1))} whileTap={{ scale: 0.9 }}>
                  <ChevronLeft size={16} />
                </motion.button>
                <span className="fin-hist-label">
                  Parcelas {safePage * perPage + 1}–{Math.min((safePage + 1) * perPage, schedule.length)} de {schedule.length}
                </span>
                <motion.button className="btn-nav" onClick={() => setHistPage(p => Math.min(totalPages - 1, p + 1))} whileTap={{ scale: 0.9 }}>
                  <ChevronRight size={16} />
                </motion.button>
                <select
                  className="fin-hist-select"
                  value={safePage}
                  onChange={e => setHistPage(parseInt(e.target.value))}
                >
                  {Array.from({ length: totalPages }, (_, i) => (
                    <option key={i} value={i}>Ano {i + 1} ({i * perPage + 1}–{Math.min((i + 1) * perPage, schedule.length)})</option>
                  ))}
                </select>
              </div>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>N</th><th>Vencimento</th><th>Total</th><th>Juros</th><th>Amortiz.</th>
                      <th>Seguro</th><th>Taxa</th><th>Saldo apos</th><th>Status</th><th>Pago?</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pageItems.map(p => {
                      const [y, m, d] = p.dataVenc.split('-');
                      const statusCls = p.status === 'paga' ? 'val-green' : p.status === 'atrasada' ? 'val-red' : '';
                      const statusLabel = p.status === 'paga' ? 'Paga' : p.status === 'atrasada' ? 'Atrasada' : 'Aberta';
                      return (
                        <tr key={p.num} className={p.status === 'paga' ? 'row-paid' : ''}>
                          <td>{p.num}</td>
                          <td>{d}/{m}/{y}</td>
                          <td>{fmt(p.total)}</td>
                          <td>{fmt(p.juros)}</td>
                          <td>{fmt(p.amort)}</td>
                          <td>{fmt(p.seguro)}</td>
                          <td>{fmt(p.taxa)}</td>
                          <td>{fmt(p.saldoApos)}</td>
                          <td><span className={statusCls} style={{ fontWeight: 500, fontSize: 11, textTransform: 'uppercase' }}>{statusLabel}</span></td>
                          <td>
                            <label className="checkbox-3d">
                              <input type="checkbox" checked={p.status === 'paga'} onChange={e => toggleFinPaga(p.num, e.target.checked)} />
                              <span className="checkmark" />
                            </label>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {schedule.length === 0 && (
                <div className="empty-state"><Table size={32} /><p>Preencha os dados do contrato na aba Cadastro.</p></div>
              )}
            </GlassCard>
          )}

          {/* ─── SIMULADOR ─── */}
          {subTab === 'simulador' && (
            <div>
              <GlassCard delay={0.1} hover3d={false}>
                <div className="section-header">
                  <div className="section-title"><Calculator size={18} /> Simulador de amortizacao extra</div>
                </div>

                {/* Situacao atual do usuario */}
                <div className="sim-status">
                  <div className="sim-status-item">
                    <Clock size={16} color="#6366f1" />
                    <span>Voce esta na parcela <strong>{parcelaAtual}</strong> de {fin.prazo} ({fin.prazo - parcelaAtual} restantes)</span>
                  </div>
                  <div className="sim-status-item">
                    <DollarSign size={16} color="#ef4444" />
                    <span>Saldo devedor estimado: <strong>{fmt(saldoHoje)}</strong></span>
                  </div>
                  <div className="sim-status-item">
                    <Target size={16} color="#f59e0b" />
                    <span>Parcela mensal: <strong>{fmt(pmtCalculado)}</strong> + seguro/taxa</span>
                  </div>
                </div>

                <div className="sim-divider" />

                <p className="hint-text" style={{ marginBottom: 4 }}>
                  Alem da parcela normal do mes, quanto voce quer pagar a mais para amortizar?
                </p>
                <p className="hint-text" style={{ marginBottom: 16, fontSize: 11 }}>
                  Ex: voce paga a parcela de {fmt(pmtCalculado)} normalmente + o valor extra abaixo direto no saldo devedor.
                </p>

                <div className="config-grid" style={{ marginBottom: 16 }}>
                  <div className="field-3d">
                    <label>Valor extra (R$)</label>
                    <input type="number" value={simValor} step="0.01" placeholder="1000" onChange={e => setSimValor(e.target.value)} />
                  </div>
                  <div className="field-3d">
                    <label>Frequencia</label>
                    <select value={simFreq} onChange={e => setSimFreq(e.target.value as any)}>
                      <option value="mensal">Todo mes</option>
                      <option value="unico">Pagamento unico</option>
                    </select>
                  </div>
                  {simFreq === 'unico' && (
                    <div className="field-3d">
                      <label>O que voce quer?</label>
                      <select value={simEstrategia} onChange={e => setSimEstrategia(e.target.value as any)}>
                        <option value="prazo">Quitar antes (manter parcela)</option>
                        <option value="parcela">Pagar menos por mes (manter prazo)</option>
                      </select>
                    </div>
                  )}
                  <div className="field-3d">
                    <label>Origem do dinheiro</label>
                    <select value={simOrigem} onChange={e => setSimOrigem(e.target.value as any)}>
                      <option value="proprio">Dinheiro proprio</option>
                      <option value="fgts">FGTS</option>
                    </select>
                  </div>
                </div>
                <motion.button className="btn-add-3d" onClick={simular} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
                  <Calculator size={16} /> Ver resultado
                </motion.button>
                {simResult && <div style={{ marginTop: 16 }}>{simResult}</div>}
              </GlassCard>

              <GlassCard delay={0.2} hover3d={false} style={{ marginTop: 16 }}>
                <div className="section-header">
                  <div className="section-title">
                    <PiggyBank size={18} /> Amortizacoes registradas
                    <span className="badge-3d">{finAmorts.length}</span>
                  </div>
                  <motion.button className="btn-add-3d" onClick={addAmort} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}>
                    <Plus size={16} /> Registrar
                  </motion.button>
                </div>
                <p className="hint-text">Amortizacoes registradas afetam o calculo do historico e do resumo.</p>
                {finAmorts.length > 0 ? (
                  <div className="table-wrap">
                    <table>
                      <thead>
                        <tr><th>Data</th><th>Valor (R$)</th><th>Origem</th><th>Estrategia</th><th>Apos parcela</th><th></th></tr>
                      </thead>
                      <tbody>
                        {finAmorts.map(a => (
                          <tr key={a.id}>
                            <td><input value={a.data} placeholder="01/2025" onChange={e => updateAmort(a.id, 'data', e.target.value)} /></td>
                            <td><input type="number" value={a.valor || ''} placeholder="10000" min="0" step="0.01" onChange={e => updateAmort(a.id, 'valor', parseFloat(e.target.value) || 0)} /></td>
                            <td>
                              <select value={a.origem} onChange={e => updateAmort(a.id, 'origem', e.target.value)}>
                                <option value="proprio">Proprio</option>
                                <option value="fgts">FGTS</option>
                              </select>
                            </td>
                            <td>
                              <select value={a.estrategia} onChange={e => updateAmort(a.id, 'estrategia', e.target.value)}>
                                <option value="prazo">Reduzir prazo</option>
                                <option value="parcela">Reduzir parcela</option>
                              </select>
                            </td>
                            <td><input type="number" value={a.aposParcela || ''} placeholder="N" min="1" step="1" onChange={e => updateAmort(a.id, 'aposParcela', parseInt(e.target.value) || 0)} /></td>
                            <td>
                              <motion.button className="btn-del-3d" onClick={() => removeAmort(a.id)} whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                                <Trash2 size={14} />
                              </motion.button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="empty-state"><PiggyBank size={32} /><p>Nenhuma amortizacao extra registrada.</p></div>
                )}
              </GlassCard>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
