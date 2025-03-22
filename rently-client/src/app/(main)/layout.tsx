import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { ChatProvider } from "@/features/chatbot/components/chatbot-context";
import { ChatbotWidget } from "@/features/chatbot/components/chatbot-widget";

const MainLayout = ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) => {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <ChatProvider>
        <main className="flex w-full">{children}</main>
        <ChatbotWidget />
      </ChatProvider>
      <Footer />
    </div>
  );
};

export default MainLayout;
