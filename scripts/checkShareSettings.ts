import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { encodeSettings, decodeSettings } from '../src/shareSettings';
import { shareDefaultsV2 } from '../src/shareDefaultsV2';
import type { TraySettings } from '../src/types';

const defaults = shareDefaultsV2;
const lengths: unknown[] = [];
for (const settings of Object.values(defaults)) {
  assert.deepEqual(decodeSettings(encodeSettings(settings), defaults), settings);
  assert.deepEqual(decodeSettings(encodeSettings(settings, 1), defaults), settings);
  for (const [key, value] of Object.entries(settings)) {
    if (typeof value !== 'number' && typeof value !== 'boolean') continue;
    const changed = { ...settings, [key]: typeof value === 'number' ? value + 0.1 : !value } as TraySettings;
    assert.deepEqual(decodeSettings(encodeSettings(changed), defaults), changed, `${settings.template}/${key}`);
  }
  const complex: TraySettings = {
    ...settings, rows: 3, columns: 2, baseWidthMm: 100, baseDepthMm: 150,
    adapterCutoutWidthMm: 50, adapterCutoutDepthMm: 75, magnetCutoutsEnabled: true,
    magnetCutoutsFromBottom: true, characterBaySide: 'both', characterLeftBaseWidthMm: 40,
    characterRightBaseDepthMm: 80, trayBevelEnabled: true, trayBevelProfile: 'double',
    trayBevelCornerStyle: 'curved', rankInsertAlignment: 'center', generatedBaseEnabled: true,
  };
  assert.deepEqual(decodeSettings(encodeSettings(complex), defaults), complex);
  const futureDefaults = { ...defaults, [settings.template]: { ...settings, rows: 12, baseWidthMm: 150 } };
  assert.deepEqual(decodeSettings(encodeSettings(settings), futureDefaults), settings);
  lengths.push({ template: settings.template, v1: encodeSettings(settings, 1).length, v2: encodeSettings(settings).length, complexV2: encodeSettings(complex).length });
}
const app = readFileSync('src/App.tsx', 'utf8');
const legacy = app.match(/https:\/\/trayworkshop.co.uk\/\?settings=([^']+)/)![1];
const dragon = decodeSettings(legacy, defaults)!;
assert.equal(dragon.template, 'adapter');
assert.equal(dragon.baseWidthMm, 100);
assert.equal(dragon.adapterCutoutDepthMm, 100);
assert.deepEqual(decodeSettings(encodeSettings(dragon), defaults), dragon);
const pack = (data: unknown) => '2.' + Buffer.from(JSON.stringify(data)).toString('base64url');
for (const bad of ['', 'garbage', '3.e30', pack([99]), pack([0, 999, 1]), pack([0, 0, 'oops']), pack([0, 0, 1, 0, 2]), pack([0, -1, 1]), pack([0, 1])]) {
  assert.equal(decodeSettings(bad, defaults), null, bad);
}
console.table(lengths);
console.log('Share settings: legacy fixtures, all templates, changed fields, future defaults and malformed links passed.');
