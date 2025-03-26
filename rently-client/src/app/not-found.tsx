import React from "react";

const Custom404 = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white px-4">
      <div className="text-center max-w-md w-full space-y-6">
        <h1 className="text-9xl font-extrabold text-white mb-4 animate-bounce">
          404
        </h1>

        <div className="bg-white/10 p-6 rounded-lg border border-white/20">
          <h2 className="text-2xl font-semibold mb-4">Trang không tồn tại</h2>
          <p className="text-gray-300 mb-6">
            Có vẻ như trang bạn đang tìm kiếm không tồn tại. Hãy quay lại trang!
            chủ
          </p>
        </div>

        <div className="flex justify-center space-x-4 pt-6">
          <a
            href="/"
            className="inline-flex items-center justify-center px-6 py-3 border border-white text-white hover:bg-white/10 rounded-lg transition-colors duration-300"
          >
            Về trang chủ
          </a>
        </div>
      </div>
    </div>
  );
};

export default Custom404;
