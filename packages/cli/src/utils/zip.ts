// @ts-check
/*! cross-zip. MIT License. Feross Aboukhadijeh <https://feross.org/opensource> */

import { ChildProcess, execSync } from "node:child_process";
import fs from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

const isWindows = process.platform === "win32";

/**
 * Cross-platform sync zip utility that works on Windows and Unix-like systems.
 * It uses the `zip` command on Unix-like systems and PowerShell on Windows.
 * It throws an error if the `zip` command is not available on Unix-like systems.
 */
export function zip(inPath: string, outPath: fs.PathLike): void {
  let _InPath = inPath;

  if (isWindows) {
    if (fs.statSync(inPath).isFile()) {
      const inFile = fs.readFileSync(inPath);
      const tmpPath = path.join(tmpdir(), `cross-zip-${Date.now()}`);
      fs.mkdirSync(tmpPath);
      fs.writeFileSync(path.join(tmpPath, path.basename(inPath)), inFile);
      _InPath = tmpPath;
    }
    fs.rmdirSync(outPath, { recursive: true, maxRetries: 3 });
  }

  const cwd = path.dirname(_InPath);
  const zipCmd = getZipCommand();
  const zipCmdArgs = getZipArgs(_InPath, outPath);
  try {
    execSync([zipCmd, ...zipCmdArgs].join(" "), {
      cwd,
      maxBuffer: Infinity,
      encoding: "utf8",
    });
  } catch (error) {
    if (error instanceof ChildProcess) {
      console.error("STDOUT:", error.stdout);
      console.error("STDERR:", error.stderr);
    }
    throw error;
  }
}

// Unzip function to extract files from a zip archive

function getZipCommand(): string {
  if (isWindows) {
    return "powershell.exe";
  }
  return "zip";
}

function getZipArgs(inPath: fs.PathLike, outPath: fs.PathLike): string[] {
  if (isWindows) {
    return [
      "-nologo",
      "-noprofile",
      "-command",
      '& { param([String]$myInPath, [String]$myOutPath); Add-Type -A "System.IO.Compression.FileSystem"; [IO.Compression.ZipFile]::CreateFromDirectory($myInPath, $myOutPath); exit !$? }',
      "-myInPath",
      quotePath(inPath),
      "-myOutPath",
      quotePath(outPath),
    ];
  }

  const dirname = path.basename(inPath.toString());
  return ["-r", "-y", outPath.toString(), dirname];
}

function quotePath(pathToTransform: fs.PathLike): string {
  return `"${pathToTransform.toString()}"`;
}
