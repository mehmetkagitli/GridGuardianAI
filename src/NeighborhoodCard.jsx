// GridGuardian AI - Mahalle Kartı Bileşeni
import { MODE_CONFIG, TRAFO_CAPACITY, getBessStatus, EV_STATION_LOAD } from './data';
import EnergyFlow from './EnergyFlow';
import PhysicsScene from './PhysicsScene';

export default function NeighborhoodCard({ n, onAddVehicle }) {
  const effectiveMode = n.redirect ? 'redirect' : n.mode;
  const config = MODE_CONFIG[effectiveMode];
  const totalDemand = n.homeLoad + n.rawStationLoad + (n.gridBoost || 0);
  const loadPct = Math.min(100, Math.round((totalDemand / TRAFO_CAPACITY) * 100));
  const bessStatus = getBessStatus(n.bess, n.vehicleCount, n.mode);
  const homeLoadPct = Math.min(100, Math.round((n.homeLoad / n.peakHomekW) * 100));
  const isSolarCharging = n.solarCharging === true;
  const stationsFull = n.vehicleCount >= n.stations;

  return (
    <div className={`rounded-2xl border-2 bg-white shadow-sm overflow-hidden transition-all duration-500 ${config.borderClass}`}>
      {/* 1. TRAFO ALANI */}
      <div className="p-5 pb-3">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-800">{n.name}</h3>
          <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${config.badgeClass}`}>
            {config.label}
          </span>
        </div>

        <div className="flex flex-col items-center mb-3">
          <div className="relative">
            <img src="/trafo.png" alt="Trafo" className="w-24 h-24 object-contain img-glow"
              style={{ filter: `drop-shadow(0 4px 12px ${config.textColor}22)` }} />
            <div className="absolute -bottom-1 -right-1 text-xs font-bold px-2 py-0.5 rounded-full text-white"
              style={{ backgroundColor: config.textColor }}>
              %{loadPct}
            </div>
          </div>
          <div className="text-center mt-2">
            <p className="text-sm text-gray-500">Trafo Yükü</p>
            <p className="text-2xl font-bold" style={{ color: config.textColor }}>%{loadPct}</p>
            <p className="text-xs text-gray-400 mt-0.5">{totalDemand} / {TRAFO_CAPACITY} kW</p>
          </div>
        </div>

        {/* Trafo yük çubuğu */}
        <div className="mb-1">
          <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-700"
              style={{ width: `${loadPct}%`, background: config.barGradient }} />
          </div>
          <div className="flex justify-between text-[10px] mt-1 text-gray-400">
            <span>0</span>
            <span className="text-green-600">1120 kW</span>
            <span className="text-amber-600">1440 kW</span>
            <span className="text-red-600">1600 kW</span>
          </div>
        </div>
      </div>

      {/* 2. HANELER */}
      <div className="px-5 pb-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Haneler</span>
          <span className="text-xs text-gray-400">{n.totalHomes} hane</span>
        </div>
        <div className="grid grid-cols-6 gap-1.5 mb-2">
          {Array.from({ length: n.homes }).map((_, i) => (
            <div key={i} className="flex items-center justify-center">
              <img src="/ev.png" alt="Ev" className="w-8 h-8 object-contain opacity-80 hover:opacity-100 transition-opacity"
                style={{ filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.06))' }} />
            </div>
          ))}
        </div>
        <div>
          <div className="flex justify-between items-center text-xs mb-1">
            <span className="text-gray-500">Hane Yükü</span>
            <span className="font-medium text-gray-600">{n.homeLoad} kW</span>
          </div>
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-700"
              style={{ width: `${homeLoadPct}%`, background: 'linear-gradient(90deg, #3b82f6, #2563eb)' }} />
          </div>
        </div>
      </div>

      {/* 3. ENERJİ AKIŞI */}
      <div className="px-5 py-2">
        <EnergyFlow mode={n.mode} width={280} height={50} />
      </div>

      {/* 4. BESS BATARYA */}
      <div className="px-5 pb-3">
        <div className="bg-gray-50 rounded-xl border border-gray-100 p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">BESS Batarya</span>
              {isSolarCharging && (
                <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-200 animate-pulse-soft"
                  title="Solar şarj aktif">☀️ Solar</span>
              )}
            </div>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${bessStatus.bgClass}`}>{bessStatus.label}</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative flex-shrink-0">
              <div className="w-12 h-6 rounded-md border-2 relative overflow-hidden" style={{ borderColor: bessStatus.color }}>
                <div className="absolute inset-0.5 rounded-sm transition-all duration-700"
                  style={{ width: `${n.bess}%`, background: bessStatus.color, opacity: 0.8 }} />
                <div className="absolute -right-1.5 top-1/2 -translate-y-1/2 w-1.5 h-3 rounded-r-sm" style={{ background: bessStatus.color }} />
              </div>
              {isSolarCharging && <span className="absolute -top-2 -right-3 text-xs animate-pulse-soft">☀️</span>}
            </div>
            <p className="text-xl font-bold" style={{ color: bessStatus.color }}>%{n.bess.toFixed(1)}</p>
          </div>
          <div className="mt-2">
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all duration-700 ${n.bess < 20 ? 'animate-pulse-soft' : ''}`}
                style={{ width: `${n.bess}%`, background: isSolarCharging ? 'linear-gradient(90deg, #16a34a, #eab308)' : bessStatus.color }} />
            </div>
          </div>
        </div>
      </div>

      {/* 5. EV ŞARJ ALANI + ARAÇ EKLE */}
      <div className="px-5 pb-3">
        <PhysicsScene neighborhood={n} mode={n.mode} vehicleCount={n.vehicleCount} />
      </div>

      {/* ARAÇ EKLE BUTONU */}
      <div className="px-5 pb-4">
        <button
          onClick={() => onAddVehicle(n.id)}
          disabled={stationsFull && !n.redirect}
          className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-all border-2 flex items-center justify-center gap-2 ${
            stationsFull && !n.redirect
              ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
              : n.redirect
              ? 'bg-red-50 border-red-300 text-red-600 hover:bg-red-100 hover:border-red-400 active:scale-[0.98]'
              : 'bg-blue-50 border-blue-300 text-blue-600 hover:bg-blue-100 hover:border-blue-400 hover:shadow-md active:scale-[0.98]'
          }`}
        >
          <span className="text-lg">🚗</span>
          {stationsFull && !n.redirect
            ? `İstasyonlar Dolu (${n.vehicleCount}/${n.stations})`
            : n.redirect
            ? `Araç Ekle → Uygun Mahalleye Yönlendirilecek`
            : `Araç Ekle (+${EV_STATION_LOAD} kW) — ${n.vehicleCount}/${n.stations}`
          }
        </button>
      </div>

      {/* İSTASYON DOLU UYARISI */}
      {n.redirect && (
        <div className="mx-5 mb-5 p-3 rounded-xl bg-red-50 border-2 border-red-300 text-sm text-red-700 animate-pulse-soft">
          <span className="font-bold text-red-600">⛔ İstasyon Dolu!</span>
          <span className="ml-1">Yük &gt; 1440 kW veya BESS &lt; %20 — Yeni araçlar yükü en düşük mahalleye otomatik yönlendirilir.</span>
        </div>
      )}
    </div>
  );
}
