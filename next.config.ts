import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["postgres", "drizzle-orm", "dicom-parser"],
  outputFileTracingIncludes: {
    "/api/v1/imaging-studies/[id]/file": ["./fixtures/dicom/**/*"],
    "/api/v1/appointments/[id]/imaging-study": ["./fixtures/dicom/**/*"],
  },
  transpilePackages: [
    "@cornerstonejs/core",
    "@cornerstonejs/dicom-image-loader",
  ],
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        os: false,
      };
    }
    return config;
  },
};

export default nextConfig;
