// Micro-viz system: extra interactive canvases stacked below the main sketch.
// Content authors drop `<div class="mini-viz" data-demo="demo-id"></div>`
// anywhere in a lesson's content to declare a demo. This module collects all
// declared demos and renders each as a small p5 canvas in the LEFT sketch
// column, below the main canvas + lesson nav — giving "one lesson, many tools".
import p5 from 'p5';

const demos = {};

export function registerDemo(id, factory) {
  demos[id] = factory;
}

function boot() {
  const sketchCol = document.querySelector('.sketch-col');
  if (!sketchCol) return;

  // collect declared demos from content (mini-viz markers are not rendered in place)
  const declared = [];
  document.querySelectorAll('.mini-viz').forEach((el) => {
    const id = el.dataset.demo;
    if (id && demos[id] && declared.indexOf(id) === -1) declared.push(id);
    el.remove(); // remove the in-content marker (rendered in the left column instead)
  });
  if (declared.length === 0) return;

  // group container in the left column, below the lesson nav
  const wrap = document.createElement('div');
  wrap.className = 'micro-viz-panel';
  const title = document.createElement('div');
  title.className = 'micro-viz-title';
  title.textContent = '🔍 本节可动手探索';
  wrap.appendChild(title);

  declared.forEach((id) => {
    const host = document.createElement('div');
    host.className = 'micro-viz-host';
    wrap.appendChild(host);
    demos[id](host);
  });

  sketchCol.appendChild(wrap);
}

// Demos wrap p5 inside a host div
const demosLazy = {};
export function registerDemoHosted(id, factory) {
  demos[id] = (host) => {
    const container = document.createElement('div');
    container.className = 'mini-viz';
    host.appendChild(container);
    new p5((p) => factory(p, container));
  };
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
