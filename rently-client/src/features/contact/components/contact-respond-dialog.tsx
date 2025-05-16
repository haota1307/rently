"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Contact } from "../contact.api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import contactApiRequest from "../contact.api";
import { toast } from "sonner";

interface ContactRespondDialogProps {
  contact: Contact;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ContactRespondDialog({
  contact,
  open,
  onOpenChange,
}: ContactRespondDialogProps) {
  const [response, setResponse] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const queryClient = useQueryClient();

  const respondMutation = useMutation({
    mutationFn: ({ id, response }: { id: number; response: string }) =>
      contactApiRequest.respondToContact(id, response),
    onSuccess: () => {
      toast.success("Đã gửi phản hồi thành công");
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      setResponse("");
      onOpenChange(false);
    },
    onError: (error) => {
      console.error("Error responding to contact:", error);
      toast.error("Không thể gửi phản hồi. Vui lòng thử lại sau.");
    },
    onSettled: () => {
      setIsSubmitting(false);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!response.trim()) {
      toast.error("Vui lòng nhập nội dung phản hồi");
      return;
    }

    setIsSubmitting(true);
    respondMutation.mutate({ id: contact.id, response });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Phản hồi liên hệ</DialogTitle>
          <DialogDescription>
            Gửi phản hồi tới {contact.fullName} ({contact.email})
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="subject">Tiêu đề</Label>
              <div className="rounded-md border px-3 py-2 bg-muted/50">
                {contact.subject}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="original-message">Nội dung liên hệ</Label>
              <div className="max-h-32 overflow-y-auto rounded-md border px-3 py-2 bg-muted/50 whitespace-pre-line">
                {contact.message}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="response">Nội dung phản hồi</Label>
              <Textarea
                id="response"
                value={response}
                onChange={(e) => setResponse(e.target.value)}
                placeholder="Nhập nội dung phản hồi của bạn..."
                className="min-h-[150px]"
                required
              />
              <p className="text-xs text-muted-foreground">
                Phản hồi này sẽ được gửi qua email tới người dùng.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Hủy
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Đang gửi..." : "Gửi phản hồi"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
