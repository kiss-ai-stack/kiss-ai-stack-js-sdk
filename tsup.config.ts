import { defineConfig } from "tsup";

export default defineConfig({
    entry: ["src/index.ts"],
    outDir: "dist",
    target: "ESNext",
    format: ["esm", "cjs"],
    dts: true,
    splitting: false,
    clean: true
});
