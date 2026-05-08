/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow larger image payloads when we add API routes later
  // (For now we don't need it — all uploads are client-side)

  // Optional but recommended for this kind of app:

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'sdk.photoroom.com',
      },
    ],
  },
  // Future-proof: increase serverless function timeout if we add backend routes
  experimental: {
    // (optional) helps with large canvas exports
  },
}

module.exports = nextConfig