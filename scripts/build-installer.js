const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");
const packager = require("electron-packager");
const pkg = require("../package.json");

const appName = "E-Pics";
const outDir = path.resolve(__dirname, "..", "dist");
const iconPngPath = path.resolve(__dirname, "..", "assets", "icons.png");
const iconPngAltPath = path.resolve(__dirname, "..", "assets", "icon.png");
const iconIcoPath = path.resolve(__dirname, "..", "assets", "icons.ico");

function findMakensis() {
  if (process.platform !== "win32") {
    return "makensis";
  }

  const whereResult = spawnSync("where", ["makensis"], {
    shell: true,
    encoding: "utf8",
  });

  if (whereResult.status === 0 && whereResult.stdout) {
    const match = whereResult.stdout.split(/\r?\n/).find((line) => line.trim());
    if (match) {
      return match.trim();
    }
  }

  const programDirs = [
    process.env["ProgramFiles"],
    process.env["ProgramFiles(x86)"],
    process.env["ProgramW6432"],
  ].filter(Boolean);

  const candidates = [];
  for (const base of programDirs) {
    candidates.push(path.join(base, "NSIS", "makensis.exe"));
    candidates.push(path.join(base, "NSIS", "Unicode", "makensis.exe"));
  }

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  return null;
}

async function buildIco() {
  if (fs.existsSync(iconIcoPath)) {
    return iconIcoPath;
  }

  const sourcePngPath = fs.existsSync(iconPngPath)
    ? iconPngPath
    : fs.existsSync(iconPngAltPath)
    ? iconPngAltPath
    : null;

  if (!sourcePngPath) {
    return undefined;
  }

  const pngToIcoModule = require("png-to-ico");
  const pngToIco = pngToIcoModule.default || pngToIcoModule.imagesToIco || pngToIcoModule;
  console.log(`Converting ${path.basename(sourcePngPath)} to assets/icons.ico for Windows packaging...`);
  const pngBuffer = fs.readFileSync(sourcePngPath);
  const icoBuffer = await pngToIco(pngBuffer);
  fs.writeFileSync(iconIcoPath, icoBuffer);
  return iconIcoPath;
}

async function main() {
  console.log("Packaging E-Pics for Windows...");

  const iconFile = await buildIco();
  if (!iconFile) {
    console.warn("Warning: No icon found at assets/icons.png, assets/icon.png, or assets/icons.ico. Packaging will continue without a custom icon.");
  }

  const appPaths = await packager({
    dir: path.resolve(__dirname, ".."),
    out: outDir,
    overwrite: true,
    platform: "win32",
    arch: "x64",
    name: appName,
    executableName: appName,
    appVersion: pkg.version,
    win32metadata: {
      CompanyName: pkg.author || "SHOPOTH",
      FileDescription: "E-Pics secure photo and video vault",
      OriginalFilename: `${appName}.exe`,
      ProductName: appName,
      ProductVersion: pkg.version,
    },
    icon: iconFile,
    ignore: [
      /^\/dist($|\/)/,
      /^\/scripts($|\/)/,
      /^\/\.git($|\/)/,
      /^\/package-lock\.json$/,
      /^\/README\.md$/,
    ],
  });

  if (!appPaths || appPaths.length === 0) {
    throw new Error("Packaging failed; no output path returned.");
  }

  console.log(`Package created in ${appPaths[0]}`);
  console.log("Compiling NSIS installer...");

  const nsisExe = findMakensis();
  if (!nsisExe) {
    console.error("makensis not found in PATH or common NSIS install directories.");
    console.error("Install NSIS or add its installation folder to PATH, then rerun npm run package:win.");
    process.exit(1);
  }

  console.log(`Using NSIS executable: ${nsisExe}`);
  const nsisScript = path.resolve(__dirname, "..", "installer.nsi");
  const result = spawnSync(nsisExe, ["/V4", nsisScript], {
    stdio: "inherit",
    cwd: path.resolve(__dirname, ".."),
  });

  if (result.error) {
    console.error("Failed to execute makensis. Ensure NSIS is installed and the executable is accessible.");
    process.exit(1);
  }

  if (result.status !== 0) {
    console.error(`makensis exited with code ${result.status}`);
    process.exit(result.status);
  }

  console.log("Installer built successfully: dist/E-Pics-Setup.exe");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
