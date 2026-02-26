// Node 18 lacks Array.prototype.toReversed (ES2023); Metro's mergeConfig uses it
if (typeof Array.prototype.toReversed !== 'function') {
  Array.prototype.toReversed = function () { return this.slice().reverse(); };
}

const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

module.exports = config;
