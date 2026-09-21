/** @type {import('next').NextConfig} */
const isSitesBuild = process.env.SITES_BUILD === '1';

const nextConfig = {
  reactStrictMode: true,
  ...(isSitesBuild ? { output: 'export', trailingSlash: true } : {}),
};

export default nextConfig;
