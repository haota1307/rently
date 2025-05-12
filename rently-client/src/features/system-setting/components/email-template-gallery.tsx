"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { EmailTemplate } from "../system-setting.api";
import { useGetEmailTemplates } from "../useSystemSetting";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Mail } from "lucide-react";
import { Code } from "@/components/ui/code";

type EmailTemplateGalleryProps = {
  onSelectTemplate: (template: EmailTemplate) => void;
  onClose: () => void;
};

export function EmailTemplateGallery({
  onSelectTemplate,
  onClose,
}: EmailTemplateGalleryProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const { data: templates, isLoading, error } = useGetEmailTemplates();

  // Lọc mẫu theo từ khóa tìm kiếm
  const filteredTemplates = templates
    ? templates.filter(
        (template) =>
          template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          template.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
          template.fileName.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  if (error) {
    return (
      <div className="space-y-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Lỗi</AlertTitle>
          <AlertDescription>
            Không thể tải mẫu email từ server. Vui lòng thử lại sau.
          </AlertDescription>
        </Alert>
        <div className="flex justify-end">
          <Button variant="outline" onClick={onClose}>
            Đóng
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          <h2 className="text-lg font-bold">Chọn mẫu email từ server</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Sử dụng các mẫu email từ server để đảm bảo tính nhất quán và dễ dàng
          cập nhật
        </p>

        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Tìm kiếm mẫu email..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array(3)
            .fill(0)
            .map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-40 w-full" />
              </div>
            ))}
        </div>
      ) : filteredTemplates.length > 0 ? (
        <ScrollArea className="h-[400px]">
          <div className="grid grid-cols-1 gap-4 pb-4">
            {filteredTemplates.map((template) => (
              <EmailTemplateCard
                key={template.name}
                template={template}
                onClick={() => onSelectTemplate(template)}
              />
            ))}
          </div>
        </ScrollArea>
      ) : (
        <div className="text-center py-10">
          <p className="text-muted-foreground">
            Không tìm thấy mẫu email phù hợp
          </p>
        </div>
      )}

      <div className="flex justify-end">
        <Button variant="outline" onClick={onClose}>
          Hủy
        </Button>
      </div>
    </div>
  );
}

type EmailTemplateCardProps = {
  template: EmailTemplate;
  onClick: () => void;
};

function EmailTemplateCard({ template, onClick }: EmailTemplateCardProps) {
  const [showPreview, setShowPreview] = useState(false);

  // Hiển thị phần đầu của email template
  const previewContent = template.content
    .split("\n")
    .slice(0, 10)
    .join("\n")
    .substring(0, 200);

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <CardHeader className="p-4">
        <div className="flex justify-between items-center">
          <CardTitle className="text-base flex items-center gap-2">
            {template.name}
            <Badge variant="outline" className="ml-1 text-xs">
              {template.fileName}
            </Badge>
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowPreview(!showPreview)}
          >
            {showPreview ? "Ẩn code" : "Xem code"}
          </Button>
        </div>
        <CardDescription>Email template từ server</CardDescription>
      </CardHeader>

      <CardContent className="p-4 pt-0">
        {showPreview ? (
          <Code language="tsx" className="text-xs max-h-[200px] overflow-auto">
            {previewContent}...
          </Code>
        ) : (
          <div className="bg-gray-50 p-3 rounded-md border">
            <p className="text-sm text-muted-foreground">{template.key}</p>
          </div>
        )}
      </CardContent>

      <CardFooter className="p-4 pt-0 flex justify-end">
        <Button onClick={onClick}>Sử dụng mẫu này</Button>
      </CardFooter>
    </Card>
  );
}
