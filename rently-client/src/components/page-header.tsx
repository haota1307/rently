import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import Link from "next/link";

interface PageHeaderProps {
  title: string;
  description?: string;
}

export function PageHeader({ title, description }: PageHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white mb-2 relative">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-gray-900 via-gray-700 to-gray-800 dark:from-white dark:via-gray-100 dark:to-gray-300">
            {title}
          </span>
          <span className="absolute -bottom-1 left-0 w-20 h-1 bg-gradient-to-r from-gray-400 to-gray-300 dark:from-gray-500 dark:to-gray-700 rounded-full"></span>
        </h1>
        {description && (
          <p className="text-muted-foreground mt-1 text-gray-600 dark:text-gray-400 max-w-2xl leading-relaxed">
            {description}
          </p>
        )}
      </div>
      {/* <Link href="/dang-tin">
        <Button className="w-full md:w-auto">
          <PlusCircle className="mr-2 h-4 w-4" />
          Đăng tin
        </Button>
      </Link> */}
    </div>
  );
}
