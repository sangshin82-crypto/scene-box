/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // sharp(네이티브 libvips)를 webpack 번들에 넣지 않고 node_modules에서 그대로 로드한다.
  // 번들하면 Vercel 서버리스 함수 트레이싱이 libvips .so(libvips-cpp.so)를 포함하지 못해
  // 런타임에 ERR_DLOPEN_FAILED(cannot open shared object file)로 /api/pallet-estimate 가 죽는다.
  experimental: {
    serverComponentsExternalPackages: ['sharp'],
    // external 처리만으론 nft가 libvips .so(계산 경로로 dlopen)를 못 따라가는 경우가 있어,
    // /api/pallet-estimate 함수 번들에 sharp 네이티브 바인딩 + libvips 공유 라이브러리를 명시 포함한다.
    // Vercel은 linux-x64만 설치하므로 그 경로만 매칭됨(로컬 Windows에선 매칭 0개 → 무시).
    outputFileTracingIncludes: {
      '/api/pallet-estimate': [
        './node_modules/@img/sharp-linux-x64/**',
        './node_modules/@img/sharp-libvips-linux-x64/**',
      ],
    },
  },
};

export default nextConfig;

