import { defineConfig, loadEnv } from 'vite';
import { readdirSync, watch } from 'node:fs';
import { resolve, join } from 'node:path';
import { spawn } from 'node:child_process';

function pageEntries() {
  const entries = {
    main: resolve(__dirname, 'index.html'),
    learn: resolve(__dirname, 'learn.html'),
    quals: resolve(__dirname, 'quals.html'),
    graph: resolve(__dirname, 'graph.html'),
  };
  try {
    const files = readdirSync(resolve(__dirname, 'pages'));
    files.forEach((p) => {
      if (!p.endsWith('.html')) return;
      const name = 'lesson_' + p.replace('.html', '').replace(/[^a-zA-Z0-9]/g, '_');
      entries[name] = resolve(__dirname, 'pages', p);
    });
  } catch (e) {
    // pages/ dir doesn't exist yet, skip
  }
  return entries;
}

export default defineConfig(({ mode }) => {
  // base: set VITE_BASE=/repo-name/ for GitHub Pages project subpath,
  // or VITE_BASE=/ for user pages (username.github.io) and dev.
  // Default: auto-detect from env or root.
  const env = loadEnv(mode, process.cwd(), '');
  const base = env.VITE_BASE || '/';
  return {
    base,
    build: {
      rollupOptions: {
        input: pageEntries(),
        output: {
          manualChunks(id) {
            if (id.includes('/katex/')) return 'vendor-katex';
            if (id.includes('/p5/')) return 'vendor-p5';
          },
        },
      },
    },
    server: {
      open: true,
    },
    plugins: [
      {
        name: 'content-watch-regen',
        configureServer(server) {
          const contentDir = resolve(__dirname, 'content');
          let running = false;
          let pending = false;
          const regen = () => {
            const proc = spawn('python', ['scripts/gen_lessons.py'], { cwd: __dirname, shell: process.platform === 'win32' });
            proc.on('close', (code) => {
              running = false;
              if (pending) {
                pending = false;
                regen();
                return;
              }
              if (code === 0) {
                const pages = resolve(__dirname, 'pages');
                for (const mod of server.moduleGraph.fileToModulesMap.keys()) {
                  if (mod.startsWith(pages)) server.moduleGraph.invalidateModule(server.moduleGraph.getModuleById(mod));
                }
                server.ws.send({ type: 'full-reload' });
              }
            });
          };
          try {
            watch(contentDir, { recursive: true }, () => {
              if (running) {
                pending = true;
                return;
              }
              running = true;
              regen();
            });
          } catch (e) {
            console.warn('[content-watch] 无法监听 content/', e.message);
          }
        },
      },
    ],
  };
});
