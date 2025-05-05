import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { ChatbotWidget } from "@/features/chatbot/components/chatbot-widget";

const MainLayout = ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) => {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex w-full">{children}</main>
      <ChatbotWidget />
      <Footer />
    </div>
  );
};

export default MainLayout;
