const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

let html = fs.readFileSync(path.resolve(__dirname, '../test-scope.html'), 'utf8');
// Remove any external <script src="..."> tags so jsdom doesn't fetch/execute CDN scripts
html = html.replace(/<script\s+[^>]*src=["'][^"']*["'][^>]*><\/script>/gmi, '');
const bundle = fs.readFileSync(path.resolve(__dirname, '../..', 'bundles', 'nexus-ux.js'), 'utf8');

(async () => {
  const dom = new JSDOM(html, { runScripts: 'dangerously', resources: 'usable' });
  const { window } = dom;
  // Inject a minimal document environment
  // Inject the built bundle as a module script so ESM syntax (export) is accepted
  const scriptEl = window.document.createElement('script');
  scriptEl.type = 'module';
  scriptEl.textContent = bundle + '\nwindow.__nexus_ready = true;';
  window.document.head.appendChild(scriptEl);

  // Wait for microtasks and mutations
  await new Promise((r) => setTimeout(r, 200));

  // Serialize resulting HTML for inspection
  console.log(window.document.body.innerHTML);
})();
