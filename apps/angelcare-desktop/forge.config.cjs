"use strict";

const path = require("node:path");
const { FusesPlugin } = require("@electron-forge/plugin-fuses");
const { FuseV1Options, FuseVersion } = require("@electron/fuses");

const root = __dirname;
const assets = path.join(root, "assets");
const hasAppleSigning = Boolean(process.env.APPLE_SIGNING_IDENTITY);
const hasAppleNotarization = Boolean(process.env.APPLE_ID && process.env.APPLE_APP_SPECIFIC_PASSWORD && process.env.APPLE_TEAM_ID);
const hasWindowsCertificate = Boolean(process.env.WINDOWS_CERTIFICATE_FILE && process.env.WINDOWS_CERTIFICATE_PASSWORD);
const timestampServer = process.env.WINDOWS_TIMESTAMP_SERVER || "http://timestamp.digicert.com";

module.exports = {
  packagerConfig: {
    name: "ANGELCARE Desktop",
    executableName: "ANGELCARE Desktop",
    appBundleId: "com.angelcare.desktop",
    appCategoryType: "public.app-category.business",
    appCopyright: `Copyright © ${new Date().getFullYear()} ANGELCARE. All rights reserved.`,
    icon: path.join(assets, "icon"),
    asar: true,
    prune: true,
    overwrite: true,
    extendInfo: {
      CFBundleDisplayName: "ANGELCARE Desktop",
      CFBundleName: "ANGELCARE Desktop",
      NSMicrophoneUsageDescription: "ANGELCARE Desktop utilise le microphone uniquement lorsque l’utilisateur initie un appel ou un message vocal dans WhatsApp Web.",
      NSCameraUsageDescription: "ANGELCARE Desktop utilise la caméra uniquement lorsque l’utilisateur initie une action vidéo dans WhatsApp Web.",
      NSDownloadsFolderUsageDescription: "ANGELCARE Desktop enregistre les téléchargements WhatsApp autorisés dans un dossier gouverné.",
    },
    ignore: [
      /^\/\.env(?:\..+)?$/,
      /^\/out(?:\/|$)/,
      /^\/\.webpack(?:\/|$)/,
      /^\/docs(?:\/|$)/,
      /^\/scripts(?:\/|$)/,
      /^\/release(?:\/|$)/,
      /^\/README\.md$/,
    ],
    osxSign: hasAppleSigning ? {
      identity: process.env.APPLE_SIGNING_IDENTITY,
      hardenedRuntime: true,
      entitlements: path.join(assets, "entitlements.mac.plist"),
      entitlementsInherit: path.join(assets, "entitlements.mac.plist"),
      signatureFlags: "library",
    } : undefined,
    osxNotarize: hasAppleNotarization ? {
      appleId: process.env.APPLE_ID,
      appleIdPassword: process.env.APPLE_APP_SPECIFIC_PASSWORD,
      teamId: process.env.APPLE_TEAM_ID,
    } : undefined,
    windowsSign: hasWindowsCertificate ? {
      certificateFile: process.env.WINDOWS_CERTIFICATE_FILE,
      certificatePassword: process.env.WINDOWS_CERTIFICATE_PASSWORD,
      timestampServer,
    } : undefined,
  },
  rebuildConfig: {},
  makers: [
    { name: "@electron-forge/maker-zip", platforms: ["darwin"], config: {} },
    {
      name: "@electron-forge/maker-squirrel",
      platforms: ["win32"],
      config: {
        name: "ANGELCAREDesktop",
        authors: "ANGELCARE",
        description: "Production-hardened ANGELCARE SaaS desktop runtime with governed WhatsApp Web.",
        setupExe: "ANGELCARE Desktop Setup.exe",
        setupIcon: path.join(assets, "icon.ico"),
        iconUrl: undefined,
        certificateFile: hasWindowsCertificate ? process.env.WINDOWS_CERTIFICATE_FILE : undefined,
        certificatePassword: hasWindowsCertificate ? process.env.WINDOWS_CERTIFICATE_PASSWORD : undefined,
        noMsi: true,
      },
    },
  ],
  plugins: [
    new FusesPlugin({
      version: FuseVersion.V1,
      resetAdHocDarwinSignature: process.platform === "darwin" && process.arch === "arm64" && !hasAppleSigning,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableCookieEncryption]: true,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
      [FuseV1Options.OnlyLoadAppFromAsar]: true,
      [FuseV1Options.LoadBrowserProcessSpecificV8Snapshot]: true,
      [FuseV1Options.GrantFileProtocolExtraPrivileges]: false,
    }),
  ],
};
