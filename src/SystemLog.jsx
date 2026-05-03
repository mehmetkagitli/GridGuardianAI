// GridGuardian AI - Canlı Sistem Logları Paneli
// Son 5 olay gösterilir, açık tema ile uyumlu

/**
 * SystemLog - Canlı sistem loglarını gösteren sade panel
 * Props:
 * - logs: Array of { time, type, msg }
 *   type: 'info' | 'warning' | 'critical' | 'redirect' | 'success'
 */
export default function SystemLog({ logs = [] }) {
  // Son 5 log göster
  const visibleLogs = logs.slice(0, 5);

  // Log tipine göre stil
  const getLogStyle = (type) => {
    switch (type) {
      case 'success':
        return { dot: 'bg-green-500', text: 'text-gray-700' };
      case 'info':
        return { dot: 'bg-blue-500', text: 'text-gray-700' };
      case 'warning':
        return { dot: 'bg-amber-500', text: 'text-amber-800' };
      case 'critical':
        return { dot: 'bg-red-500', text: 'text-red-700' };
      case 'redirect':
        return { dot: 'bg-orange-500', text: 'text-orange-800' };
      default:
        return { dot: 'bg-gray-400', text: 'text-gray-600' };
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-gray-800 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          Canlı Sistem Logları
        </h3>
        <span className="text-xs text-gray-400 font-medium">
          Son {visibleLogs.length} olay
        </span>
      </div>

      {/* Log listesi */}
      <div className="space-y-2">
        {visibleLogs.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-sm text-gray-400">Henüz sistem olayı yok.</p>
            <p className="text-xs text-gray-300 mt-1">
              Simülasyon çalışırken olaylar burada görünecek.
            </p>
          </div>
        ) : (
          visibleLogs.map((log, i) => {
            const style = getLogStyle(log.type);
            return (
              <div
                key={`${log.time?.getTime?.() || i}-${i}`}
                className={`flex items-start gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100 
                  transition-all duration-300 ${i === 0 ? 'animate-fade-in-up' : ''}`}
              >
                {/* Durum noktası */}
                <div className="mt-1 flex-shrink-0">
                  <span className={`block w-2.5 h-2.5 rounded-full ${style.dot}`} />
                </div>

                {/* Log içerik */}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm leading-relaxed ${style.text}`}>
                    {log.msg}
                  </p>
                </div>

                {/* Zaman */}
                <span className="text-xs text-gray-400 flex-shrink-0 tabular-nums">
                  {log.time ? log.time.toLocaleTimeString('tr-TR', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  }) : '--:--:--'}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
