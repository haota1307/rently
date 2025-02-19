import Filters from "@/app/(public)/(main)/_components/filters";
import Listings from "@/components/listings/listings";

const Body = () => {
  return (
    <div className="w-full flex flex-col items-center justify-center">
      <Filters />
      <div className="mt-10 w-full">
        <Listings />
      </div>
    </div>
  );
};

export default Body;
