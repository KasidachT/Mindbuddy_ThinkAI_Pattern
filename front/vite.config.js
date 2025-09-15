import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { viteStaticCopy } from 'vite-plugin-static-copy';

export default defineConfig(({ command, mode }) => {
  // ถ้าเป็น dev mode (npm run dev) ใช้ config ง่าย ๆ
  if (command === 'serve' || mode === 'development') {
    return {
      base: '/',  // absolute path สำหรับ dev server
      plugins: [
        react(),
        tailwindcss()
      ],
      define: {
        global: 'globalThis'  // คงไว้ถ้าจำเป็นสำหรับ React
      },
      server: {
        open: true  // auto เปิด browser
      }
    };
  }

  // ถ้าเป็น build mode (npm run build) ใช้ extension config
  return {
    base: './',  // relative path สำหรับ unpacked extension
    plugins: [
      react(),
      tailwindcss(),
      viteStaticCopy({
        targets: [
          { src: 'public/*', dest: '.' }  // copy manifest.json ไป dist/
        ]
      })
    ],
    build: {
      outDir: 'dist',
      rollupOptions: {
        input: {
          popup: 'index.html'  // entry สำหรับ popup
        },
        output: {
          entryFileNames: 'assets/[name].[hash].js',
          chunkFileNames: 'assets/[name].[hash].js',
          assetFileNames: 'assets/[name].[hash].[ext]'
        }
      }
    },
    define: {
      global: 'globalThis'
    }
  };
});