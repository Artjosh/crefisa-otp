/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
  // Remover output: 'export' para permitir API routes dinâmicas
  // output: 'export', 
  // distDir: 'out',
}

export default nextConfig
