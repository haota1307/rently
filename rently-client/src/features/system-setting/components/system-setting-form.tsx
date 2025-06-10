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
import { LibrarySquare, Mail } from "lucide-react";
import { SYSTEM_SETTING_GROUPS } from "./system-setting-constants";
import { ImageUpload } from "./image-upload";

const formSchema = z.object({
  key: z.string().min(1, "Vui lòng nhập khóa"),
  value: z.string().min(1, "Vui lòng nhập giá trị"),
  type: z.string().min(1, "Vui lòng chọn loại"),
  group: z.string().min(1, "Vui lòng chọn nhóm"),
  description: z.string().optional(),
});

type SystemSettingFormProps = {
  initialData?: SystemSetting;
  onSuccess?: () => void;
};

export function SystemSettingForm({
  initialData,
  onSuccess,
}: SystemSettingFormProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [showTemplateGallery, setShowTemplateGallery] = useState(false);
  const [showEmailTemplates, setShowEmailTemplates] = useState(false);

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
      group: "interface",
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
    }
  }, [initialData, form]);

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
        toast.success("Cập nhật cài đặt thành công");
      } else {
        await createSetting({
          key: values.key,
          value: values.value,
          type: values.type,
          group: values.group,
          description: values.description,
        });
        toast.success("Thêm cài đặt thành công");
        form.reset();
      }

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      toast.error("Đã xảy ra lỗi. Vui lòng thử lại sau.");
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

  return (
    <div className="py-2 pb-4 w-full mx-auto">
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-bold">
            {isEditing ? "Cập nhật cài đặt" : "Thêm cài đặt mới"}
          </h2>
          {!isEditing && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowTemplateGallery(true)}
                className="flex items-center gap-2"
              >
                <LibrarySquare className="w-4 h-4" />
                <span>Chọn từ mẫu</span>
              </Button>
              {isEmailGroup && (
                <Button
                  variant="outline"
                  onClick={() => setShowEmailTemplates(true)}
                  className="flex items-center gap-2"
                >
                  <Mail className="w-4 h-4" />
                  <span>Chọn từ mẫu email server</span>
                </Button>
              )}
            </div>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          {isEditing
            ? "Chỉnh sửa thông tin cài đặt hệ thống"
            : "Nhập thông tin để tạo cài đặt hệ thống mới"}
        </p>
      </div>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-4 max-h-[70vh] overflow-y-auto pr-2"
        >
          <FormField
            control={form.control}
            name="key"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Khóa</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Nhập khóa cài đặt. vd: site_logo"
                    {...field}
                    disabled={isEditing}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="value"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Giá trị</FormLabel>
                {isImageSetting ? (
                  <>
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
                    <div className="mt-2">
                      <FormControl>
                        <Input
                          placeholder="URL hình ảnh"
                          {...field}
                          className="text-xs font-mono"
                        />
                      </FormControl>
                    </div>
                  </>
                ) : (
                  <FormControl>
                    <Textarea
                      placeholder="Nhập giá trị cài đặt"
                      className="min-h-[100px] max-h-[300px]"
                      {...field}
                    />
                  </FormControl>
                )}
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Loại</FormLabel>
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
                    <SelectItem value="string">Chuỗi</SelectItem>
                    <SelectItem value="number">Số</SelectItem>
                    <SelectItem value="boolean">Boolean</SelectItem>
                    <SelectItem value="json">JSON</SelectItem>
                    <SelectItem value="file">Tệp tin</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="group"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nhóm</FormLabel>
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
                    <SelectItem value={SYSTEM_SETTING_GROUPS.INTERFACE}>
                      Giao diện
                    </SelectItem>
                    <SelectItem value={SYSTEM_SETTING_GROUPS.EMAIL}>
                      Mẫu Email
                    </SelectItem>
                    <SelectItem value={SYSTEM_SETTING_GROUPS.PRICING}>
                      Giá dịch vụ
                    </SelectItem>
                  </SelectContent>
                </Select>
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
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button type="submit" disabled={isCreating || isUpdating}>
              {isCreating || isUpdating
                ? "Đang xử lý..."
                : isEditing
                  ? "Cập nhật"
                  : "Tạo mới"}
            </Button>
          </div>
        </form>
      </Form>

      <Dialog open={showTemplateGallery} onOpenChange={setShowTemplateGallery}>
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
    </div>
  );
}
