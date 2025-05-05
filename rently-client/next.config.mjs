/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "qr.sepay.vn",
      },
    ],
  },

  // Bỏ qua lỗi ESLint trong quá trình build
  eslint: {
    // Bỏ qua hoàn toàn việc kiểm tra ESLint trong quá trình build
    ignoreDuringBuilds: true,
  },

  // Bỏ qua lỗi TypeScript
  typescript: {
    // !! CẢNH BÁO !!
    // Có thể dẫn đến lỗi tiềm ẩn khi runtime
    // nếu mã của bạn có lỗi TypeScript.
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
