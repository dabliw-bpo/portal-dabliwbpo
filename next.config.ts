import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // A arte dos dados bancários lê a fonte do disco na hora de gerar o PNG, e o
  // rastreador não enxerga um caminho montado em tempo de execução.
  outputFileTracingIncludes: {
    "/api/empresas/**": ["src/assets/fonts/**/*"],
  },
};

export default nextConfig;
