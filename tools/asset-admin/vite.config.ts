import { defineConfig } from 'vite';

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
  server: {
    port: 5180,
    strictPort: true,
    open: '/tools/asset-admin/index.html',
  },
});
