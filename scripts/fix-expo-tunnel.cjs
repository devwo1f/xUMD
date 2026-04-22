const fs = require("fs");
const path = require("path");

const projectRoot = process.cwd();

function replaceOnce(contents, from, to, label, filePath, already) {
  if ((already && contents.includes(already)) || contents.includes(to)) {
    return { contents, changed: false, status: `already patched: ${label}` };
  }

  if (!contents.includes(from)) {
    throw new Error(
      `Could not find expected snippet for "${label}" in ${filePath}`
    );
  }

  return {
    contents: contents.replace(from, to),
    changed: true,
    status: `patched: ${label}`,
  };
}

function patchFile(relativePath, replacers) {
  const filePath = path.join(projectRoot, relativePath);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Missing file to patch: ${filePath}`);
  }

  let contents = fs.readFileSync(filePath, "utf8");
  const statuses = [];
  let changed = false;

  for (const replacer of replacers) {
    const result = replaceOnce(
      contents,
      replacer.from,
      replacer.to,
      replacer.label,
      filePath,
      replacer.already
    );
    contents = result.contents;
    statuses.push(result.status);
    changed = changed || result.changed;
  }

  if (changed) {
    fs.writeFileSync(filePath, contents, "utf8");
  }

  return { filePath, statuses, changed };
}

const jobs = [
  {
    relativePath: "node_modules/expo/node_modules/@expo/cli/build/src/start/server/BundlerDevServer.js",
    replacers: [
      {
        label: "allow EXPO_USE_WS_TUNNEL override",
        from: "        this.tunnel = (0, _env.envIsWebcontainer)() ? new _AsyncWsTunnel.AsyncWsTunnel(this.projectRoot, port) : new _AsyncNgrok.AsyncNgrok(this.projectRoot, port);\n",
        to: "        const shouldUseWsTunnel = (0, _env.envIsWebcontainer)() || process.env.EXPO_USE_WS_TUNNEL === '1' || process.env.EXPO_USE_WS_TUNNEL === 'true';\n        this.tunnel = shouldUseWsTunnel ? new _AsyncWsTunnel.AsyncWsTunnel(this.projectRoot, port) : new _AsyncNgrok.AsyncNgrok(this.projectRoot, port);\n",
        already:
          "const shouldUseWsTunnel = (0, _env.envIsWebcontainer)() || process.env.EXPO_USE_WS_TUNNEL === '1' || process.env.EXPO_USE_WS_TUNNEL === 'true';",
      },
    ],
  },
  {
    relativePath: "node_modules/@expo/ngrok/src/client.js",
    replacers: [
      {
        label: "defensive ngrok error extraction helper",
        from: "  }\n\n  async request(method, path, options = {}) {\n",
        to: "  }\n\n  getErrorBody(error) {\n    const rawBody =\n      error?.response?.body ??\n      (Buffer.isBuffer(error?.response?.rawBody)\n        ? error.response.rawBody.toString(\"utf8\")\n        : error?.response?.rawBody?.toString?.()) ??\n      error?.body ??\n      error?.message ??\n      \"Unknown ngrok error\";\n\n    if (typeof rawBody === \"string\") {\n      try {\n        return JSON.parse(rawBody);\n      } catch {\n        return rawBody;\n      }\n    }\n\n    return rawBody;\n  }\n\n  async request(method, path, options = {}) {\n",
        already: "  getErrorBody(error) {\n",
      },
      {
        label: "defensive request error handling",
        from: "    } catch (error) {\n      let clientError;\n      try {\n        const response = JSON.parse(error.response.body);\n        clientError = new NgrokClientError(\n          response.msg,\n          error.response,\n          response\n        );\n      } catch (e) {\n        clientError = new NgrokClientError(\n          error.response.body,\n          error.response,\n          error.response.body\n        );\n      }\n      throw clientError;\n    }\n",
        to: "    } catch (error) {\n      const body = this.getErrorBody(error);\n      const message =\n        body && typeof body === \"object\" && body.msg\n          ? body.msg\n          : typeof body === \"string\"\n            ? body\n            : JSON.stringify(body);\n      throw new NgrokClientError(message, error?.response, body);\n    }\n",
        already: "throw new NgrokClientError(message, error?.response, body);",
      },
      {
        label: "defensive booleanRequest error handling",
        from: "    } catch (error) {\n      const response = JSON.parse(error.response.body);\n      throw new NgrokClientError(response.msg, error.response, response);\n    }\n",
        to: "    } catch (error) {\n      const body = this.getErrorBody(error);\n      const message =\n        body && typeof body === \"object\" && body.msg\n          ? body.msg\n          : typeof body === \"string\"\n            ? body\n            : JSON.stringify(body);\n      throw new NgrokClientError(message, error?.response, body);\n    }\n",
        already: "const body = this.getErrorBody(error);",
      },
    ],
  },
  {
    relativePath: "node_modules/@expo/ngrok/src/utils.js",
    replacers: [
      {
        label: "retry local ngrok API startup race",
        from: "function isRetriable(err) {\n  if (!err.response) {\n    return false;\n  }\n  const statusCode = err.response.statusCode;\n  const body = err.body;\n  const notReady500 = statusCode === 500 && /panic/.test(body);\n  const notReady502 =\n    statusCode === 502 &&\n    body.details &&\n    body.details.err === \"tunnel session not ready yet\";\n  const notReady503 =\n    statusCode === 503 &&\n    body.details &&\n    body.details.err ===\n      \"a successful ngrok tunnel session has not yet been established\";\n  return notReady500 || notReady502 || notReady503;\n}\n",
        to: "function isRetriable(err) {\n  if (!err.response) {\n    return err?.code === \"ECONNREFUSED\";\n  }\n  const statusCode = err.response.statusCode;\n  const body = err.body;\n  const bodyText =\n    typeof body === \"string\" ? body : body?.msg ?? JSON.stringify(body ?? \"\");\n  const detailsErr =\n    body && typeof body === \"object\" && body.details ? body.details.err : null;\n  const notReady500 = statusCode === 500 && /panic/.test(bodyText);\n  const notReady502 =\n    statusCode === 502 && detailsErr === \"tunnel session not ready yet\";\n  const notReady503 =\n    statusCode === 503 &&\n    detailsErr ===\n      \"a successful ngrok tunnel session has not yet been established\";\n  return notReady500 || notReady502 || notReady503;\n}\n",
        already: "return err?.code === \"ECONNREFUSED\";",
      },
    ],
  },
];

try {
  for (const job of jobs) {
    const result = patchFile(job.relativePath, job.replacers);
    for (const status of result.statuses) {
      console.log(`[fix-expo-tunnel] ${status} (${job.relativePath})`);
    }
  }
} catch (error) {
  console.error("[fix-expo-tunnel] Failed to patch Expo tunnel support.");
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
