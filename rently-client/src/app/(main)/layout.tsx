import { Footer } from "@/components/footer";
import { Header } from "@/components/header";

const MainLayout = ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) => {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex">{children}</main>
      <Footer />
    </div>
  );
};

export default MainLayout;
