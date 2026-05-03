// GridGuardian AI - Core Data & Simulation Logic
// Akıllı EV Şarj ve Trafo Yük Yönetim Sistemi

// ===== Teknik Parametreler =====
export const TRAFO_CAPACITY = 1600;
export const HOME_LOAD_PER_UNIT = 5;
export const EV_STATION_LOAD = 200;
export const BESS_CAPACITY = 1000;

// ===== Eşik Değerleri =====
export const GREEN_THRESHOLD = 1120;
export const YELLOW_THRESHOLD = 1440;
export const BESS_CRITICAL = 20;
export const SOLAR_CHARGE_RATE = 0.2;

// ===== Mahalle Tanımları =====
export const NEIGHBORHOODS = [
  {
    id: 'A', name: 'Mahalle A',
    homes: 12, totalHomes: 150, stations: 4,
    peakHomekW: 750, peakStationkW: 800,  // Toplam: 1550 kW
  },
  {
    id: 'B', name: 'Mahalle B',
    homes: 10, totalHomes: 100, stations: 6,
    peakHomekW: 500, peakStationkW: 1200, // Toplam: 1700 kW (6 araç → trafo aşar)
    critical: true,
  },
  {
    id: 'C', name: 'Mahalle C',
    homes: 12, totalHomes: 120, stations: 4,
    peakHomekW: 600, peakStationkW: 800,  // Toplam: 1400 kW (güvenli liman)
  },
];

// ===== Yardımcı Fonksiyonlar =====
export const rand = (min, max) => Math.random() * (max - min) + min;

export const getMode = (totalLoad) => {
  if (totalLoad <= GREEN_THRESHOLD) return 'normal';
  if (totalLoad <= YELLOW_THRESHOLD) return 'hybrid';
  return 'critical';
};

export const MODE_CONFIG = {
  normal: {
    label: 'Normal', borderClass: 'card-glow-green',
    badgeClass: 'bg-green-50 text-green-700 border-green-200',
    textColor: '#16a34a', barGradient: 'linear-gradient(90deg, #22c55e, #16a34a)',
  },
  hybrid: {
    label: 'Hibrit', borderClass: 'card-glow-yellow',
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
    textColor: '#ca8a04', barGradient: 'linear-gradient(90deg, #f59e0b, #ea580c)',
  },
  critical: {
    label: 'Kritik', borderClass: 'card-glow-red',
    badgeClass: 'bg-red-50 text-red-700 border-red-200',
    textColor: '#dc2626', barGradient: 'linear-gradient(90deg, #ef4444, #dc2626)',
  },
  redirect: {
    label: 'Yönlendiriliyor', borderClass: 'card-glow-red',
    badgeClass: 'bg-red-50 text-red-700 border-red-200',
    textColor: '#dc2626', barGradient: 'linear-gradient(90deg, #ef4444, #b91c1c)',
  },
};

// BESS durumu: vehicleCount ve mode'a göre akıllı etiketleme
// "Destek Veriyor" → YALNIZCA araç >= 1 VE yük > 1120 kW (hibrit/kritik)
// Araç yoksa → "Beklemede" (sarı/kırmızı bölge) veya "Solar Şarj" (yeşil bölge)
export const getBessStatus = (bess, vehicleCount = 0, mode = 'normal') => {
  // Kritik seviye (her durumda)
  if (bess <= 20) return { label: 'Kritik', color: '#dc2626', bgClass: 'bg-red-50 text-red-700' };

  // Aktif destek: araç var VE yük sarı/kırmızı bölgede → deşarj oluyor
  const isSupporting = vehicleCount > 0 && (mode === 'hybrid' || mode === 'critical');
  if (isSupporting) return { label: 'Destek Veriyor', color: '#ca8a04', bgClass: 'bg-amber-50 text-amber-700' };

  // Sağlıklı ve dolu
  if (bess >= 100) return { label: 'Sağlıklı', color: '#16a34a', bgClass: 'bg-green-50 text-green-700' };

  // Araç yok, batarya dolu değil
  // Sarı/kırmızı bölgede ama araç yok → Beklemede (batarya sabit, güneşle dolar)
  // Yeşil bölgede → Solar Şarj
  if (vehicleCount === 0 && (mode === 'hybrid' || mode === 'critical')) {
    return { label: 'Beklemede ☀️', color: '#6b7280', bgClass: 'bg-gray-50 text-gray-600' };
  }
  return { label: 'Solar Şarj ☀️', color: '#ca8a04', bgClass: 'bg-amber-50 text-amber-600' };
};

