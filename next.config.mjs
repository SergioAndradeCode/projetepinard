/** @type {import('next').NextConfig} */

const securityHeaders = [
  // Forcer HTTPS pendant 2 ans sur tous les sous-domaines (RGPD art. 32 — chiffrement en transit)
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  // Empêcher le clickjacking (intégrité de l'interface utilisateur)
  {
    key: 'X-Frame-Options',
    value: 'DENY',
  },
  // Empêcher le MIME-type sniffing (vecteur XSS)
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  // Limiter les informations transmises dans le header Referer
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  // Désactiver les fonctionnalités navigateur non utilisées
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
  },
  // Protection XSS navigateurs anciens
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block',
  },
  // Empêcher les iframes cross-origin non autorisées (COEP)
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on',
  },
]

const nextConfig = {
  transpilePackages: ['recharts'],
  serverExternalPackages: ['exceljs', '@napi-rs/canvas'],
  experimental: {
    serverActions: {
      allowedOrigins: ['localhost:3000', 'localhost:3001', 'localhost:3002', 'talenth.fr', 'www.talenth.fr'],
    },
  },
  webpack(config, { isServer }) {
    if (isServer) {
      config.externals = [...(config.externals ?? []), '@napi-rs/canvas']
    }
    return config
  },
  async headers() {
    return [
      {
        // Appliquer les headers de sécurité sur toutes les routes
        source: '/:path*',
        headers: securityHeaders,
      },
    ]
  },
};

export default nextConfig;
