import { defineConfig, type Plugin } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

// Stub for figma:asset virtual modules (handled by Figma Make's own plugin at runtime)
function figmaAssetStubPlugin(): Plugin {
  const prefix = '\0figma-asset:';
  return {
    name: 'figma-asset-stub',
    enforce: 'pre',
    resolveId(id) {
      if (id.startsWith('figma:asset/')) return prefix + id;
    },
    load(id) {
      if (id.startsWith(prefix)) return 'export default ""';
    },
  };
}

export default defineConfig({
  plugins: [
    // The React and Tailwind plugins are both required for Make, even if
    // Tailwind is not being actively used – do not remove them
    react(),
    tailwindcss(),
    figmaAssetStubPlugin(),
  ],
  resolve: {
    alias: {
      // Alias @ to the src directory
      '@': path.resolve(__dirname, './src'),
    },
  },

  // File types to support raw imports. Never add .css, .tsx, or .ts files to this.
  assetsInclude: ['**/*.svg', '**/*.csv'],
})
