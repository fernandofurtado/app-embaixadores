/**
 * ═══════════════════════════════════════════════════════════════
 *  Custom HTML — PWA meta tags, manifest link, and service worker
 *  Only used for web (expo-router web export)
 * ═══════════════════════════════════════════════════════════════
 */

import { ScrollViewStyleReset } from 'expo-router/html';
import type { PropsWithChildren } from 'react';

export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="pt-BR">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, shrink-to-fit=no, viewport-fit=cover"
        />

        {/* ═══ PWA Meta Tags ═══ */}
        <meta name="theme-color" content="#E33431" />
        <meta name="background-color" content="#0A0F1E" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Embaixadores" />
        <meta name="description" content="Rede de Embaixadores — Junte-se a nós. Faça parte da mudança." />

        {/* ═══ PWA Manifest ═══ */}
        <link rel="manifest" href="/manifest.json" />

        {/* ═══ PWA Icons ═══ */}
        <link rel="icon" type="image/png" sizes="192x192" href="/icons/icon-192.png" />
        <link rel="apple-touch-icon" sizes="192x192" href="/icons/icon-192.png" />

        {/* Disable body scrolling on web — React Native handles scroll */}
        <ScrollViewStyleReset />

        {/* Responsiveness base */}
        <style dangerouslySetInnerHTML={{ __html: responsiveCSS }} />
      </head>
      <body>
        {children}

        {/* ═══ Service Worker Registration ═══ */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js')
                    .then(function(reg) {
                      console.log('[PWA] Service Worker registrado:', reg.scope);
                    })
                    .catch(function(err) {
                      console.warn('[PWA] Service Worker falhou:', err);
                    });
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}

const responsiveCSS = `
  body {
    overflow: hidden;
    margin: 0;
    padding: 0;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
  #root {
    display: flex;
    flex: 1;
    height: 100dvh;
  }
`;
