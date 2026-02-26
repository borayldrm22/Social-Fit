#!/usr/bin/env node
/**
 * Patches expo-constants EXConstants.podspec so the iOS script phase works when
 * the project path contains spaces (e.g. "Social Fit"). The script path and
 * PROJECT_ROOT must be quoted in the generated shell script.
 */
const fs = require('fs');
const path = require('path');

const podspecPath = path.join(
  __dirname,
  '..',
  'node_modules',
  'expo',
  'node_modules',
  'expo-constants',
  'ios',
  'EXConstants.podspec'
);

if (!fs.existsSync(podspecPath)) {
  console.warn('[patch-expo-constants-podspec] EXConstants.podspec not found, skipping');
  process.exit(0);
}

let content = fs.readFileSync(podspecPath, 'utf8');

// 1) Quote PROJECT_ROOT so "Social Fit" doesn't break the assignment
const oldEnvLine = "env_vars = ENV['PROJECT_ROOT'] ? \"PROJECT_ROOT=#{ENV['PROJECT_ROOT']} \" : \"\"";
const newEnvLine = "env_vars = ENV['PROJECT_ROOT'] ? \"PROJECT_ROOT='#{ENV['PROJECT_ROOT']}' \" : \"\"";
if (content.includes(oldEnvLine)) {
  content = content.replace(oldEnvLine, newEnvLine);
}

// 2) Quote the script path so $PODS_TARGET_SRCROOT/../scripts/... is one token when path has spaces.
//    Use single quotes around the bash -c argument so the outer shell (sh) does not expand
//    the variable; bash then receives "$PODS_TARGET_SRCROOT/../scripts/get-app-config-ios.sh"
//    and expands it as one path (handles spaces).
// Ruby output: bash -l -c '"$PODS_TARGET_SRCROOT/../scripts/get-app-config-ios.sh"' (inner " escaped in podspec as \")
const scriptNew = ":script => \"bash -l -c '\\\"$PODS_TARGET_SRCROOT/../scripts/get-app-config-ios.sh\\\"'\",";
const scriptPattern = /:script => "bash -l -c .*get-app-config-ios\.sh.*",/;
if (scriptPattern.test(content)) {
  content = content.replace(scriptPattern, scriptNew);
}

fs.writeFileSync(podspecPath, content);
console.log('[patch-expo-constants-podspec] Patched EXConstants.podspec for paths with spaces');
