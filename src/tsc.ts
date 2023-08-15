import { execaNode as node } from "execa";

export const tscPath = () => {
  return process.versions.pnp
    ? require.resolve("./typescript.js")
    : require.resolve("typescript/lib/tsc.js");
};

interface TSCOptions {
  watch?: boolean;
  config?: string;
}
export function tsc(opt: TSCOptions) {
  const p = tscPath();
  const args = ["--noEmit", "--pretty"];
  if (opt.config) {
    args.push("-p " + opt.config);
  }
  if (opt.watch) {
    args.push("--watch");
  }

  const subprocess = node(p, args, {
    shell: true,
    stderr: process.stderr,
    stdin: process.stdin,
    env: process.env,
  });
  return subprocess.stdout!;
}
