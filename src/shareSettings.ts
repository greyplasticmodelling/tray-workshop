import type { TraySettings, TrayTemplate } from './types';
import { shareDefaultsV2 } from './shareDefaultsV2';

const templates = Object.keys(shareDefaultsV2) as TrayTemplate[];
const fields = Object.keys(shareDefaultsV2.standard).filter((key) => key !== 'template') as Array<keyof TraySettings>;
const stringValues: Partial<Record<keyof TraySettings, readonly string[]>> = {
  adapterOvalSize: ['60x35', '75x42', '90x52', '105x70', '120x92', '170x105'],
  rankInsertAlignment: ['front', 'center', 'rear'],
  trayBevelCornerStyle: ['mitred', 'curved'],
  trayBevelProfile: ['single', 'rounded', 'double'],
  skirmishBaseShape: ['circle', 'square'],
  characterBaySide: ['left', 'right', 'both'],
  buildPlateSize: ['180x180', '235x235', '256x256', '300x300', '350x350'],
};

function pack(value: unknown): string {
  return btoa(unescape(encodeURIComponent(JSON.stringify(value)))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function unpack(value: string): unknown {
  const normalised = value.replace(/-/g, '+').replace(/_/g, '/');
  return JSON.parse(decodeURIComponent(escape(atob(normalised.padEnd(Math.ceil(normalised.length / 4) * 4, '=')))));
}

export function encodeSettings(settings: TraySettings, version: 1 | 2 = 2): string {
  if (version === 1) return pack(settings);
  const defaults: TraySettings = shareDefaultsV2[settings.template];
  const changes: unknown[] = [templates.indexOf(settings.template)];
  fields.forEach((key, index) => {
    if (settings[key] !== defaults[key]) changes.push(index, settings[key]);
  });
  return `2.${pack(changes)}`;
}

export function decodeSettings(value: string, legacyDefaults: Record<TrayTemplate, TraySettings>): TraySettings | null {
  try {
    if (value.length > 20000) return null;
    if (!value.startsWith('2.')) {
      const parsed = unpack(value) as Partial<TraySettings> | null;
      if (!parsed || typeof parsed !== 'object' || !Object.prototype.hasOwnProperty.call(legacyDefaults, parsed.template ?? '')) return null;
      const template = parsed.template as TrayTemplate;
      return { ...legacyDefaults[template], ...parsed, template };
    }
    const data = unpack(value.slice(2));
    if (!Array.isArray(data) || data.length % 2 !== 1 || !Number.isInteger(data[0]) || !templates[data[0]]) return null;
    const template = templates[data[0]];
    const settings: TraySettings = { ...shareDefaultsV2[template] };
    const seen = new Set<number>();
    for (let i = 1; i < data.length; i += 2) {
      const index = data[i];
      const next = data[i + 1];
      if (!Number.isInteger(index) || index < 0 || index >= fields.length || seen.has(index)) return null;
      seen.add(index);
      const key = fields[index];
      if (typeof next !== typeof settings[key]) return null;
      if (typeof next === 'number' && !Number.isFinite(next)) return null;
      if (typeof next === 'string' && !stringValues[key]?.includes(next)) return null;
      Object.assign(settings, { [key]: next });
    }
    return settings;
  } catch {
    return null;
  }
}
