import { defineConfig } from "tsup";

// eslint-disable-next-line import/no-default-export
export default defineConfig({
  entry: ["src/node.ts"],
  format: ["cjs", "esm"], // Build for commonJS and ESmodules
  // Generate declaration file (.d.ts)
  experimentalDts: {
    // resolve: true,
    compilerOptions: {
      module: "NodeNext",
      moduleResolution: "nodenext",
    },
  },
  splitting: false,
  sourcemap: true,
  clean: true,
  treeshake: true,
});
