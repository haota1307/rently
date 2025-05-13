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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { SYSTEM_SETTING_GROUPS } from "./system-setting-constants";
import {
  allTemplates,
  SettingTemplate,
  interfaceTemplates,
  emailTemplates,
  pricingTemplates,
} from "./system-setting-templates";

type SystemSettingTemplateGalleryProps = {
  group?: string;
  onSelectTemplate: (template: SettingTemplate) => void;
  onSelect?: (template: SettingTemplate) => void;
  onClose: () => void;
};

export function SystemSettingTemplateGallery({
  group,
  onSelectTemplate,
  onSelect,
  onClose,
}: SystemSettingTemplateGalleryProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState(group || "all");

  const handleSelect = (template: SettingTemplate) => {
    if (onSelect) onSelect(template);
    else if (onSelectTemplate) onSelectTemplate(template);
  };

  // Lọc mẫu theo nhóm và từ khóa tìm kiếm
  const getFilteredTemplates = (groupName?: string): SettingTemplate[] => {
    let templates: SettingTemplate[] = [];

    if (!groupName || groupName === "all") {
      templates = [
        ...interfaceTemplates,
        ...emailTemplates,
        ...pricingTemplates,
      ];
    } else {
      templates = allTemplates[groupName as keyof typeof allTemplates] || [];
    }

    if (searchQuery) {
      return templates.filter(
        (template) =>
          template.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
          template.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
          template.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return templates;
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4">
        <h2 className="text-lg font-bold">Chọn mẫu cài đặt có sẵn</h2>
        <p className="text-sm text-muted-foreground">
          Chọn một mẫu từ danh sách dưới đây để sử dụng làm cài đặt mới
        </p>

        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Tìm kiếm mẫu..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <Tabs
        defaultValue={group || "all"}
        value={activeTab}
        onValueChange={setActiveTab}
        className="w-full"
      >
        <TabsList className="grid grid-cols-4 mb-4">
          <TabsTrigger value="all">Tất cả</TabsTrigger>
          <TabsTrigger value={SYSTEM_SETTING_GROUPS.INTERFACE}>
            Giao diện
          </TabsTrigger>
          <TabsTrigger value={SYSTEM_SETTING_GROUPS.EMAIL}>
            Mẫu Email
          </TabsTrigger>
          <TabsTrigger value={SYSTEM_SETTING_GROUPS.PRICING}>
            Giá dịch vụ
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-0">
          <TemplateGrid
            templates={getFilteredTemplates()}
            onSelectTemplate={handleSelect}
          />
        </TabsContent>

        <TabsContent value={SYSTEM_SETTING_GROUPS.INTERFACE} className="mt-0">
          <TemplateGrid
            templates={getFilteredTemplates(SYSTEM_SETTING_GROUPS.INTERFACE)}
            onSelectTemplate={handleSelect}
          />
        </TabsContent>

        <TabsContent value={SYSTEM_SETTING_GROUPS.EMAIL} className="mt-0">
          <TemplateGrid
            templates={getFilteredTemplates(SYSTEM_SETTING_GROUPS.EMAIL)}
            onSelectTemplate={handleSelect}
          />
        </TabsContent>

        <TabsContent value={SYSTEM_SETTING_GROUPS.PRICING} className="mt-0">
          <TemplateGrid
            templates={getFilteredTemplates(SYSTEM_SETTING_GROUPS.PRICING)}
            onSelectTemplate={handleSelect}
          />
        </TabsContent>
      </Tabs>

      <div className="flex justify-end">
        <Button variant="outline" onClick={onClose}>
          Hủy
        </Button>
      </div>
    </div>
  );
}

type TemplateGridProps = {
  templates: SettingTemplate[];
  onSelectTemplate: (template: SettingTemplate) => void;
};

function TemplateGrid({ templates, onSelectTemplate }: TemplateGridProps) {
  if (templates.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-muted-foreground">Không tìm thấy mẫu phù hợp</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[60vh] w-full">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4">
        {templates.map((template) => (
          <TemplateCard
            key={template.key}
            template={template}
            onClick={() => onSelectTemplate(template)}
          />
        ))}
      </div>
    </ScrollArea>
  );
}

type TemplateCardProps = {
  template: SettingTemplate;
  onClick: () => void;
};

function TemplateCard({ template, onClick }: TemplateCardProps) {
  // Format giá trị hiển thị theo loại
  const formatValue = (template: SettingTemplate): string => {
    if (template.type === "file") {
      return "Tệp tin";
    }

    if (template.group === SYSTEM_SETTING_GROUPS.EMAIL) {
      return "HTML Email Template";
    }

    if (template.value.length > 50) {
      return template.value.substring(0, 50) + "...";
    }

    return template.value;
  };

  // Xác định nhóm để hiển thị nhãn
  const getGroupLabel = (groupName: string): string => {
    switch (groupName) {
      case SYSTEM_SETTING_GROUPS.INTERFACE:
        return "Giao diện";
      case SYSTEM_SETTING_GROUPS.EMAIL:
        return "Email";
      case SYSTEM_SETTING_GROUPS.PRICING:
        return "Giá dịch vụ";
      default:
        return groupName;
    }
  };

  return (
    <Card
      className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
      onClick={onClick}
    >
      <CardHeader className="p-4">
        <CardTitle className="text-base">{template.label}</CardTitle>
        <CardDescription className="line-clamp-1">
          {template.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="text-sm text-muted-foreground mb-2">
          <span className="font-medium">Key: </span>
          <code className="bg-gray-100 px-1 rounded">{template.key}</code>
        </div>
        <div className="text-sm line-clamp-2">{formatValue(template)}</div>
      </CardContent>
      <CardFooter className="p-4 pt-0 flex justify-between items-center">
        <div className="text-xs px-2 py-1 bg-gray-100 rounded-full">
          {getGroupLabel(template.group)}
        </div>
        <Button size="sm" variant="secondary">
          Chọn
        </Button>
      </CardFooter>
    </Card>
  );
}