// ===== Türetilmiş Alanları Hesapla =====
export function recalcState(n) {
  const gridBoost = n.gridBoost || 0; // Şebeke baz yükü (senaryo kaynaklı)
  const rawStationLoad = n.vehicleCount * EV_STATION_LOAD;
  const totalRawLoad = n.homeLoad + rawStationLoad + gridBoost;
  const mode = getMode(totalRawLoad);

  let trafoStationLoad = rawStationLoad;
  let bessStationLoad = 0;
  if (mode === 'hybrid') {
    trafoStationLoad = Math.round(rawStationLoad * 0.5);
    bessStationLoad = rawStationLoad - trafoStationLoad;
  }
  if (mode === 'critical') {
    trafoStationLoad = 0;
    bessStationLoad = rawStationLoad;
  }

  // Kırmızı mod: Yük > 1440 kW (kritik) VEYA BESS < %20
  const redirect = mode === 'critical' || n.bess < BESS_CRITICAL;
  // Solar: araç yoksa (veya yeşil bölge) ve batarya dolu değilse şarj olur
  const solarCharging = (n.vehicleCount === 0 || mode === 'normal') && n.bess < 100;

  return {
    ...n,
    gridBoost,
    rawStationLoad,
    trafoStationLoad,
    bessStationLoad,
    trafoLoad: n.homeLoad + trafoStationLoad + gridBoost,
    totalRawLoad,
    mode,
    redirect,
    solarCharging,
  };
}

// ===== Simülasyon Başlangıç (Normal Senaryo) =====
export function initSimState() {
  return NEIGHBORHOODS.map((n) => {
    const bess = n.id === 'B' ? 35 : n.id === 'C' ? 85 : 100;
    return recalcState({
      ...n,
      homeLoad: Math.round(n.peakHomekW * 0.4),
      vehicleCount: 0,
      gridBoost: 0,
      bess,
    });
  });
}

// ===== Senaryo Uygulama =====
export function applyScenarioToState(prev, key) {
  switch (key) {
    case 'normal':
      return NEIGHBORHOODS.map((n) => {
        const bess = n.id === 'B' ? 35 : n.id === 'C' ? 85 : 100;
        return recalcState({ ...n, vehicleCount: 0, gridBoost: 0, homeLoad: Math.round(n.peakHomekW * 0.4), bess });
      });
    case 'peak': {
      // Araç ekleme! Şebeke baz yükünü artırarak A ve B'yi sarıya çek
      // A: 750*0.85=638 + gridBoost 500 = 1138 > 1120 → Hibrit
      // B: 500*0.85=425 + gridBoost 700 = 1125 > 1120 → Hibrit
      const peakBoost = { A: 500, B: 700, C: 0 };
      return prev.map((n) =>
        recalcState({
          ...n,
          vehicleCount: 0, // Araç ekleme
          homeLoad: Math.round(n.peakHomekW * 0.85),
          gridBoost: peakBoost[n.id] ?? 0,
        })
      );
    }
    case 'critical':
      // Sadece B'yi hedef al: BESS %15, ev yükü %90
      return prev.map((n) => {
        if (n.id === 'B') {
          return recalcState({ ...n, homeLoad: Math.round(n.peakHomekW * 0.9), bess: 15 });
        }
        return n;
      });
    default:
      return prev;
  }
}

