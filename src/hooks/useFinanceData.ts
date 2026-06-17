import { useState, useCallback, useEffect, useRef } from 'react';
import { AppState, ContaFixa, Parcelada, Recebivel } from '../types';
import { loadFromCloud, saveToCloud } from '../lib/supabase';

const STORAGE_KEY = 'fcv3';

function currentMonth(): string {
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
}

const defaultState: AppState = {
  mes: '',
  salario: 0,
  beneficio: 0,
  comissao: 0,
  poupanca: 0,
  pctInvest: 30,
  fixas: [],
  parcs: [],
  recs: [],
};

function migrateState(raw: any): AppState {
  const s = { ...defaultState, ...raw };
  const mes = s.mes || currentMonth();

  s.fixas = (s.fixas || []).map((f: any) => {
    if (!f.pagoMes) {
      f.pagoMes = {};
      if (f.pago) f.pagoMes[mes] = true;
    }
    delete f.pago;
    return f;
  });

  s.parcs = (s.parcs || []).map((p: any) => {
    if (!p.pagoMes) {
      p.pagoMes = {};
      if (p.pago) p.pagoMes[mes] = true;
    }
    delete p.pago;
    return p;
  });

  s.recs = (s.recs || []).map((r: any) => {
    if (!r.recebidoMes) {
      r.recebidoMes = {};
      if (r.recebido) r.recebidoMes[mes] = true;
    }
    delete r.recebido;
    return r;
  });

  return s as AppState;
}

function loadLocal(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return migrateState(JSON.parse(raw));
  } catch {}
  return { ...defaultState };
}

export function meuValParc(c: Parcelada): number {
  return c.valorTotal / (c.divisor || 1);
}

