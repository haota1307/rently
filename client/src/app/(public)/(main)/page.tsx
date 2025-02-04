import Body from "@/app/(public)/(main)/_components/body";

export default function Home() {
  return (
    <div className="w-full h-full">
      <div className="flex flex-col items-center justify-center">
        <h1 className="text-2xl font-semibold capitalize">
          Cho thuê phòng trọ gần Trường Đại học Nam Cần Thơ
        </h1>
        <div className="w-full mx-4 my-6">
          <Body />
        </div>
      </div>
    </div>
  );
}
