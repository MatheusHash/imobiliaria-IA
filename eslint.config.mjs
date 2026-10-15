import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// eslint-config-next ainda publica configs no formato legado (eslintrc); FlatCompat faz
// a ponte para o flat config do ESLint 9.
const compat = new FlatCompat({
  baseDirectory: __dirname
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: ["playwright-report/**", "test-results/**", ".next/**", "node_modules/**"]
  }
];

export default eslintConfig;
