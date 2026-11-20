import { spawn } from "node:child_process";
import { cpSync, existsSync } from "node:fs";
import { join, resolve } from "node:path";

const standaloneDirectory = resolve(".next/standalone");
const serverPath = join(standaloneDirectory, "server.js");
const staticDirectory = resolve(".next/static");
const standaloneStaticDirectory = join(standaloneDirectory, ".next/static");

if (!existsSync(serverPath) || !existsSync(staticDirectory)) {
  throw new Error("La compilación standalone de Next.js no está disponible.");
}

cpSync(staticDirectory, standaloneStaticDirectory, { recursive: true });

const publicDirectory = resolve("public");
if (existsSync(publicDirectory)) {
  cpSync(publicDirectory, join(standaloneDirectory, "public"), {
    recursive: true,
  });
}

const server = spawn(process.execPath, [serverPath], {
  cwd: standaloneDirectory,
  env: process.env,
  stdio: "inherit",
});

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => server.kill(signal));
}

server.once("exit", (code) => {
  process.exitCode = code ?? 1;
});
