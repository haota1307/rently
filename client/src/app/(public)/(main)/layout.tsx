import Footer from "@/app/(public)/(main)/_components/footer";
import Header from "@/app/(public)/(main)/_components/header";

const MainLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div>
      <Header />
      <div className="max-w-screen-xl mx-auto px-4 py-10">{children}</div>
      <Footer />
    </div>
  );
};

export default MainLayout;
