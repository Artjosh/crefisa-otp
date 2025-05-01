/** @type {import('next').NextConfig} */
const NodePolyfillPlugin = require('node-polyfill-webpack-plugin');

const nextConfig = {
  serverExternalPackages: ["firebase-admin"],
  staticPageGenerationTimeout: 1000,
  webpack: (config, { isServer }) => {
    // Para ambiente de servidor, adicionar externals para evitar problemas com polyfills
    if (isServer) {
      config.externals = [...(config.externals || []), 'firebase-admin'];
      return config;
    }
    
    // Para o client-side, adicionamos os polyfills necessários
    config.plugins.push(new NodePolyfillPlugin({
      excludeAliases: ['console']
    }));
    
    // Adicionar manualmente fallbacks para módulos do Node
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
      child_process: false,
      process: require.resolve('process/browser'),
    };
    
    // Adicionar alias para módulos node:*
    config.resolve.alias = {
      ...config.resolve.alias,
      'node:process': require.resolve('process/browser'),
      'node:buffer': require.resolve('buffer'),
      'node:util': require.resolve('util/'),
      'node:url': require.resolve('url/'),
      'node:stream': require.resolve('stream-browserify'),
      'node:zlib': require.resolve('browserify-zlib'),
      'node:path': require.resolve('path-browserify'),
      'node:crypto': require.resolve('crypto-browserify'),
      'node:http': require.resolve('stream-http'),
      'node:https': require.resolve('https-browserify'),
      'node:os': require.resolve('os-browserify/browser'),
      'node:constants': require.resolve('constants-browserify')
    };
    
    // Adicionar os providers globais
    const webpack = require('webpack');
    config.plugins.push(
      new webpack.ProvidePlugin({
        process: 'process/browser',
        Buffer: ['buffer', 'Buffer'],
      }),
    );
    
    return config;
  },
}

module.exports = nextConfig 