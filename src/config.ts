import {
  getDestination,
  getExternal,
  getFormat,
  getInject,
  getLoader,
  getPolyfills,
  getTarget,
} from "./project";
import { type CliOption } from "./command";
import { clean } from "./fs";
import type { BuildOptions, Plugin } from "esbuild";
import { nodeExternalsPlugin } from "esbuild-node-externals";
import { progress } from "./plugins/progress";
import { run } from "./plugins/run";
import { tsCheckPlugin } from "./plugins/typescript";
import { isCurrentPath } from "./path";
import { getOutputFilename } from "./utils";

export type ConfigOption = BuildOptions;
export type { Plugin };

export async function createConfig(filename: string, option: CliOption) {
  const [dir, ext] = getDestination();
  if (!option.grace) {
    option.killSignal = "SIGKILL";
  }
  if (isCurrentPath(dir)) {
    option.clean = false;
  }

  if (option.clean) {
    clean(dir);
  }
  const format = getFormat();

  const polyfills = await getPolyfills(option);
  const external = getExternal();

  const plugins: Plugin[] = [...polyfills];

  plugins.push(
    nodeExternalsPlugin({
      allowList: external.include,
    })
  );

  if (option.watch) {
    if (!option.ignoreTypes) {
      plugins.push(tsCheckPlugin());
    }
    plugins.push(progress({ dist: dir, clear: option.reset }));
  }

  if (option.run) {
    if (option.run === true) {
      option.run = getOutputFilename(filename, dir, ext);
    }

    const nodeOptions = option.nodeOptions?.split(" ") ?? [];

    option.import?.forEach((x) => {
      nodeOptions.push("--import", getOutputFilename(x, dir, ext));
    });

    plugins.push(
      run({
        nodeOptions,
        filename: option.run,
        killSignal: option.killSignal,
      })
    );
  }

  const entryPoints = [filename];
  if (option.import) {
    entryPoints.push(...option.import);
  }

  const config: ConfigOption = {
    entryPoints,
    bundle: true,
    inject: getInject(),
    target: getTarget(),
    platform: "node",
    outExtension: { ".js": ext },
    format,
    outdir: dir,
    minify: option.minify,
    sourcemap: option.sourcemap,
    tsconfig: option.tsconfig,
    metafile: true,
    plugins,
    loader: getLoader(),
  };

  if (config.format === "esm") {
    config.splitting = true;
  }

  return config;
}