// ===== Araç Ekleme + Yönlendirme =====
export function addVehicleToState(prev, targetId) {
  const logs = [];
  const target = prev.find((n) => n.id === targetId);
  if (!target) return { states: prev, logs };

  // Hedef zaten kırmızı moddaysa → direkt en uygun mahalleye yönlendir
  if (target.redirect) {
    const candidates = prev
      .filter((n) => n.id !== targetId && !n.redirect && n.vehicleCount < n.stations)
      .sort((a, b) => (a.homeLoad + a.rawStationLoad) - (b.homeLoad + b.rawStationLoad));
    const best = candidates[0];
    if (best) {
      const updated = prev.map((n) => {
        if (n.id === best.id) return recalcState({ ...n, vehicleCount: n.vehicleCount + 1 });
        return n;
      });
      logs.push({
        time: new Date(), type: 'redirect',
        msg: `⚠️ ${target.name} → ${best.name} Yönlendirme Yapıldı!`,
        from: targetId, to: best.id,
      });
      logs.push({ time: new Date(), type: 'info', msg: `Kritik Yük Dengeleme: ${target.name} → ${best.name} yönlendirmesi yapıldı.` });
      logs.push({ time: new Date(), type: 'success', msg: `Trafo aşırı yüklenmesi engellendi.` });
      return { states: updated, logs };
    }
    logs.push({ time: new Date(), type: 'warning', msg: `Tüm istasyonlar dolu — yönlendirme yapılamadı.` });
    return { states: prev, logs };
  }

  // İstasyon dolu mu?
  if (target.vehicleCount >= target.stations) {
    logs.push({ time: new Date(), type: 'warning', msg: `${target.name}: İstasyon dolu, araç eklenemedi.` });
    return { states: prev, logs };
  }

  // Aracı ekle ve durumu hesapla
  let updated = prev.map((n) => {
    if (n.id !== targetId) return n;
    return recalcState({ ...n, vehicleCount: n.vehicleCount + 1 });
  });

  const updatedTarget = updated.find((n) => n.id === targetId);

  // Ekleme sonrası kırmızı moda girdi mi?
  if (updatedTarget.redirect) {
    const candidates = updated
      .filter((n) => n.id !== targetId && !n.redirect && n.vehicleCount < n.stations)
      .sort((a, b) => (a.homeLoad + a.rawStationLoad) - (b.homeLoad + b.rawStationLoad));
    const best = candidates[0];
    if (best) {
      updated = updated.map((n) => {
        if (n.id === targetId) return recalcState({ ...n, vehicleCount: n.vehicleCount - 1 });
        if (n.id === best.id) return recalcState({ ...n, vehicleCount: n.vehicleCount + 1 });
        return n;
      });
      logs.push({
        time: new Date(), type: 'redirect',
        msg: `⚠️ ${updatedTarget.name} → ${best.name} Yönlendirme Yapıldı!`,
        from: targetId, to: best.id,
      });
      logs.push({ time: new Date(), type: 'info', msg: `Kritik Yük Dengeleme: ${updatedTarget.name} → ${best.name} yönlendirmesi yapıldı.` });
      logs.push({ time: new Date(), type: 'success', msg: `Trafo aşırı yüklenmesi engellendi.` });
    }
  } else {
    logs.push({
      time: new Date(), type: 'info',
      msg: `🚗 ${updatedTarget.name}'ye araç eklendi (${updatedTarget.vehicleCount}/${updatedTarget.stations}).`,
    });
  }

  return { states: updated, logs };
}

