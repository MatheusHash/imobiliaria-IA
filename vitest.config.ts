import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "node",
    include: ["**/*.test.ts"],
    exclude: ["node_modules", ".next"],
    // Regra do projeto: console.info descrevendo cada teste, aplicada a todo teste atual
    // e futuro sem precisar de código em cada arquivo — ver vitest.setup.ts. O reporter
    // padrão do Vitest esconde stdout de testes que passam; "verbose" é o que faz esses
    // console.info aparecerem de fato ao rodar `npm run test`.
    setupFiles: ["./vitest.setup.ts"],
    reporters: ["verbose"]
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, ".")
    }
  }
});
