module.exports = {
  reactStrictMode: true,
  productionBrowserSourceMaps: true,
  webpack: (config) => {
    config.cache.buildDependencies.mydeps = ["./node_modules/@bastion-multisig/multisig-tx/lib/multisigClient.js"]
    return config;
  }
};
