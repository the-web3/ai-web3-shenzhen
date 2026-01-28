/** @type {import(next).NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  basePath: "/web",
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://127.0.0.1:8080/api/:path*",
      },
      {
        source: "/v1/:path*",
        destination: "http://127.0.0.1:8000/v1/:path*",
      },
    ];
  },
};

module.exports = nextConfig;
