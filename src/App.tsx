import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DollarSign, Cloud, CloudOff, Loader2 } from 'lucide-react';
import { useFinanceData } from './hooks/useFinanceData';
import { SummaryCards } from './components/SummaryCards';
import { ConfigSection } from './components/ConfigSection';
import { TabBar, TabId } from './components/TabBar';
import { ContasFixas } from './components/ContasFixas';
import { Parceladas } from './components/Parceladas';
import { Recebiveis } from './components/Recebiveis';
import { Investimento } from './components/Investimento';
import { Relatorio } from './components/Relatorio';
import { Financiamento } from './components/Financiamento';
import './App.css';

const MONTH_NAMES = [
  'Janeiro','Fevereiro','Marco','Abril','Maio','Junho',
  'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'
];

function getMesLabel(mes: string): string {
  if (!mes) return '';
  const [y, mo] = mes.split('-');
  return (MONTH_NAMES[parseInt(mo) - 1] || mo) + ' ' + y;
}

function App() {
  const {
    state, mes, cloudStatus, updateConfig,
    addFixa, removeFixa, updateFixa, toggleFixaPago,
    addParc, removeParc, updateParc, toggleParcPago,
    addRec, removeRec, updateRec, toggleRecRecebido,
    updateFin, toggleFinPaga, addAmort, removeAmort, updateAmort,
    computed,
  } = useFinanceData();

  const [activeTab, setActiveTab] = useState<TabId>('fixas');

  const mesLabel = getMesLabel(mes);

  return (
    <div>
      <div className="app-bg">
        <div className="orb orb-1" />
        <div className="orb orb-2" />
        <div className="orb orb-3" />
        <div className="grid-pattern" />
      </div>

      <motion.header
        className="app-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <motion.div
          className="header-icon"
          whileHover={{ rotateY: 15, scale: 1.1 }}
          transition={{ type: 'spring', stiffness: 300 }}
        >
          <DollarSign size={24} color="white" />
        </motion.div>
        <div style={{ flex: 1 }}>
          <div className="header-title">Controle Financeiro</div>
          <div className="header-sub">{mesLabel}</div>
        </div>
        <div className="cloud-status" title={
          cloudStatus === 'synced' ? 'Sincronizado com a nuvem' :
          cloudStatus === 'loading' ? 'Sincronizando...' :
          cloudStatus === 'error' ? 'Erro ao sincronizar' : 'Modo offline'
        }>
          {cloudStatus === 'synced' && <Cloud size={16} className="cloud-ok" />}
          {cloudStatus === 'loading' && <Loader2 size={16} className="cloud-loading" />}
          {(cloudStatus === 'error' || cloudStatus === 'offline') && <CloudOff size={16} className="cloud-off" />}
          <span className="cloud-label">
            {cloudStatus === 'synced' ? 'Salvo' : cloudStatus === 'loading' ? 'Salvando...' : 'Offline'}
          </span>
        </div>
      </motion.header>

      <main className="app-content">
        <SummaryCards
          entrada={computed.entrada}
          totGast={computed.totGast}
          invest={computed.invest}
          passar={computed.passar}
          poupancaTotal={computed.poupancaTotal}
          totRec={computed.totRec}
        />

        <ConfigSection state={state} updateConfig={updateConfig} />

        <TabBar activeTab={activeTab} setActiveTab={setActiveTab} />

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            {activeTab === 'fixas' && (
              <ContasFixas
                fixas={state.fixas}
                mes={mes}
                addFixa={addFixa}
                removeFixa={removeFixa}
                updateFixa={updateFixa}
                toggleFixaPago={toggleFixaPago}
              />
            )}
            {activeTab === 'parc' && (
              <Parceladas
                parcs={state.parcs}
                mes={mes}
                addParc={addParc}
                removeParc={removeParc}
                updateParc={updateParc}
                toggleParcPago={toggleParcPago}
              />
            )}
            {activeTab === 'rec' && (
              <Recebiveis
                recs={state.recs}
                mes={mes}
                addRec={addRec}
                removeRec={removeRec}
                updateRec={updateRec}
                toggleRecRecebido={toggleRecRecebido}
              />
            )}
            {activeTab === 'inv' && (
              <Investimento
                entrada={computed.entrada}
                invest={computed.invest}
                totFix={computed.totFix}
                totParc={computed.totParc}
                poupanca={state.poupanca}
                poupancaTotal={computed.poupancaTotal}
                passar={computed.passar}
                saudePct={computed.saudePct}
              />
            )}
            {activeTab === 'fin' && (
              <Financiamento
                fin={state.fin}
                finPagas={state.finPagas}
                finAmorts={state.finAmorts}
                updateFin={updateFin}
                toggleFinPaga={toggleFinPaga}
                addAmort={addAmort}
                removeAmort={removeAmort}
                updateAmort={updateAmort}
              />
            )}
            {activeTab === 'rel' && (
              <Relatorio state={state} mesAtual={mes} />
            )}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}

export default App;
