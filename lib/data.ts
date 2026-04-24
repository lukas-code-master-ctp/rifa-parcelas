import { cache } from 'react';
import { readSheet } from './sheets';
import type { SiteConfig, Ebook, Parcela } from '@/types';

// Module-level cache with 30s TTL
let configCache: { data: SiteConfig; ts: number } | null = null;
let ebooksCache: { data: Ebook[]; ts: number }         | null = null;
let parcelasCache: { data: Parcela[]; ts: number }     | null = null;
const TTL = 30_000;

export const getConfig = cache(async (): Promise<SiteConfig> => {
  if (configCache && Date.now() - configCache.ts < TTL) return configCache.data;

  const rows = await readSheet('Config!A:B');
  const map: Record<string, string> = {};
  rows.forEach(([k, v]) => { if (k) map[k.trim()] = String(v ?? ''); });

  const data: SiteConfig = {
    countdown_datetime: map.countdown_datetime ?? '',
    progress_current:   Number(map.progress_current  ?? 0),
    progress_goal:      Number(map.progress_goal     ?? 200),
    whatsapp_number:    map.whatsapp_number           ?? '',
    sorteo_parcelas:    Number(map.sorteo_parcelas    ?? 3),
    milestone_1:        Number(map.milestone_1        ?? 50),
    milestone_2:        Number(map.milestone_2        ?? 100),
    milestone_3:        Number(map.milestone_3        ?? 150),
    milestone_4:        Number(map.milestone_4        ?? 200),
    hero_imagen_url:    map.hero_imagen_url            ?? '',
  };

  configCache = { data, ts: Date.now() };
  return data;
});

export const getEbooks = cache(async (): Promise<Ebook[]> => {
  if (ebooksCache && Date.now() - ebooksCache.ts < TTL) return ebooksCache.data;

  const rows = await readSheet('Ebooks!A:H');
  if (rows.length < 2) return [];
  const [, ...data] = rows;

  const ebooks = data
    .filter(r => r[6]?.toUpperCase() === 'TRUE')
    .map(r => ({
      id:              r[0] ?? '',
      titulo:          r[1] ?? '',
      descripcion:     r[2] ?? '',
      precio:          Number(r[3] ?? 0),
      participaciones: Number(r[4] ?? 1),
      imagen_url:      r[5] ?? '',
      best_seller:     r[7]?.toUpperCase() === 'TRUE',
    }));

  ebooksCache = { data: ebooks, ts: Date.now() };
  return ebooks;
});

export const getParcelas = cache(async (): Promise<Parcela[]> => {
  if (parcelasCache && Date.now() - parcelasCache.ts < TTL) return parcelasCache.data;

  const rows = await readSheet('Parcelas!A:I');
  if (rows.length < 2) return [];
  const [, ...data] = rows;

  const parcelas = data.map(r => ({
    id:          r[0] ?? '',
    nombre:      r[1] ?? '',
    proyecto:    r[2] ?? '',
    ubicacion:   r[3] ?? '',
    metraje:     r[4] ?? '',
    precio:      r[5] ?? '',
    estado:      (r[6]?.toLowerCase() ?? 'bloqueada') as 'disponible' | 'bloqueada',
    imagen_url:  r[7] ?? '',
    descripcion: r[8] ?? '',
  }));

  parcelasCache = { data: parcelas, ts: Date.now() };
  return parcelas;
});
