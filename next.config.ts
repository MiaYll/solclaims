import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin();

const nextConfig = withNextIntl({
  typescript: {
    ignoreBuildErrors: true,  // 添加这行
  },
  eslint: {
    ignoreDuringBuilds: true,  // 添加这行
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
        port: '',
        pathname: '/**',
      },
    ],
  }
});
export default nextConfig;

