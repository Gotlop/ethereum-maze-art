/** @type {import('next').NextConfig} */
const nextConfig = {
  rewrites: () => [
    {
      source: "/",
      destination: "/api",
    },
  ],
};

export default nextConfig;
