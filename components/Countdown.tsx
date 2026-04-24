'use client';
import { useEffect, useState } from 'react';

function pad(n: number) { return String(Math.floor(n)).padStart(2, '0'); }

export default function Countdown({ target }: { target: string }) {
  const [time, setTime] = useState({ days:'00', hours:'00', minutes:'00', seconds:'00' });

  useEffect(() => {
    const tick = () => {
      const diff = new Date(target).getTime() - Date.now();
      if (diff <= 0) { setTime({ days:'00', hours:'00', minutes:'00', seconds:'00' }); return; }
      setTime({
        days:    pad(diff / 86400000),
        hours:   pad((diff % 86400000) / 3600000),
        minutes: pad((diff % 3600000)  / 60000),
        seconds: pad((diff % 60000)    / 1000),
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [target]);

  return (
    <div className="w-full bg-white rounded-2xl shadow-md border border-accent px-5 py-4">
      <p className="text-center text-sm font-semibold text-gray-500 mb-3 uppercase tracking-wider">Cuenta regresiva al sorteo</p>
      <div className="grid grid-cols-4 gap-2 text-center pr-12 sm:pr-0">
        {[['days','días'],['hours','horas'],['minutes','min'],['seconds','seg']].map(([k,label]) => (
          <div key={k} className="bg-primary/10 rounded-xl py-3">
            <span className="font-heading font-extrabold text-2xl sm:text-3xl text-primary tabular-nums">{time[k as keyof typeof time]}</span>
            <p className="text-xs text-gray-400 mt-1">{label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
