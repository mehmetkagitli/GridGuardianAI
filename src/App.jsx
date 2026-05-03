// GridGuardian AI - Ana Uygulama Bileşeni
import { useState, useEffect, useCallback } from 'react';
import {
  initSimState, tickSimState, applyScenarioToState, addVehicleToState,
  TRAFO_CAPACITY, BESS_CRITICAL,
} from './data';
import NeighborhoodCard from './NeighborhoodCard';
import AnalyticsPage from './AnalyticsPage';
import SystemLog from './SystemLog';

const SCENARIO_BUTTONS = [
  { key: 'normal', label: 'Normal Senaryo', icon: '🟢', desc: '0 araç, %100 BESS, ev %40',
    activeClass: 'bg-green-500 border-green-500 text-white shadow-lg shadow-green-200' },
  { key: 'peak', label: 'Pik Yük Senaryosu', icon: '🟡', desc: 'Ev yükleri %85\'e fırlar',
    activeClass: 'bg-amber-500 border-amber-500 text-white shadow-lg shadow-amber-200' },
  { key: 'critical', label: 'Kritik Yönlendirme', icon: '🔴', desc: 'B: BESS %15, ev %90',
    activeClass: 'bg-red-500 border-red-500 text-white shadow-lg shadow-red-200' },
];

