import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    // A área de usuários passou a se chamar "corretores"; mantém links antigos funcionando.
    return [{ source: "/admin/usuarios/:path*", destination: "/admin/corretores/:path*", permanent: true }];
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "plus.unsplash.com" },
      { protocol: "https", hostname: "placehold.co" }
    ]
  }
};

export default nextConfig;