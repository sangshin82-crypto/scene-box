/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // sharp(네이티브 libvips)를 webpack 번들에 넣지 않고 node_modules에서 그대로 로드한다.
  // 번들하면 Vercel 서버리스 함수 트레이싱이 libvips .so(libvips-cpp.so)를 포함하지 못해
  // 런타임에 ERR_DLOPEN_FAILED(cannot open shared object file)로 /api/pallet-estimate 가 죽는다.
  experimental: {
    serverComponentsExternalPackages: ['sharp'],
  },
};

export default nextConfig;

