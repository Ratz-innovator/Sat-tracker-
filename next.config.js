/** @type {import('next').NextConfig} */
const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');

const nextConfig = {
  env: {
    CESIUM_BASE_URL: '/cesium/',
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Client-side only
      config.plugins.push(
        new CopyWebpackPlugin({
          patterns: [
            {
              from: path.join(
                path.dirname(require.resolve('cesium')),
                'Build/Cesium'
              ),
              to: path.join('public', 'cesium'),
            },
          ],
        })
      );
    }

    return config;
  },
  // Add this to avoid build errors with Cesium's third party libraries
  transpilePackages: ['cesium'],
};

module.exports = nextConfig; 