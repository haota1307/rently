"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { SystemSetting } from "@/features/system-setting/system-setting.api";
import { useCreateSetting, useUpdateSetting } from "../useSystemSetting";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { SystemSettingTemplateGallery } from "./system-setting-template-gallery";
import { EmailTemplateGallery } from "./email-template-gallery";
import { SettingTemplate } from "./system-setting-templates";
import {
  LibrarySquare,
  Mail,
  HelpCircle,
  Info,
  Loader2,
  AlertCircle,
  Maximize2,
  Minimize2,
  X,
} from "lucide-react";
import {
  SYSTEM_SETTING_GROUPS,
  SYSTEM_SETTING_TYPE_LABELS,
  SYSTEM_SETTING_GROUP_LABELS,
} from "./system-setting-constants";
import { ImageUpload } from "./image-upload";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";

// Component hiển thị editor toàn màn hình
const FullscreenEditor = ({
  value,
  onChange,
  onClose,
  type,
}: {
  value: string;
  onChange: (value: string) => void;
  onClose: () => void;
  type: string;
}) => {
  return (
    <div className="fixed inset-0 bg-background z-50 flex flex-col p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Chỉnh sửa giá trị</h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onClose}>
            <Minimize2 className="h-4 w-4 mr-2" />
            Thu nhỏ
          </Button>
          <Button variant="destructive" size="sm" onClick={onClose}>
            <X className="h-4 w-4 mr-2" />
            Đóng
          </Button>
        </div>
      </div>
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 font-mono text-sm p-4 resize-none"
        placeholder={
          type === "json"
            ? '{ "key": "value" }'
            : type === "boolean"
              ? "true hoặc false"
              : "Nhập giá trị cài đặt"
        }
      />
    </div>
  );
};

const formSchema = z.object({
  key: z.string().min(1, "Vui lòng nhập khóa"),
  value: z.string().min(1, "Vui lòng nhập giá trị"),
  type: z.string().min(1, "Vui lòng chọn loại"),
  group: z.string().min(1, "Vui lòng chọn nhóm"),
  description: z.string().optional(),
});

type SystemSettingFormProps = {
  initialData?: SystemSetting;
  initialGroup?: string;
  onSuccess?: () => void;
};

