/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    // Design assets in /public are not content-hashed: when an asset changes,
    // give it a new file name rather than relying on cache expiry.
    return [
      {
        source: "/assets/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=2592000, stale-while-revalidate=86400" }],
      },
    ];
  },
};

export default nextConfig;
