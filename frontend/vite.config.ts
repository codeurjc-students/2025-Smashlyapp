import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  publicDir: path.resolve(__dirname, "../public"),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@components": path.resolve(__dirname, "./src/components"),
      "@pages": path.resolve(__dirname, "./src/pages"),
      "@hooks": path.resolve(__dirname, "./src/hooks"),
      "@utils": path.resolve(__dirname, "./src/utils"),
      "@contexts": path.resolve(__dirname, "./src/contexts"),
      "@types": path.resolve(__dirname, "./src/types"),
      "@styles": path.resolve(__dirname, "./src/styles"),
      "@assets": path.resolve(__dirname, "./src/assets"),
    },
  },
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      }
    }
  },
  build: {
    // Enable rollup output for code splitting
    rollupOptions: {
      output: {
        // Manual chunks for better caching
        manualChunks: (id) => {
          // Vendor chunks for better caching
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
              return 'react-vendor';
            }
            if (id.includes('styled-components') || id.includes('framer-motion')) {
              return 'ui-vendor';
            }
            if (id.includes('react-hot-toast') || id.includes('@tanstack/react-query')) {
              return 'utils-vendor';
            }
            if (id.includes('react-icons')) {
              return 'icons-vendor';
            }
            return 'vendor';
          }
        },
      },
    },
    // Optimize chunk size warning limit
    chunkSizeWarningLimit: 1000,
    // Enable source maps for production debugging
    sourcemap: true,
    // Minify output with esbuild (faster than terser)
    minify: 'esbuild',
    target: 'es2015',
  },
  // Optimize dependencies
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'styled-components',
      'framer-motion',
    ],
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./test/setupTests.ts"],
    coverage: {
      provider: "v8",
      reporter: ["lcov", "text", "json"],
      reportsDirectory: "./coverage",
    },
  },
});
