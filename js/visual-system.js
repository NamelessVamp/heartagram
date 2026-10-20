// HEARTAGRAM Visual System V1: global atmosphere and ceremonial empty states.


function installAtmosphere() {
  if (!document.querySelector('.visual-atmosphere')) {
    const layer = document.createElement('div');
    layer.className = 'visual-atmosphere';
    layer.setAttribute('aria-hidden', 'true');
    document.body.prepend(layer);
  }
  if (!document.querySelector('.visual-corner-mark')) {
    const mark = document.createElement('div');
    mark.className = 'visual-corner-mark';
    mark.textContent = 'HEARTAGRAM // FOR ADRI // LOCAL SIGNAL';
    mark.setAttribute('aria-hidden', 'true');
    document.body.append(mark);
  }
}

function decorateHome() {
  const header = document.querySelector('.home-header');
  if (!header || header.querySelector('.visual-home-sigil')) return;
  const note = document.createElement('p');
  note.className = 'visual-home-note';
  note.textContent = 'made for player two ✦';
  const orbit = document.createElement('div');
  orbit.className = 'visual-home-orbit';
  orbit.innerHTML = '<span class="visual-orbit-ring visual-orbit-ring-a"></span><span class="visual-orbit-ring visual-orbit-ring-b"></span><span class="visual-orbit-core">♡</span><span class="visual-orbit-star">✦</span>';
  orbit.setAttribute('aria-hidden', 'true');
  header.append(note, orbit);
}

function decorateScreenLabels() {
  const labels = [
    ['.discover-header', 'DISCOVERY // FOR ADRI'],
    ['.catalog-screen-header', 'GAME ARCHIVE // SWITCH'],
    ['.collection-header', 'SAVED SIGNALS // YOUR LIST'],
  ];
  for (const [selector, text] of labels) {
    const host = document.querySelector(selector);
    if (!host || host.querySelector('.visual-module-label')) continue;
    const label = document.createElement('p');
    label.className = 'visual-module-label';
    label.textContent = text;
    host.prepend(label);
  }
}

function installVisualSystem() {
  installAtmosphere();
  decorateHome();
  decorateScreenLabels();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', installVisualSystem, { once: true });
} else {
  installVisualSystem();
}