export function fmt(v: number): string {
  return 'R$ ' + Number(v || 0).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function isPago(item: ContaFixa | Parcelada, mes: string): boolean {
  return !!item.pagoMes[mes];
}

export function isRecebido(item: Recebivel, mes: string): boolean {
  return !!item.recebidoMes[mes];
}

export function getAllMonths(state: AppState): string[] {
  const months = new Set<string>();
  if (state.mes) months.add(state.mes);
  state.fixas.forEach(f => Object.keys(f.pagoMes).forEach(m => months.add(m)));
  state.parcs.forEach(p => Object.keys(p.pagoMes).forEach(m => months.add(m)));
  state.recs.forEach(r => Object.keys(r.recebidoMes).forEach(m => months.add(m)));
  return Array.from(months).sort().reverse();
}

export interface MonthReport {
  mes: string;
  fixasPagas: { nome: string; valor: number }[];
  parcsPagas: { nome: string; valor: number }[];
  recsRecebidos: { cliente: string; valor: number }[];
  totalFixas: number;
  totalParcs: number;
  totalRecs: number;
  totalPago: number;
}

export function getMonthReport(state: AppState, mes: string): MonthReport {
  const fixasPagas = state.fixas
    .filter(f => f.pagoMes[mes])
    .map(f => ({ nome: f.nome || 'Sem nome', valor: f.valor }));

  const parcsPagas = state.parcs
    .filter(p => p.pagoMes[mes])
    .map(p => ({ nome: p.nome || 'Sem nome', valor: meuValParc(p) }));

  const recsRecebidos = state.recs
    .filter(r => r.recebidoMes[mes])
    .map(r => ({ cliente: r.cliente || 'Sem nome', valor: r.p1 + r.p2 }));

  const totalFixas = fixasPagas.reduce((s, i) => s + i.valor, 0);
  const totalParcs = parcsPagas.reduce((s, i) => s + i.valor, 0);
  const totalRecs = recsRecebidos.reduce((s, i) => s + i.valor, 0);

  return {
    mes,
    fixasPagas,
    parcsPagas,
    recsRecebidos,
    totalFixas,
    totalParcs,
    totalRecs,
    totalPago: totalFixas + totalParcs,
  };
}

export function useFinanceData() {
  const [state, setState] = useState<AppState>(loadLocal);
  const [cloudStatus, setCloudStatus] = useState<'loading' | 'synced' | 'error' | 'offline'>('loading');
  const saveTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const isInitialLoad = useRef(true);

  const mes = state.mes || currentMonth();

  // Load from cloud on mount — cloud wins if it has data
  useEffect(() => {
    loadFromCloud().then(cloudData => {
      if (cloudData) {
        const migrated = migrateState(cloudData);
        setState(migrated);
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated)); } catch {}
        setCloudStatus('synced');
      } else {
        // No cloud data yet — push local to cloud
        const local = loadLocal();
        saveToCloud(local).then(() => setCloudStatus('synced')).catch(() => setCloudStatus('offline'));
      }
      isInitialLoad.current = false;
    }).catch(() => {
      setCloudStatus('offline');
      isInitialLoad.current = false;
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Save to localStorage + debounced cloud save on every state change
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch {}

    if (isInitialLoad.current) return;

    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      saveToCloud(state)
        .then(() => setCloudStatus('synced'))
        .catch(() => setCloudStatus('error'));
    }, 1500);

    return () => { if (saveTimer.current) clearTimeout(saveTimer.current); };
  }, [state]);

  const updateConfig = useCallback((partial: Partial<AppState>) => {
    setState(prev => ({ ...prev, ...partial }));
  }, []);

  const addFixa = useCallback(() => {
    setState(prev => ({
      ...prev,
      fixas: [...prev.fixas, { id: Date.now(), nome: '', valor: 0, tipo: 'fixa', venc: '', pagoMes: {} }],
    }));
  }, []);

  const removeFixa = useCallback((id: number) => {
    setState(prev => ({ ...prev, fixas: prev.fixas.filter(c => c.id !== id) }));
  }, []);

  const updateFixa = useCallback((id: number, field: string, value: any) => {
    setState(prev => ({
      ...prev,
      fixas: prev.fixas.map(c => c.id === id ? { ...c, [field]: value } : c),
    }));
  }, []);

  const toggleFixaPago = useCallback((id: number, checked: boolean) => {
    setState(prev => {
      const m = prev.mes || currentMonth();
      return {
        ...prev,
        fixas: prev.fixas.map(c =>
          c.id === id ? { ...c, pagoMes: { ...c.pagoMes, [m]: checked } } : c
        ),
      };
    });
  }, []);

  const addParc = useCallback(() => {
    setState(prev => ({
      ...prev,
      parcs: [...prev.parcs, { id: Date.now(), nome: '', tipo: 'dividida', valorTotal: 0, divisor: 2, parcelaAtual: 1, parcelasPagas: 0, pagoMes: {} }],
    }));
  }, []);

  const removeParc = useCallback((id: number) => {
    setState(prev => ({ ...prev, parcs: prev.parcs.filter(c => c.id !== id) }));
  }, []);

  const updateParc = useCallback((id: number, field: string, value: any) => {
    setState(prev => ({
      ...prev,
      parcs: prev.parcs.map(c => c.id === id ? { ...c, [field]: value } : c),
    }));
  }, []);

  const toggleParcPago = useCallback((id: number, checked: boolean) => {
    setState(prev => {
      const m = prev.mes || currentMonth();
      return {
        ...prev,
        parcs: prev.parcs.map(c =>
          c.id === id ? { ...c, pagoMes: { ...c.pagoMes, [m]: checked } } : c
        ),
      };
    });
  }, []);

  const addRec = useCallback(() => {
    setState(prev => ({
      ...prev,
      recs: [...prev.recs, { id: Date.now(), cliente: '', aPagar: 0, p1: 0, p2: 0, recebidoMes: {} }],
    }));
  }, []);

  const removeRec = useCallback((id: number) => {
    setState(prev => ({ ...prev, recs: prev.recs.filter(c => c.id !== id) }));
  }, []);

  const updateRec = useCallback((id: number, field: string, value: any) => {
    setState(prev => ({
      ...prev,
      recs: prev.recs.map(c => c.id === id ? { ...c, [field]: value } : c),
    }));
  }, []);

  const toggleRecRecebido = useCallback((id: number, checked: boolean) => {
    setState(prev => {
      const m = prev.mes || currentMonth();
      return {
        ...prev,
        recs: prev.recs.map(c =>
          c.id === id ? { ...c, recebidoMes: { ...c.recebidoMes, [m]: checked } } : c
        ),
      };
    });
  }, []);

  const entrada = state.salario + state.beneficio + state.comissao;
  const invest = entrada * (state.pctInvest / 100);
  const totFix = state.fixas.reduce((s, c) => s + c.valor, 0);
  const totParc = state.parcs.reduce((s, c) => s + meuValParc(c), 0);
  const totGast = totFix + totParc;
  const passar = entrada - totGast - invest - state.poupanca;
  const totRec = state.recs.reduce((s, c) => s + c.p1 + c.p2, 0);
  const saudePct = entrada > 0 ? Math.min(100, Math.round(Math.max(0, passar / entrada) * 100)) : 0;

  return {
    state,
    mes,
    cloudStatus,
    updateConfig,
    addFixa, removeFixa, updateFixa, toggleFixaPago,
    addParc, removeParc, updateParc, toggleParcPago,
    addRec, removeRec, updateRec, toggleRecRecebido,
    computed: { entrada, invest, totFix, totParc, totGast, passar, totRec, saudePct },
  };
}