// ===== Simülasyon Tick (Her 2 saniye) =====
export function tickSimState(prev) {
  const logs = [];

  const next = prev.map((n) => {
    // Ev yükü dalgalanması ±8 kW
    let homeLoad = n.homeLoad + Math.round(rand(-8, 8));
    homeLoad = Math.max(Math.round(n.peakHomekW * 0.15), Math.min(Math.round(n.peakHomekW * 0.95), homeLoad));

    // İstasyon yükü sabit (araç sayısına bağlı, dalgalanma yok)
    const rawStationLoad = n.vehicleCount * EV_STATION_LOAD;
    const gridBoost = n.gridBoost || 0;
    const totalRawLoad = homeLoad + rawStationLoad + gridBoost;
    const mode = getMode(totalRawLoad);

    let trafoStationLoad = rawStationLoad;
    let bessStationLoad = 0;
    if (mode === 'hybrid') {
      trafoStationLoad = Math.round(rawStationLoad * 0.5);
      bessStationLoad = rawStationLoad - trafoStationLoad;
    }
    if (mode === 'critical') {
      trafoStationLoad = 0;
      bessStationLoad = rawStationLoad;
    }

    // ===== BESS DEŞARJ KOŞULU =====
    // Batarya SADECE şu iki şart aynı anda (AND) sağlanırsa azalır:
    //   1) İstasyonda en az 1 aktif araç (vehicleCount > 0)
    //   2) Trafo yükü 1120 kW üzerinde (totalRawLoad > GREEN_THRESHOLD)
    // Araç yoksa → trafo ne kadar yüksek olursa olsun batarya AZALMAZ.
    let bess = n.bess;
    const isActivelySupporting = n.vehicleCount > 0 && totalRawLoad > GREEN_THRESHOLD;
    const bessDrain = isActivelySupporting ? (bessStationLoad / BESS_CAPACITY) * 0.8 : 0;

    // ===== SOLAR ŞARJ =====
    // Araç yoksa → güneşle dolar (sarı modda bile)
    // Araç varsa → sadece yeşil bölgede dolar
    let solarCharging = false;
    let solarCharge = 0;
    if (bess < 100 && (n.vehicleCount === 0 || totalRawLoad < GREEN_THRESHOLD)) {
      solarCharge = SOLAR_CHARGE_RATE;
      solarCharging = true;
    }
    bess = Math.max(0, Math.min(100, bess - bessDrain + solarCharge));

    // Mod değişikliği log
    if (mode !== n.mode) {
      if (mode === 'hybrid') {
        logs.push({ time: new Date(), type: 'warning', msg: `${n.name} hibrit moda geçti.` });
      } else if (mode === 'critical') {
        logs.push({ time: new Date(), type: 'critical', msg: `${n.name} kapasite aşıldı!` });
      } else if (mode === 'normal' && n.mode !== 'normal') {
        logs.push({ time: new Date(), type: 'success', msg: `${n.name} normal moda döndü.` });
      }
    }

    // BESS kritik seviye geçiş log
    if (bess < BESS_CRITICAL && n.bess >= BESS_CRITICAL) {
      logs.push({ time: new Date(), type: 'critical', msg: `${n.name}: BESS kritik! (%${bess.toFixed(1)})` });
    }

    const redirect = mode === 'critical' || bess < BESS_CRITICAL;

    return { ...n, homeLoad, rawStationLoad, gridBoost, trafoStationLoad, bessStationLoad,
      trafoLoad: homeLoad + trafoStationLoad + gridBoost, totalRawLoad, bess, mode, redirect, solarCharging };
  });

  return { states: next, logs };
}

// ===== Analitik =====
export function calcSavings(states) {
  const totalPreventedLoad = states.reduce((s, n) => s + n.bessStationLoad, 0);
  const redirectCount = states.filter((n) => n.redirect).length;
  return {
    totalPreventedLoad,
    redirectCount,
    carbonSaved: ((totalPreventedLoad * 0.5) / 1000).toFixed(2),
    costSaved: Math.round(totalPreventedLoad * 0.85),
  };
}

export function generateTimeSeriesData() {
  const data = [];
  for (let h = 0; h < 24; h++) {
    const hour = `${h.toString().padStart(2, '0')}:00`;
    const f = h >= 7 && h <= 10 ? 0.8 : h >= 17 && h <= 21 ? 0.95 : h >= 11 && h <= 16 ? 0.6 : 0.3;
    data.push({
      time: hour,
      'Mahalle A': Math.round(750 * f * rand(0.85, 1.15) + 800 * f * rand(0.2, 0.8)),
      'Mahalle B': Math.round(500 * f * rand(0.85, 1.15) + 1200 * f * rand(0.3, 1.0)),
      'Mahalle C': Math.round(600 * f * rand(0.85, 1.15) + 800 * f * rand(0.2, 0.6)),
    });
  }
  return data;
}

export function generateBessTimeSeriesData() {
  const data = [];
  let bA = 95, bB = 90, bC = 92;
  for (let h = 0; h < 24; h++) {
    const hour = `${h.toString().padStart(2, '0')}:00`;
    const d = h >= 17 && h <= 21 ? rand(4, 8) : h >= 7 && h <= 10 ? rand(2, 5) : rand(-2, 1);
    bA = Math.max(5, Math.min(100, bA - d * rand(0.5, 1.2)));
    bB = Math.max(5, Math.min(100, bB - d * rand(0.8, 1.5)));
    bC = Math.max(5, Math.min(100, bC - d * rand(0.4, 1.0)));
    data.push({ time: hour, 'Mahalle A': Math.round(bA), 'Mahalle B': Math.round(bB), 'Mahalle C': Math.round(bC) });
  }
  return data;
}
