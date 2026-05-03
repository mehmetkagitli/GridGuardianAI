// GridGuardian AI - Veri Analitiği Sayfası
// Recharts ile zaman serisi grafikleri, BESS kullanımı ve yönlendirme istatistikleri

import { useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, BarChart, Bar, AreaChart, Area,
  ReferenceLine,
} from 'recharts';
import {
  GREEN_THRESHOLD, YELLOW_THRESHOLD, TRAFO_CAPACITY, BESS_CRITICAL,
  calcSavings, generateTimeSeriesData, generateBessTimeSeriesData,
} from './data';

/**
 * AnalyticsPage - 3 ana grafik + AI Insight paneli
 * 1. Zaman İçinde Trafo Yükü (Line Chart)
 * 2. BESS Kullanımı (Area Chart)
 * 3. Yönlendirme / Engellenen Kesinti (Bar Chart + KPI)
 */
export default function AnalyticsPage({ states, logs }) {
  const savings = calcSavings(states);

  // Zaman serisi verisi (memo ile tekrar render'da sabit kalır)
  const timeSeriesData = useMemo(() => generateTimeSeriesData(), []);
  const bessTimeData = useMemo(() => generateBessTimeSeriesData(), []);

  // Yönlendirme/kesinti istatistikleri
  const redirectLogs = logs.filter(l => l.type === 'redirect');
  const criticalLogs = logs.filter(l => l.type === 'critical');

  // Bar chart verisi
  const barData = states.map(n => ({
    name: n.name,
    'Ev Yükü': n.homeLoad,
    'Şarj (Trafo)': n.trafoStationLoad,
    'Şarj (BESS)': n.bessStationLoad,
  }));

  // Yönlendirme bar verisi
  const redirectBarData = [
    { name: 'Yönlendirilen Araç', value: redirectLogs.length, fill: '#ea580c' },
    { name: 'Engellenen Kesinti', value: criticalLogs.length, fill: '#dc2626' },
    { name: 'BESS Müdahale', value: states.filter(n => n.bessStationLoad > 0).length, fill: '#2563eb' },
  ];

  // Tooltip stilini açık tema için ayarla
  const tooltipStyle = {
    background: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: 12,
    color: '#1f2937',
    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* ===== GRAFIK 1: Zaman İçinde Trafo Yükü ===== */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-lg font-bold text-gray-800">
              Zaman İçinde Trafo Yükü
            </h3>
            <p className="text-sm text-gray-400 mt-0.5">
              24 saatlik yük değişimi (A, B, C mahalleleri)
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1">
              <span className="w-3 h-0.5 bg-green-500 rounded" /> Mahalle A
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-0.5 bg-amber-500 rounded" /> Mahalle B
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-0.5 bg-blue-500 rounded" /> Mahalle C
            </span>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={timeSeriesData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis
              dataKey="time"
              stroke="#9ca3af"
              fontSize={11}
              tickLine={false}
            />
            <YAxis
              stroke="#9ca3af"
              fontSize={11}
              tickLine={false}
              domain={[0, TRAFO_CAPACITY + 200]}
            />
            <Tooltip contentStyle={tooltipStyle} />
            <ReferenceLine
              y={GREEN_THRESHOLD}
              stroke="#16a34a"
              strokeDasharray="4 4"
              label={{
                value: `Normal: ${GREEN_THRESHOLD} kW`,
                fill: '#16a34a',
                fontSize: 10,
                position: 'right',
              }}
            />
            <ReferenceLine
              y={YELLOW_THRESHOLD}
              stroke="#ca8a04"
              strokeDasharray="4 4"
              label={{
                value: `Hibrit: ${YELLOW_THRESHOLD} kW`,
                fill: '#ca8a04',
                fontSize: 10,
                position: 'right',
              }}
            />
            <ReferenceLine
              y={TRAFO_CAPACITY}
              stroke="#dc2626"
              strokeDasharray="4 4"
              label={{
                value: `Kapasite: ${TRAFO_CAPACITY} kW`,
                fill: '#dc2626',
                fontSize: 10,
                position: 'right',
              }}
            />
            <Line
              type="monotone"
              dataKey="Mahalle A"
              stroke="#16a34a"
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 4 }}
            />
            <Line
              type="monotone"
              dataKey="Mahalle B"
              stroke="#ca8a04"
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 4 }}
            />
            <Line
              type="monotone"
              dataKey="Mahalle C"
              stroke="#2563eb"
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* İki grafik yan yana */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ===== GRAFIK 2: BESS Kullanımı ===== */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <div className="mb-5">
            <h3 className="text-lg font-bold text-gray-800">BESS Kullanımı</h3>
            <p className="text-sm text-gray-400 mt-0.5">
              Batarya doluluk oranı ve destek kullanımı
            </p>
          </div>

          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={bessTimeData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis
                dataKey="time"
                stroke="#9ca3af"
                fontSize={11}
                tickLine={false}
              />
              <YAxis
                stroke="#9ca3af"
                fontSize={11}
                tickLine={false}
                domain={[0, 100]}
                unit="%"
              />
              <Tooltip contentStyle={tooltipStyle} />
              <ReferenceLine
                y={BESS_CRITICAL}
                stroke="#dc2626"
                strokeDasharray="3 3"
                label={{
                  value: `Kritik: %${BESS_CRITICAL}`,
                  fill: '#dc2626',
                  fontSize: 10,
                }}
              />
              <Area
                type="monotone"
                dataKey="Mahalle A"
                stroke="#16a34a"
                fill="#16a34a"
                fillOpacity={0.1}
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="Mahalle B"
                stroke="#ca8a04"
                fill="#ca8a04"
                fillOpacity={0.1}
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="Mahalle C"
                stroke="#2563eb"
                fill="#2563eb"
                fillOpacity={0.1}
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>

          {/* Anlık BESS durumu */}
          <div className="grid grid-cols-3 gap-3 mt-4">
            {states.map(n => {
              const color = n.bess < 20 ? '#dc2626' : n.bess < 50 ? '#ca8a04' : '#16a34a';
              return (
                <div
                  key={n.id}
                  className="text-center p-2 bg-gray-50 rounded-xl border border-gray-100"
                >
                  <p className="text-xs text-gray-500">{n.name}</p>
                  <p className="text-lg font-bold" style={{ color }}>
                    %{n.bess.toFixed(0)}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* ===== GRAFIK 3: Yönlendirme / Engellenen Kesinti ===== */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <div className="mb-5">
            <h3 className="text-lg font-bold text-gray-800">
              Yönlendirme & Engellenen Kesinti
            </h3>
            <p className="text-sm text-gray-400 mt-0.5">
              Sistem müdahaleleri ve önlenen riskler
            </p>
          </div>

          {/* KPI Kartları */}
          <div className="grid grid-cols-3 gap-3 mb-5">
            <KpiMini
              label="Yönlendirilen Araç"
              value={redirectLogs.length}
              color="#ea580c"
              bgColor="#fff7ed"
            />
            <KpiMini
              label="Kritik Olay"
              value={criticalLogs.length}
              color="#dc2626"
              bgColor="#fef2f2"
            />
            <KpiMini
              label="BESS Müdahale"
              value={states.filter(n => n.bessStationLoad > 0).length}
              color="#2563eb"
              bgColor="#eff6ff"
            />
          </div>

          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={redirectBarData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis
                dataKey="name"
                stroke="#9ca3af"
                fontSize={11}
                tickLine={false}
              />
              <YAxis stroke="#9ca3af" fontSize={11} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                {redirectBarData.map((entry, index) => (
                  <Bar key={index} dataKey="value" fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ===== ANLİK GÜÇ DAĞILIMI ===== */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <div className="mb-5">
          <h3 className="text-lg font-bold text-gray-800">Anlık Güç Dağılımı</h3>
          <p className="text-sm text-gray-400 mt-0.5">
            Mahallelere göre ev yükü, trafo şarj ve BESS şarj dağılımı
          </p>
        </div>

        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={barData} barGap={4}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} tickLine={false} />
            <YAxis stroke="#9ca3af" fontSize={11} tickLine={false} domain={[0, TRAFO_CAPACITY + 200]} />
            <Tooltip contentStyle={tooltipStyle} />
            <Legend />
            <ReferenceLine
              y={GREEN_THRESHOLD}
              stroke="#16a34a"
              strokeDasharray="4 4"
            />
            <ReferenceLine
              y={YELLOW_THRESHOLD}
              stroke="#ca8a04"
              strokeDasharray="4 4"
            />
            <ReferenceLine
              y={TRAFO_CAPACITY}
              stroke="#dc2626"
              strokeDasharray="4 4"
            />
            <Bar dataKey="Ev Yükü" stackId="a" fill="#3b82f6" radius={[0, 0, 0, 0]} />
            <Bar dataKey="Şarj (Trafo)" stackId="a" fill="#16a34a" radius={[0, 0, 0, 0]} />
            <Bar dataKey="Şarj (BESS)" stackId="a" fill="#7c3aed" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* ===== AI INSIGHT PANELİ ===== */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-200 shadow-sm p-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center text-white text-lg flex-shrink-0 shadow-md">
            🧠
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-800 mb-2">AI Insight</h3>
            <p className="text-sm text-gray-600 leading-relaxed">
              <strong className="text-blue-700">GridGuardian AI</strong>, pik yük anlarında
              BESS desteği ve mahalleler arası yönlendirme kullanarak trafo üzerindeki kritik
              yükleri azaltır. Böylece kesinti riski düşer ve EV şarj talebi daha dengeli
              dağıtılır. Sistem, her mahalle için gerçek zamanlı yük analizi yaparak optimal
              enerji dağıtım kararları verir.
            </p>
            <div className="grid grid-cols-3 gap-3 mt-4">
              <InsightStat
                label="Önlenen Yük"
                value={`${savings.totalPreventedLoad} kW`}
                color="text-green-700"
              />
              <InsightStat
                label="Karbon Tasarrufu"
                value={`${savings.carbonSaved} ton`}
                color="text-blue-700"
              />
              <InsightStat
                label="Maliyet Tasarrufu"
                value={`₺${savings.costSaved.toLocaleString()}`}
                color="text-amber-700"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Mini KPI Kartı ---
function KpiMini({ label, value, color, bgColor }) {
  return (
    <div
      className="text-center p-3 rounded-xl border"
      style={{ backgroundColor: bgColor, borderColor: `${color}22` }}
    >
      <p className="text-2xl font-bold" style={{ color }}>
        {value}
      </p>
      <p className="text-xs text-gray-500 mt-0.5">{label}</p>
    </div>
  );
}

// --- Insight Stat ---
function InsightStat({ label, value, color }) {
  return (
    <div className="bg-white/70 rounded-xl p-3 text-center border border-blue-100">
      <p className={`text-lg font-bold ${color}`}>{value}</p>
      <p className="text-xs text-gray-500">{label}</p>
    </div>
  );
}