export default function App() {
  const [activeTab, setActiveTab] = useState('sim');
  const [scenario, setScenario] = useState('normal');
  const [states, setStates] = useState(() => initSimState());
  const [logs, setLogs] = useState([]);
  const [notifications, setNotifications] = useState([]);

  // ===== Senaryo Uygulama =====
  const handleScenario = useCallback((key) => {
    setScenario(key);
    setStates((prev) => applyScenarioToState(prev, key));
    setLogs([]);
    setNotifications([]);
  }, []);

  // ===== Araç Ekleme =====
  const handleAddVehicle = useCallback((neighborhoodId) => {
    setStates((prev) => {
      const { states: next, logs: newLogs } = addVehicleToState(prev, neighborhoodId);
      if (newLogs.length > 0) {
        setLogs((old) => [...newLogs, ...old].slice(0, 100));
        newLogs.filter((l) => l.type === 'redirect').forEach((l) => {
          setNotifications((old) => [
            { id: Date.now() + Math.random(), msg: l.msg, from: l.from, to: l.to },
            ...old,
          ].slice(0, 3));
        });
      }
      return next;
    });
  }, []);

  // ===== Simülasyon Tick (2s) =====
  useEffect(() => {
    const timer = setInterval(() => {
      setStates((prev) => {
        const { states: next, logs: newLogs } = tickSimState(prev);
        if (newLogs.length > 0) {
          setLogs((old) => [...newLogs, ...old].slice(0, 100));
        }
        return next;
      });
    }, 2000);
    return () => clearInterval(timer);
  }, []);

  // ===== Bildirim Otomatik Kaldırma (3s) =====
  useEffect(() => {
    if (notifications.length === 0) return;
    const t = setTimeout(() => setNotifications((n) => n.slice(0, -1)), 3000);
    return () => clearTimeout(t);
  }, [notifications]);

  // ===== KPI =====
  const totalLoad = states.reduce((s, n) => s + n.homeLoad + n.rawStationLoad + (n.gridBoost || 0), 0);
  const avgBess = Math.round(states.reduce((s, n) => s + n.bess, 0) / states.length);
  const redirectCount = logs.filter((l) => l.type === 'redirect').length;
  const totalVehicles = states.reduce((s, n) => s + n.vehicleCount, 0);

  const getSystemMode = () => {
    if (states.some((n) => n.mode === 'critical')) return { text: 'Kritik Mod', color: '#dc2626', bg: 'bg-red-50' };
    if (states.some((n) => n.mode === 'hybrid')) {
      // Peak senaryoda gridBoost varsa "Şebeke Yoğunluğu" göster
      const hasGridBoost = states.some((n) => (n.gridBoost || 0) > 0);
      return { text: hasGridBoost ? 'Şebeke Yoğunluğu: Yüksek' : 'Hibrit Mod', color: '#ca8a04', bg: 'bg-amber-50' };
    }
    return { text: 'Normal Mod', color: '#16a34a', bg: 'bg-green-50' };
  };
  const systemMode = getSystemMode();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* HEADER */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-green-500 flex items-center justify-center text-white text-lg font-bold shadow-md">⚡</div>
            <div>
              <h1 className="text-lg font-bold text-gray-800">GridGuardian AI</h1>
              <p className="text-xs text-gray-400">Akıllı EV Şarj & Trafo Yük Yönetimi</p>
            </div>
          </div>
          <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
            <button onClick={() => setActiveTab('sim')} className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'sim' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Simülasyon</button>
            <button onClick={() => setActiveTab('analytics')} className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'analytics' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Veri Analitiği</button>
          </div>
          <div className="flex items-center gap-3">
            <span className="inline-block w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs text-gray-500 hidden md:inline">Canlı Simülasyon</span>
            <span className={`text-xs font-semibold px-3 py-1 rounded-full ${systemMode.bg}`} style={{ color: systemMode.color }}>{systemMode.text}</span>
          </div>
        </div>
      </header>

      {/* YÖNLENDİRME BİLDİRİMLERİ - Ekranın ortasında parlar */}
      <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 space-y-2 w-full max-w-lg px-4">
        {notifications.map((n) => (
          <div key={n.id} className="bg-white border-2 border-red-400 rounded-2xl p-5 shadow-2xl animate-slide-in">
            <div className="text-center">
              <p className="text-lg font-bold text-red-600 animate-pulse">{n.msg}</p>
              {n.from && n.to && (
                <p className="text-sm text-gray-500 mt-1">Dinamik yönlendirme tamamlandı</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* ANA İÇERİK */}
      <main className="max-w-7xl mx-auto px-6 py-6">
        {activeTab === 'sim' ? (
          <div className="space-y-6 animate-fade-in-up">
            {/* KPI */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <KpiCard label="Toplam Talep" value={`${totalLoad} kW`} subtext={`Kapasite: ${TRAFO_CAPACITY * 3} kW`} color="#2563eb" bgColor="#eff6ff" />
              <KpiCard label="Ortalama BESS" value={`%${avgBess}`} subtext={avgBess < BESS_CRITICAL ? 'Kritik seviye!' : 'Sağlıklı'} color={avgBess < 20 ? '#dc2626' : avgBess < 50 ? '#ca8a04' : '#16a34a'} bgColor={avgBess < 20 ? '#fef2f2' : avgBess < 50 ? '#fffbeb' : '#f0fdf4'} />
              <KpiCard label="Toplam Araç" value={totalVehicles} subtext="Şarj oluyor" color="#7c3aed" bgColor="#f5f3ff" />
              <KpiCard label="Yönlendirme" value={redirectCount} subtext="Engellenen aşırı yük" color="#ea580c" bgColor="#fff7ed" />
            </div>

            {/* Senaryo Butonları */}
            <div className="flex flex-wrap gap-3 justify-center">
              {SCENARIO_BUTTONS.map((s) => (
                <button key={s.key} onClick={() => handleScenario(s.key)}
                  className={`px-6 py-3 rounded-xl text-sm font-semibold transition-all border-2 ${scenario === s.key ? s.activeClass : 'bg-white border-gray-200 text-gray-600 hover:border-gray-400 hover:shadow-md'}`}
                  title={s.desc}
                >
                  <span className="mr-1.5">{s.icon}</span>{s.label}
                </button>
              ))}
            </div>

            {/* Mahalle Kartları */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              {states.map((n) => (
                <NeighborhoodCard key={n.id} n={n} onAddVehicle={handleAddVehicle} />
              ))}
            </div>

            <SystemLog logs={logs} />
          </div>
        ) : (
          <AnalyticsPage states={states} logs={logs} />
        )}
      </main>

      <footer className="text-center py-4 text-xs text-gray-400 border-t border-gray-100">
        GridGuardian AI • Akıllı Enerji Yönetim Sistemi • Simülasyon Demo
      </footer>
    </div>
  );
}

function KpiCard({ label, value, subtext, color, bgColor }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 transition-all hover:shadow-md">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 mb-1">{label}</p>
          <p className="text-3xl font-bold" style={{ color }}>{value}</p>
          <p className="text-xs mt-1" style={{ color: `${color}88` }}>{subtext}</p>
        </div>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: bgColor }}>
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
        </div>
      </div>
    </div>
  );
}
