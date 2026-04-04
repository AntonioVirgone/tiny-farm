const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const coreRoot = path.resolve(projectRoot, '..', 'src', 'core');

const config = getDefaultConfig(projectRoot);

// Guarda solo src/core (non l'intera workspace)
config.watchFolders = [coreRoot];

// Risoluzione moduli: solo mobile/node_modules
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
];

// Alias @core → ../src/core (condiviso con web)
config.resolver.extraNodeModules = {
  '@core': coreRoot,
};

module.exports = config;
