"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Mail, Users, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";

import { SendBulkEmailSchema } from "@/schemas/contact.schema";
import { useSendBulkEmail, useGetBulkEmailStatus } from "../contact.api";

type SendBulkEmailFormData = z.infer<typeof SendBulkEmailSchema>;

interface SendBulkEmailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ROLE_OPTIONS = [
  { id: 1, label: "Admin", value: 1 },
  { id: 2, label: "Người cho thuê", value: 2 },
  { id: 3, label: "Người thuê", value: 3 },
];

const USER_STATUS_OPTIONS = [
  { label: "Đang hoạt động", value: "ACTIVE" as const },
  { label: "Không hoạt động", value: "INACTIVE" as const },
  { label: "Chờ xác thực", value: "PENDING" as const },
];

export function SendBulkEmailModal({
  open,
  onOpenChange,
}: SendBulkEmailModalProps) {
  const [jobId, setJobId] = useState<string | null>(null);
  const [estimatedRecipients, setEstimatedRecipients] = useState<number>(0);

  const sendBulkEmailMutation = useSendBulkEmail();

  // Theo dõi trạng thái job khi có jobId
  const { data: jobStatus } = useGetBulkEmailStatus(jobId || "", !!jobId);

  const form = useForm<SendBulkEmailFormData>({
    resolver: zodResolver(SendBulkEmailSchema),
    defaultValues: {
      subject: "",
      message: "",
      targetAudience: {
        roleIds: [],
        userStatus: undefined,
        userIds: [],
      },
    },
  });

  const handleSubmit = async (data: SendBulkEmailFormData) => {
    try {
      const result = await sendBulkEmailMutation.mutateAsync(data);

      setJobId(result.payload.jobId);
      setEstimatedRecipients(result.payload.estimatedRecipients);

      toast.success(
        `Đã tạo job gửi email đến ${result.payload.estimatedRecipients} người dùng`
      );
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Có lỗi xảy ra, vui lòng thử lại"
      );
    }
  };

  const handleClose = () => {
    form.reset();
    setJobId(null);
    setEstimatedRecipients(0);
    onOpenChange(false);
  };

  const selectedRoles = form.watch("targetAudience.roleIds") || [];
  const selectedStatus = form.watch("targetAudience.userStatus");

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Gửi email hàng loạt
          </DialogTitle>
          <DialogDescription>
            Gửi email thông báo đến nhiều người dùng cùng lúc theo nhóm được chỉ
            định
          </DialogDescription>
        </DialogHeader>

        {!jobId ? (
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleSubmit)}
              className="space-y-6"
            >
              {/* Target Audience Selection */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <h3 className="font-medium">Chọn đối tượng nhận email</h3>
                </div>

                {/* Role Selection */}
                <FormField
                  control={form.control}
                  name="targetAudience.roleIds"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Theo vai trò</FormLabel>
                      <div className="grid grid-cols-3 gap-3">
                        {ROLE_OPTIONS.map((role) => (
                          <div
                            key={role.id}
                            className="flex items-center space-x-2"
                          >
                            <Checkbox
                              id={`role-${role.id}`}
                              checked={
                                field.value?.includes(role.value) || false
                              }
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  field.onChange([
                                    ...(field.value || []),
                                    role.value,
                                  ]);
                                } else {
                                  field.onChange(
                                    field.value?.filter(
                                      (id) => id !== role.value
                                    ) || []
                                  );
                                }
                              }}
                            />
                            <label
                              htmlFor={`role-${role.id}`}
                              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                              {role.label}
                            </label>
                          </div>
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* User Status Selection */}
                <FormField
                  control={form.control}
                  name="targetAudience.userStatus"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Theo trạng thái tài khoản</FormLabel>
                      <Select
                        onValueChange={(value) =>
                          field.onChange(value === "ALL" ? undefined : value)
                        }
                        value={field.value || "ALL"}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Chọn trạng thái (tùy chọn)" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="ALL">Tất cả trạng thái</SelectItem>
                          {USER_STATUS_OPTIONS.map((status) => (
                            <SelectItem key={status.value} value={status.value}>
                              {status.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Selection Summary */}
                {(selectedRoles.length > 0 || selectedStatus) && (
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-sm font-medium mb-2">
                      Đối tượng được chọn:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {selectedRoles.map((roleId) => {
                        const role = ROLE_OPTIONS.find(
                          (r) => r.value === roleId
                        );
                        return (
                          <Badge key={roleId} variant="secondary">
                            {role?.label}
                          </Badge>
                        );
                      })}
                      {selectedStatus && (
                        <Badge variant="outline">
                          {
                            USER_STATUS_OPTIONS.find(
                              (s) => s.value === selectedStatus
                            )?.label
                          }
                        </Badge>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <Separator />

              {/* Email Content */}
              <div className="space-y-4">
                <h3 className="font-medium">Nội dung email</h3>

                <FormField
                  control={form.control}
                  name="subject"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tiêu đề email *</FormLabel>
                      <FormControl>
                        <Input placeholder="Nhập tiêu đề email..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="message"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nội dung email *</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Nhập nội dung email..."
                          className="min-h-[120px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Email sẽ được gửi hàng loạt thông qua hệ thống queue. Quá
                  trình có thể mất vài phút tùy thuộc vào số lượng người nhận.
                </AlertDescription>
              </Alert>

              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={handleClose}>
                  Hủy
                </Button>
                <Button
                  type="submit"
                  disabled={
                    sendBulkEmailMutation.isPending ||
                    (selectedRoles.length === 0 && !selectedStatus)
                  }
                >
                  {sendBulkEmailMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Gửi email hàng loạt
                </Button>
              </div>
            </form>
          </Form>
        ) : (
          // Job Status Display
          <div className="space-y-6">
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="p-3 bg-primary/10 rounded-full">
                  <Mail className="h-8 w-8 text-primary" />
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold">
                  Đang gửi email hàng loạt
                </h3>
                <p className="text-muted-foreground">
                  Job ID: {jobId} - Gửi đến {estimatedRecipients} người dùng
                </p>
              </div>

              {jobStatus && (
                <div className="space-y-3">
                  {jobStatus.payload.message.includes("✅") ? (
                    <Alert className="border-green-200 bg-green-50">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <AlertDescription className="text-green-800">
                        {jobStatus.payload.message}
                      </AlertDescription>
                    </Alert>
                  ) : jobStatus.payload.message.includes("❌") ? (
                    <Alert className="border-red-200 bg-red-50">
                      <AlertCircle className="h-4 w-4 text-red-600" />
                      <AlertDescription className="text-red-800">
                        {jobStatus.payload.message}
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <Alert className="border-blue-200 bg-blue-50">
                      <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                      <AlertDescription className="text-blue-800">
                        {jobStatus.payload.message}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              )}
            </div>

            <div className="flex justify-center">
              <Button onClick={handleClose}>Đóng</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
