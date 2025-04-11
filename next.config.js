/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    CESIUM_BASE_URL: '/cesium/',
  },
  // Simplified approach without copy-webpack-plugin
  // Add this to avoid build errors with Cesium's third party libraries
  transpilePackages: ['cesium'],
};

module.exports = nextConfig; 