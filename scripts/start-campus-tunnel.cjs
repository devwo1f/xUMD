const path = require("path");
const { spawnSync, spawn } = require("child_process");

const projectRoot = process.cwd();
const patchScript = path.join(projectRoot, "scripts", "fix-expo-tunnel.cjs");
const expoCli = path.join(projectRoot, "node_modules", "expo", "bin", "cli");

const rawArgs = process.argv.slice(2);
const hasPortArg =
  rawArgs.includes("--port") ||
  rawArgs.some((arg) => arg.startsWith("--port=")) ||
  rawArgs.includes("-p");

if (hasPortArg) {
  const invalidExplicitPort = rawArgs.some((arg, index) => {
    if (arg === "--port" || arg === "-p") {
      return rawArgs[index + 1] && rawArgs[index + 1] !== "8081";
    }
    if (arg.startsWith("--port=")) {
      return arg.slice("--port=".length) !== "8081";
    }
    return false;
  });

  if (invalidExplicitPort) {
    console.error(
      "[start-campus-tunnel] Expo WS tunnel requires Metro to run on port 8081. Remove the custom port or use --port 8081."
    );
    process.exit(1);
  }
}

const patchResult = spawnSync(process.execPath, [patchScript], {
  cwd: projectRoot,
  env: process.env,
  stdio: "inherit",
});

if (patchResult.status !== 0) {
  process.exit(patchResult.status || 1);
}

const args = [expoCli, "start", "--dev-client", "--tunnel"];
if (!hasPortArg) {
  args.push("--port", "8081");
}
args.push(...rawArgs);

const child = spawn(process.execPath, args, {
  cwd: projectRoot,
  env: {
    ...process.env,
    EXPO_USE_WS_TUNNEL: "1",
  },
  stdio: "inherit",
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 0);
});

child.on("error", (error) => {
  console.error("[start-campus-tunnel] Failed to launch Expo tunnel.");
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
