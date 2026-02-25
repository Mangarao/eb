const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');
const path = require('path');

/**
 * Metro configuration
 * Configure axios to use browser build instead of Node.js build
 * https://reactnative.dev/docs/metro
 *
 * @type {import('metro-config').MetroConfig}
 */
const config = {
  resolver: {
    resolverMainFields: ['react-native', 'browser', 'main'],
    resolveRequest: (context, moduleName, platform) => {
      // Force axios to use browser build
      if (moduleName === 'axios' || moduleName.startsWith('axios/')) {
        return {
          filePath: path.resolve(__dirname, 'node_modules/axios/dist/esm/axios.js'),
          type: 'sourceFile',
        };
      }
      // Default resolver
      return context.resolveRequest(context, moduleName, platform);
    },
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
