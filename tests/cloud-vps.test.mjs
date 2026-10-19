import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');

test('all four execution modes have corresponding cards and accessible tabs', () => {
  const modes = ['local', 'remote', 'cloud', 'vps'];
  for (const mode of modes) {
    assert.match(html, new RegExp('<article class="half ' + mode + '"'));
    assert.match(html, new RegExp('data-pick="' + mode + '"'));
    assert.match(html, new RegExp('id="tab-' + mode + '"[^>]+role="tab"[^>]+data-mode="' + mode + '"'));
  }
  assert.match(html, /const tabs = \[\.\.\.document\.querySelectorAll\('\[data-mode\]'\)\]/);
  assert.match(html, /const data = modes\[mode\]/);
});

test('Cloud VPS is explicitly distinct from hosted cloud and never pretends to connect', () => {
  assert.match(html, /04 \/ CLOUD VPS/);
  assert.match(html, /vps: \{kicker:'BRING YOUR OWN CLOUD VPS'/);
  assert.match(html, /unlike managed cloud, you maintain the VPS/);
  assert.match(html, /No VPS is provisioned or contacted/);
  assert.doesNotMatch(html, /type="password"|name="ssh-password"/);
});

test('mobile and web offer remote and cloud VPS but no on-device local mode', () => {
  for (const platform of ['iPhone &amp; iPad', 'Android', 'Web']) {
    const match = html.match(new RegExp('<h3>' + platform + '<\\/h3>([\\s\\S]*?)<\\/article>'));
    assert.ok(match, 'Missing platform: ' + platform);
    assert.match(match[1], /Remote control/);
    assert.match(match[1], /Cloud VPS/);
    assert.doesNotMatch(match[1], /<span class="chip">Local<\\/span>/);
  }
  for (const platform of ['Linux', 'macOS', 'Windows']) {
    const match = html.match(new RegExp('<h3>' + platform + '<\\/h3>([\\s\\S]*?)<\\/article>'));
    assert.ok(match, 'Missing platform: ' + platform);
    assert.match(match[1], /<span class="chip">Local<\\/span>/);
    assert.match(match[1], /Cloud VPS/);
  }
});

test('four-mode tab navigation continues to support arrow keys, Home and End', () => {
  assert.match(html, /next=\(i\+1\)%tabs\.length/);
  assert.match(html, /next=\(i\+tabs\.length-1\)%tabs\.length/);
  assert.match(html, /event\.key==='Home'/);
  assert.match(html, /event\.key==='End'/);
});