export function SystemSettingForm({
  initialData,
  initialGroup,
  onSuccess,
}: SystemSettingFormProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [showTemplateGallery, setShowTemplateGallery] = useState(false);
  const [showEmailTemplates, setShowEmailTemplates] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const { mutateAsync: createSetting, isPending: isCreating } =
    useCreateSetting();
  const { mutateAsync: updateSetting, isPending: isUpdating } =
    useUpdateSetting();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      key: "",
      value: "",
      type: "string",
      group: initialGroup || SYSTEM_SETTING_GROUPS.INTERFACE,
      description: "",
    },
  });

  const currentGroup = form.watch("group");
  const currentType = form.watch("type");
  const currentKey = form.watch("key");
  const currentValue = form.watch("value");

  const isEmailGroup = currentGroup === SYSTEM_SETTING_GROUPS.EMAIL;
  const isImageSetting =
    currentGroup === SYSTEM_SETTING_GROUPS.INTERFACE &&
    currentType === "string" &&
    (currentKey === "site_logo" ||
      currentKey === "site_favicon" ||
      currentKey === "hero_image");

  useEffect(() => {
    if (initialData) {
      setIsEditing(true);
      form.reset({
        key: initialData.key,
        value: initialData.value,
        type: initialData.type,
        group: initialData.group,
        description: initialData.description || "",
      });
    } else if (initialGroup) {
      form.setValue("group", initialGroup);
    }
  }, [initialData, initialGroup, form]);

  // Đảm bảo các Select components hiển thị đúng giá trị khi edit
  useEffect(() => {
    if (isEditing && initialData) {
      // Đảm bảo các Select components hiển thị đúng giá trị
      form.setValue("type", initialData.type);
      form.setValue("group", initialData.group);
    }
  }, [isEditing, initialData, form]);

  const handleImageUploaded = (imageUrl: string) => {
    form.setValue("value", imageUrl);
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      if (isEditing) {
        await updateSetting({
          key: initialData!.key,
          data: {
            value: values.value,
            type: values.type,
            group: values.group,
            description: values.description,
          },
        });
      } else {
        await createSetting({
          key: values.key,
          value: values.value,
          type: values.type,
          group: values.group,
          description: values.description,
        });
        form.reset();
      }

      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.message ||
        "Đã xảy ra lỗi. Vui lòng thử lại sau.";
      toast.error(errorMessage);
    }
  };

  const handleSelectTemplate = (template: SettingTemplate) => {
    form.setValue("key", template.key);
    form.setValue("value", template.value);
    form.setValue("type", template.type);
    form.setValue("group", template.group);
    form.setValue("description", template.description);
    setShowTemplateGallery(false);
    toast.success("Đã áp dụng mẫu thành công");
  };

  // Hàm kiểm tra xem form có thay đổi so với giá trị ban đầu không
  const hasFormChanged = () => {
    if (isEditing && initialData) {
      const formValues = form.getValues();
      return (
        formValues.value !== initialData.value ||
        formValues.type !== initialData.type ||
        formValues.group !== initialData.group ||
        formValues.description !== (initialData.description || "")
      );
    }
    return true;
  };

  return (
    <div className="w-full mx-auto">
      <div className="space-y-4">
        {!isEditing && (
          <div className="flex justify-between items-center mb-4">
            <div className="space-y-1">
              <h2 className="text-lg font-semibold">Thêm cài đặt mới</h2>
              <p className="text-sm text-muted-foreground">
                Nhập thông tin để tạo cài đặt hệ thống mới
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowTemplateGallery(true)}
                className="flex items-center gap-2"
                size="sm"
              >
                <LibrarySquare className="w-4 h-4" />
                <span className="hidden sm:inline">Chọn từ mẫu</span>
              </Button>
              {isEmailGroup && (
                <Button
                  variant="outline"
                  onClick={() => setShowEmailTemplates(true)}
                  className="flex items-center gap-2"
                  size="sm"
                >
                  <Mail className="w-4 h-4" />
                  <span className="hidden sm:inline">Chọn từ mẫu email</span>
                </Button>
              )}
            </div>
          </div>
        )}

        {isEditing && (
          <Alert variant="default" className="bg-blue-50 border-blue-200 mb-4">
            <AlertCircle className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              Bạn đang chỉnh sửa cài đặt{" "}
              <span className="font-medium">{initialData?.key}</span>
            </AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Card className="border shadow-sm">
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <h3 className="text-sm font-medium flex items-center gap-2 mb-2">
                    <Info className="h-4 w-4 text-primary" />
                    Thông tin cơ bản
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="key"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-1">
                            Khóa
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                                </TooltipTrigger>
                                <TooltipContent side="top">
                                  <p className="max-w-xs">
                                    Định danh duy nhất cho cài đặt này. Không
                                    thể thay đổi sau khi tạo.
                                  </p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Nhập khóa cài đặt. vd: site_logo"
                              {...field}
                              disabled={isEditing}
                              autoComplete="off"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Mô tả</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Mô tả ngắn về cài đặt (tùy chọn)"
                              {...field}
                              autoComplete="off"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Loại dữ liệu</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Chọn loại dữ liệu" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {Object.entries(SYSTEM_SETTING_TYPE_LABELS).map(
                                ([value, label]) => (
                                  <SelectItem key={value} value={value}>
                                    {label}
                                  </SelectItem>
                                )
                              )}
                            </SelectContent>
                          </Select>
                          <FormDescription className="text-xs">
                            Định dạng dữ liệu của cài đặt này
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="group"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nhóm cài đặt</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Chọn nhóm cài đặt" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {Object.entries(SYSTEM_SETTING_GROUP_LABELS).map(
                                ([value, label]) => (
                                  <SelectItem key={value} value={value}>
                                    {label}
                                  </SelectItem>
                                )
                              )}
                            </SelectContent>
                          </Select>
                          <FormDescription className="text-xs">
                            Phân loại cài đặt này thuộc nhóm nào
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border shadow-sm">
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <h3 className="text-sm font-medium flex items-center gap-2 mb-2">
                    <Info className="h-4 w-4 text-primary" />
                    Giá trị cài đặt
                  </h3>

                  <FormField
                    control={form.control}
                    name="value"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center justify-between">
                          <span>Giá trị</span>
                          {!isImageSetting && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => setIsFullscreen(true)}
                              className="h-8 px-2 text-xs"
                            >
                              <Maximize2 className="h-3.5 w-3.5 mr-1" />
                              Mở rộng
                            </Button>
                          )}
                        </FormLabel>
                        {isImageSetting ? (
                          <div className="space-y-4">
                            <ImageUpload
                              currentValue={field.value}
                              imageType={
                                currentKey as
                                  | "site_logo"
                                  | "site_favicon"
                                  | "hero_image"
                              }
                              onImageUploaded={handleImageUploaded}
                            />
                            <div>
                              <FormControl>
                                <Input
                                  placeholder="URL hình ảnh"
                                  {...field}
                                  className="text-xs font-mono"
                                  autoComplete="off"
                                />
                              </FormControl>
                            </div>
                          </div>
                        ) : (
                          <FormControl>
                            <Textarea
                              placeholder={
                                currentType === "json"
                                  ? '{ "key": "value" }'
                                  : currentType === "boolean"
                                    ? "true hoặc false"
                                    : "Nhập giá trị cài đặt"
                              }
                              className="min-h-[300px] max-h-[600px] font-mono text-sm resize-y"
                              {...field}
                            />
                          </FormControl>
                        )}
                        <FormDescription className="text-xs">
                          {currentType === "json" && "Nhập giá trị JSON hợp lệ"}
                          {currentType === "boolean" &&
                            "Nhập 'true' hoặc 'false'"}
                          {currentType === "number" && "Nhập giá trị số"}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="submit"
                disabled={
                  isCreating || isUpdating || (isEditing && !hasFormChanged())
                }
                className="min-w-[100px]"
              >
                {isCreating || isUpdating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {isEditing ? "Đang cập nhật..." : "Đang tạo..."}
                  </>
                ) : isEditing ? (
                  "Cập nhật"
                ) : (
                  "Tạo mới"
                )}
              </Button>
            </div>
          </form>
        </Form>

        <Dialog
          open={showTemplateGallery}
          onOpenChange={setShowTemplateGallery}
        >
          <DialogContent className="w-[95vw] max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogTitle>Chọn mẫu cài đặt</DialogTitle>
            <SystemSettingTemplateGallery
              onSelectTemplate={handleSelectTemplate}
              onSelect={handleSelectTemplate}
              onClose={() => setShowTemplateGallery(false)}
            />
          </DialogContent>
        </Dialog>

        <Dialog open={showEmailTemplates} onOpenChange={setShowEmailTemplates}>
          <DialogContent className="w-[95vw] max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogTitle>Chọn mẫu email từ server</DialogTitle>
            <EmailTemplateGallery
              onSelectTemplate={(template) => {
                form.setValue("value", template.content);
                form.setValue("key", template.key);
                form.setValue("type", "file");
                form.setValue(
                  "description",
                  `Mẫu email ${template.name} (React Email Component)`
                );
                setShowEmailTemplates(false);
                toast.success("Đã áp dụng mẫu email thành công");
              }}
              onSelect={(template) => {
                form.setValue("value", template.content);
                form.setValue("key", template.key);
                form.setValue("type", "file");
                form.setValue(
                  "description",
                  `Mẫu email ${template.name} (React Email Component)`
                );
                setShowEmailTemplates(false);
                toast.success("Đã áp dụng mẫu email thành công");
              }}
              onClose={() => setShowEmailTemplates(false)}
            />
          </DialogContent>
        </Dialog>

        {/* Hiển thị editor toàn màn hình khi cần */}
        {isFullscreen && (
          <FullscreenEditor
            value={form.getValues().value}
            onChange={(value) => form.setValue("value", value)}
            onClose={() => setIsFullscreen(false)}
            type={currentType}
          />
        )}
      </div>
    </div>
  );
}
