/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      // Desarrollo en GitHub Codespaces. Sustituir por el dominio PANIA al publicar.
      allowedOrigins: ['*.app.github.dev', 'localhost:3000'],
    },
  },
};
export default nextConfig;

import('@opennextjs/cloudflare').then(m => m.initOpenNextCloudflareForDev());
