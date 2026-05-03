// GridGuardian AI - Enerji Akış Çizgileri (SVG)
// Trafo → EV istasyon ve BESS → EV istasyon arası parlayan çizgiler

import { useEffect, useState } from 'react';

/**
 * EnergyFlow - Her mahalle kartı içinde trafo, BESS ve EV şarj alanı
 * arasındaki enerji akışını gösteren SVG animasyonlu çizgiler.
 *
 * Props:
 * - mode: 'normal' | 'hybrid' | 'critical'
 * - width: SVG genişliği
 * - height: SVG yüksekliği
 * - trafoY: Trafo konumu (üstten)
 * - evY: EV şarj alanı konumu (üstten)
 * - bessX: BESS konumu (soldan)
 */
export default function EnergyFlow({ mode = 'normal', width = 320, height = 60 }) {
  const [dashOffset, setDashOffset] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setDashOffset(prev => (prev - 1) % 40);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  const midX = width / 2;
  const trafoY = 5;
  const evY = height - 5;
  const bessX = width - 30;
  const bessY = height / 2;

  // Trafo → EV çizgi renkleri
  const getTrafoLineColor = () => {
    switch (mode) {
      case 'normal': return '#16a34a';    // Yeşil
      case 'hybrid': return '#ea580c';    // Turuncu
      case 'critical': return '#d1d5db';  // Gri/sönük
      default: return '#16a34a';
    }
  };

  // Trafo → EV çizgi opaklığı
  const getTrafoLineOpacity = () => {
    switch (mode) {
      case 'normal': return 0.9;
      case 'hybrid': return 0.7;
      case 'critical': return 0.25;
      default: return 0.9;
    }
  };

  // BESS → EV çizgi renkleri
  const getBessLineColor = () => {
    switch (mode) {
      case 'normal': return '#d1d5db';   // Pasif gri
      case 'hybrid': return '#2563eb';   // Mavi
      case 'critical': return '#dc2626'; // Kırmızı
      default: return '#d1d5db';
    }
  };

  // BESS → EV çizgi opaklığı
  const getBessLineOpacity = () => {
    switch (mode) {
      case 'normal': return 0.15;
      case 'hybrid': return 0.8;
      case 'critical': return 0.9;
      default: return 0.15;
    }
  };

  const trafoLineColor = getTrafoLineColor();
  const trafoLineOpacity = getTrafoLineOpacity();
  const bessLineColor = getBessLineColor();
  const bessLineOpacity = getBessLineOpacity();

  // Çizgi kalınlığı
  const trafoStrokeWidth = mode === 'normal' ? 3 : mode === 'hybrid' ? 2 : 1;
  const bessStrokeWidth = mode === 'critical' ? 3 : mode === 'hybrid' ? 2 : 1;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="mx-auto"
      style={{ overflow: 'visible' }}
    >
      <defs>
        {/* Trafo → EV gradient */}
        <linearGradient id={`trafoGrad-${mode}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={trafoLineColor} stopOpacity={trafoLineOpacity * 0.5} />
          <stop offset="50%" stopColor={trafoLineColor} stopOpacity={trafoLineOpacity} />
          <stop offset="100%" stopColor={trafoLineColor} stopOpacity={trafoLineOpacity * 0.7} />
        </linearGradient>

        {/* BESS → EV gradient */}
        <linearGradient id={`bessGrad-${mode}`} x1="100%" y1="0%" x2="50%" y2="100%">
          <stop offset="0%" stopColor={bessLineColor} stopOpacity={bessLineOpacity * 0.5} />
          <stop offset="50%" stopColor={bessLineColor} stopOpacity={bessLineOpacity} />
          <stop offset="100%" stopColor={bessLineColor} stopOpacity={bessLineOpacity * 0.7} />
        </linearGradient>

        {/* Glow filter */}
        <filter id="glow">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Trafo → EV ana çizgi */}
      <path
        d={`M ${midX} ${trafoY} C ${midX} ${height * 0.4}, ${midX} ${height * 0.6}, ${midX} ${evY}`}
        stroke={trafoLineColor}
        strokeWidth={trafoStrokeWidth}
        strokeOpacity={trafoLineOpacity}
        fill="none"
        strokeDasharray={mode === 'critical' ? '4 8' : '8 4'}
        strokeDashoffset={dashOffset}
        strokeLinecap="round"
        filter={mode !== 'critical' ? 'url(#glow)' : ''}
      />

      {/* Trafo → EV sol yan çizgi */}
      <path
        d={`M ${midX} ${trafoY} C ${midX - 40} ${height * 0.3}, ${midX - 30} ${height * 0.7}, ${midX - 20} ${evY}`}
        stroke={trafoLineColor}
        strokeWidth={trafoStrokeWidth * 0.7}
        strokeOpacity={trafoLineOpacity * 0.6}
        fill="none"
        strokeDasharray="6 6"
        strokeDashoffset={dashOffset}
        strokeLinecap="round"
      />

      {/* Trafo → EV sağ yan çizgi */}
      <path
        d={`M ${midX} ${trafoY} C ${midX + 40} ${height * 0.3}, ${midX + 30} ${height * 0.7}, ${midX + 20} ${evY}`}
        stroke={trafoLineColor}
        strokeWidth={trafoStrokeWidth * 0.7}
        strokeOpacity={trafoLineOpacity * 0.6}
        fill="none"
        strokeDasharray="6 6"
        strokeDashoffset={dashOffset}
        strokeLinecap="round"
      />

      {/* BESS → EV çizgi (sadece hybrid/critical modunda belirgin) */}
      <path
        d={`M ${bessX} ${bessY} C ${bessX - 20} ${bessY + 10}, ${midX + 30} ${evY - 15}, ${midX + 10} ${evY}`}
        stroke={bessLineColor}
        strokeWidth={bessStrokeWidth}
        strokeOpacity={bessLineOpacity}
        fill="none"
        strokeDasharray="5 5"
        strokeDashoffset={dashOffset * 1.5}
        strokeLinecap="round"
        filter={mode !== 'normal' ? 'url(#glow)' : ''}
      />

      {/* BESS → EV ikinci çizgi */}
      {(mode === 'hybrid' || mode === 'critical') && (
        <path
          d={`M ${bessX} ${bessY} C ${bessX - 30} ${bessY + 15}, ${midX + 10} ${evY - 10}, ${midX - 10} ${evY}`}
          stroke={bessLineColor}
          strokeWidth={bessStrokeWidth * 0.6}
          strokeOpacity={bessLineOpacity * 0.5}
          fill="none"
          strokeDasharray="4 6"
          strokeDashoffset={dashOffset * 1.2}
          strokeLinecap="round"
        />
      )}

      {/* Enerji partikülleri (animasyonlu nokta) */}
      {mode !== 'critical' && (
        <circle r="3" fill={trafoLineColor} opacity={0.8} filter="url(#glow)">
          <animateMotion
            dur="2s"
            repeatCount="indefinite"
            path={`M ${midX} ${trafoY} C ${midX} ${height * 0.4}, ${midX} ${height * 0.6}, ${midX} ${evY}`}
          />
        </circle>
      )}

      {(mode === 'hybrid' || mode === 'critical') && (
        <circle r="3" fill={bessLineColor} opacity={0.8} filter="url(#glow)">
          <animateMotion
            dur="1.8s"
            repeatCount="indefinite"
            path={`M ${bessX} ${bessY} C ${bessX - 20} ${bessY + 10}, ${midX + 30} ${evY - 15}, ${midX + 10} ${evY}`}
          />
        </circle>
      )}

      {/* Etiketler */}
      <text x={midX} y={trafoY - 1} textAnchor="middle" fontSize="8" fill="#6b7280" fontWeight="500">
        ▼ Trafo
      </text>
      <text x={midX} y={evY + 10} textAnchor="middle" fontSize="8" fill="#6b7280" fontWeight="500">
        ▼ EV Şarj
      </text>
      {(mode === 'hybrid' || mode === 'critical') && (
        <text x={bessX + 5} y={bessY - 8} textAnchor="middle" fontSize="8" fill={bessLineColor} fontWeight="600">
          BESS
        </text>
      )}
    </svg>
  );
}
