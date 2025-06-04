import { SubscriptionGuard } from "@/features/landlord-subscription/components/subscription-guard";

interface ChoThueLayoutProps {
  children: React.ReactNode;
}

export default function ChoThueLayout({ children }: ChoThueLayoutProps) {
  return <SubscriptionGuard>{children}</SubscriptionGuard>;
}
