import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode, command }) => {
  const env = { ...loadEnv(mode, process.cwd(), ''), ...process.env };
  // Only explicitly public configuration enters the browser bundle. Never expose server secrets.
  const publicNames = ['REACT_APP_SUPABASE_URL', 'REACT_APP_SUPABASE_ANON_KEY', 'NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY', 'REACT_APP_ACCESS_MODE', 'REACT_APP_TEMPLATE_SOURCE_MODE', 'REACT_APP_USE_MOCK_AUTH', 'REACT_APP_STORY_QUERY_TIMEOUT_MS', 'NEXT_PUBLIC_STORY_QUERY_TIMEOUT_MS'];
  const define = Object.fromEntries(publicNames.map(name => [`process.env.${name}`, env[name] === undefined ? 'undefined' : JSON.stringify(env[name])]));
  define['process.env.PUBLIC_URL'] = JSON.stringify('');
  return {
    plugins: [react(), {
      name: 'digitimes-development-csp',
      apply: 'serve',
      transformIndexHtml(html) {
        return html.replace("script-src 'self';", "script-src 'self' 'nonce-digitimes-development';")
          .replace("connect-src 'self'", "connect-src 'self' ws://localhost:3000 ws://127.0.0.1:3000");
      },
    }],
    // Vite's refresh preamble needs a nonce in development; production stays self-only.
    html: command === 'serve' ? { cspNonce: 'digitimes-development' } : undefined,
    define,
    build: { outDir: 'build', target: ['es2020', 'safari14'], emptyOutDir: true },
    server: { strictPort: true },
  };
});
