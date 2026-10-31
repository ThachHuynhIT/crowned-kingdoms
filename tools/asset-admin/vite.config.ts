import { defineConfig, type Plugin } from 'vite';

/** Đường dẫn ngắn: /admin → kho asset, /admin/map → dựng bản đồ. */
const shortAdminRoutes = (): Plugin => ({
  name: 'short-admin-routes',
  configureServer(server) {
    server.middlewares.use((req: { url?: string }, _res: unknown, next: () => void) => {
      const path = (req.url ?? '').split('?')[0]?.replace(/\/+$/, '');
      if (path === '/admin') req.url = '/tools/asset-admin/index.html';
      else if (path === '/admin/map') req.url = '/tools/asset-admin/map.html';
      next();
    });
  },
});

const repositoryUrl = new URL('../..', import.meta.url);
// URL Windows có dạng /D:/...; bỏ dấu / đầu để Vite nhận đúng ổ đĩa.
const repositoryPath = decodeURIComponent(repositoryUrl.pathname);
const repositoryRoot = repositoryUrl.hostname
  ? '//' + repositoryUrl.hostname + repositoryPath
  : repositoryPath[2] === ':' ? repositoryPath.slice(1) : repositoryPath;

export default defineConfig({
  // Phục vụ URL /public/... trong manifest từ gốc repo.
  root: repositoryRoot,
  publicDir: false,
  plugins: [shortAdminRoutes()],
  server: {
    port: 5180,
    strictPort: true,
    open: '/admin',
  },
});
