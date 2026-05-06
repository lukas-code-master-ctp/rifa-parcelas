import type { SiteConfig } from '@/types';

export default function ProgressBar({ config }: { config: SiteConfig }) {
  const goal       = config.progress_goal || 200;
  const current    = config.progress_current || 0;
  const pct        = Math.min((current / goal) * 100, 100);
  const milestones = [config.milestone_1, config.milestone_2, config.milestone_3, config.milestone_4].filter(Boolean);

  return (
    <section className="bg-white py-10 px-4 border-y border-gray-100">
      <div className="max-w-4xl mx-auto">
        <p className="text-center text-base sm:text-lg text-black/70 mb-6">
          Mientras más e-books sean vendidos, más parcelas regalaremos
        </p>

        <div className="relative pt-2">
          {/* Labels — evenly distributed */}
          <div className="flex justify-between mb-2">
            {milestones.map((ms, i) => {
              const reached = current >= ms;
              return (
                <span key={i} className={`text-xs font-semibold text-center flex-1 ${reached ? 'text-primary' : 'text-gray-400'}`}>
                  +1 parcela
                </span>
              );
            })}
          </div>

          {/* Bar */}
          <div className="relative h-6 bg-gray-100 rounded-full overflow-visible shadow-inner">
            {/* Fill */}
            <div
              className="progress-bar absolute top-0 left-0 h-full bg-gradient-to-r from-primary to-secondary rounded-full transition-all duration-700"
              style={{ width: `${pct}%` }}
            />

            {/* Dots — flex justify-between overlaid on the bar, matching label positions */}
            <div className="absolute inset-0 flex justify-between items-center">
              {milestones.map((ms, i) => {
                const reached = current >= ms;
                return (
                  <div key={i} className="flex-1 flex justify-center">
                    <div style={{
                      width: 14, height: 14, borderRadius: '50%',
                      border: '2px solid #23cb69',
                      background: reached ? '#23cb69' : '#fff',
                      flexShrink: 0,
                      zIndex: 2,
                      position: 'relative',
                    }} />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bottom text */}
          <div className="flex justify-between mt-3 text-sm">
            <span className="font-semibold text-primary">{Math.round(pct)}% completado</span>
            <span className="text-gray-400">Meta: {goal}</span>
          </div>
        </div>
      </div>
    </section>
  );
}
