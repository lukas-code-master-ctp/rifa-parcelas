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
          {/* Labels row — flex justify-between so they spread evenly and never overflow */}
          <div className="flex justify-between mb-2 px-0">
            {milestones.map((ms, i) => {
              const reached = pct >= (ms / goal) * 100;
              return (
                <span key={i}
                  className={`text-xs font-semibold text-center flex-1 ${reached ? 'text-primary' : 'text-gray-400'}`}>
                  +1 parcela
                </span>
              );
            })}
          </div>

          {/* Bar */}
          <div className="relative h-6 bg-gray-100 rounded-full overflow-visible shadow-inner">
            <div
              className="progress-bar absolute top-0 left-0 h-full bg-gradient-to-r from-primary to-secondary rounded-full"
              style={{ width: `${pct}%` }}
            />
            {milestones.map((ms, i) => {
              const left    = (ms / goal) * 100;
              const reached = pct >= left;
              return (
                <div key={i} style={{
                  position: 'absolute', top: '50%', left: `${left}%`,
                  transform: 'translate(-50%,-50%)',
                  width: 14, height: 14, borderRadius: '50%',
                  border: '2px solid #23cb69',
                  background: reached ? '#23cb69' : '#fff',
                  zIndex: 2,
                }} />
              );
            })}
          </div>

          <div className="flex justify-between mt-3 text-sm">
            <span className="font-semibold text-primary">{current} e-books vendidos</span>
            <span className="text-gray-400">Meta: {goal}</span>
          </div>
        </div>
      </div>
    </section>
  );
}
