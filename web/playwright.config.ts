import { defineConfig, devices } from "@playwright/test";

// E2E só local (decisão da Fatia 1): precisa do Supabase local de pé (`supabase start`)
// e do web/.env.local apontando para ele.
const PORTA = 3100;

export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [["list"], ["html", { open: "never" }]],
  globalSetup: "./tests/e2e/preparar.ts",
  globalTeardown: "./tests/e2e/limpar.ts",
  use: {
    baseURL: `http://localhost:${PORTA}`,
    storageState: "tests/e2e/.sessao.json",
    trace: "retain-on-failure",
    locale: "pt-BR",
    timezoneId: "America/Sao_Paulo",
  },
  projects: [
    // Celular primeiro: 360 px de largura, como o app é pensado.
    { name: "celular", use: { ...devices["Pixel 7"], viewport: { width: 360, height: 780 } } },
  ],
  webServer: {
    command: `pnpm build && pnpm start --port ${PORTA}`,
    url: `http://localhost:${PORTA}/entrar`,
    reuseExistingServer: true,
    timeout: 240_000,
  },
});
