"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ContactFormSchema, ContactFormType } from "@/schemas/contact.schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useMutation } from "@tanstack/react-query";
import contactApiRequest from "../contact.api";
import { toast } from "sonner";
import { handleErrorApi } from "@/lib/utils";

// Compact version for the footer
export function FooterContactForm() {
  const [isSubmitSuccessful, setIsSubmitSuccessful] = useState(false);

  const form = useForm<ContactFormType>({
    resolver: zodResolver(ContactFormSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phoneNumber: "",
      subject: "",
      message: "",
    },
  });

  const contactMutation = useMutation({
    mutationFn: contactApiRequest.submitContactForm,
  });

  const onSubmit = async (data: ContactFormType) => {
    if (contactMutation.isPending) return;

    try {
      await contactMutation.mutateAsync(data);
      toast.success(
        "Gửi liên hệ thành công! Chúng tôi sẽ phản hồi sớm nhất có thể."
      );
      form.reset();
      setIsSubmitSuccessful(true);
    } catch (error) {
      handleErrorApi({
        error,
        setError: form.setError,
      });
    }
  };

  if (isSubmitSuccessful) {
    return (
      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md p-3 text-center">
        <h3 className="text-green-700 dark:text-green-400 font-medium text-sm mb-1">
          Cảm ơn bạn đã liên hệ!
        </h3>
        <p className="text-green-600 dark:text-green-500 text-xs mb-2">
          Chúng tôi sẽ phản hồi sớm nhất có thể.
        </p>
        <Button
          variant="outline"
          size="sm"
          className="border-green-300 dark:border-green-800 text-green-700 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/40 text-xs h-7"
          onClick={() => setIsSubmitSuccessful(false)}
        >
          Gửi yêu cầu mới
        </Button>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-2.5">
        <FormField
          control={form.control}
          name="fullName"
          render={({ field }) => (
            <FormItem className="space-y-1">
              <FormLabel className="text-xs">Họ tên</FormLabel>
              <Input
                placeholder="Nhập họ tên của bạn"
                {...field}
                className="text-xs h-8"
              />
              <FormMessage className="text-xs" />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-2.5">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem className="space-y-1">
                <FormLabel className="text-xs">Email</FormLabel>
                <Input
                  placeholder="example@email.com"
                  type="email"
                  {...field}
                  className="text-xs h-8"
                />
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="phoneNumber"
            render={({ field }) => (
              <FormItem className="space-y-1">
                <FormLabel className="text-xs">SĐT (tùy chọn)</FormLabel>
                <Input
                  placeholder="Nhập số điện thoại"
                  {...field}
                  className="text-xs h-8"
                />
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="subject"
          render={({ field }) => (
            <FormItem className="space-y-1">
              <FormLabel className="text-xs">Tiêu đề</FormLabel>
              <Input
                placeholder="Tiêu đề liên hệ"
                {...field}
                className="text-xs h-8"
              />
              <FormMessage className="text-xs" />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="message"
          render={({ field }) => (
            <FormItem className="space-y-1">
              <FormLabel className="text-xs">Nội dung</FormLabel>
              <Textarea
                placeholder="Mô tả vấn đề hoặc thắc mắc của bạn..."
                className="min-h-[60px] text-xs resize-none"
                {...field}
              />
              <FormMessage className="text-xs" />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          className="w-full h-8 text-xs"
          size="sm"
          disabled={contactMutation.isPending}
        >
          {contactMutation.isPending ? "Đang gửi..." : "Gửi liên hệ"}
        </Button>
      </form>
    </Form>
  );
}

export default function ContactForm() {
  const [isSubmitSuccessful, setIsSubmitSuccessful] = useState(false);

  const form = useForm<ContactFormType>({
    resolver: zodResolver(ContactFormSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phoneNumber: "",
      subject: "",
      message: "",
    },
  });

  const contactMutation = useMutation({
    mutationFn: contactApiRequest.submitContactForm,
  });

  const onSubmit = async (data: ContactFormType) => {
    if (contactMutation.isPending) return;

    try {
      await contactMutation.mutateAsync(data);
      toast.success(
        "Gửi liên hệ thành công! Chúng tôi sẽ phản hồi sớm nhất có thể."
      );
      form.reset();
      setIsSubmitSuccessful(true);
    } catch (error) {
      handleErrorApi({
        error,
        setError: form.setError,
      });
    }
  };

  if (isSubmitSuccessful) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-md p-4 text-center">
        <h3 className="text-green-700 font-medium mb-2">
          Cảm ơn bạn đã liên hệ!
        </h3>
        <p className="text-green-600 mb-4">
          Chúng tôi sẽ phản hồi qua email của bạn trong thời gian sớm nhất.
        </p>
        <Button
          variant="outline"
          className="border-green-300 text-green-700 hover:bg-green-100"
          onClick={() => setIsSubmitSuccessful(false)}
        >
          Gửi yêu cầu mới
        </Button>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="fullName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Họ tên</FormLabel>
              <Input placeholder="Nhập họ tên của bạn" {...field} />
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <Input
                  placeholder="example@email.com"
                  type="email"
                  {...field}
                />
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="phoneNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Số điện thoại (tùy chọn)</FormLabel>
                <Input placeholder="Nhập số điện thoại" {...field} />
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="subject"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tiêu đề</FormLabel>
              <Input placeholder="Tiêu đề liên hệ" {...field} />
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="message"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nội dung</FormLabel>
              <Textarea
                placeholder="Mô tả vấn đề hoặc thắc mắc của bạn..."
                className="min-h-[120px]"
                {...field}
              />
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          className="w-full"
          disabled={contactMutation.isPending}
        >
          {contactMutation.isPending ? "Đang gửi..." : "Gửi liên hệ"}
        </Button>
      </form>
    </Form>
  );
}
