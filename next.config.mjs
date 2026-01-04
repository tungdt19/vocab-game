/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  basePath: "/vocab-game",
  images: {
    unoptimized: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
}

export default nextConfig
