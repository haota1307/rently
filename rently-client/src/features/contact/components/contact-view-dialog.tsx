"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Send,
  XCircle,
  User,
  Mail,
  Phone,
  Calendar,
  CheckCircle2,
} from "lucide-react";
import { Contact } from "../contact.api";
import { useState } from "react";
import { ContactRespondDialog } from "./contact-respond-dialog";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import contactApiRequest from "../contact.api";
import { toast } from "sonner";
import { formatDate } from "@/lib/utils";

interface ContactViewDialogProps {
  contact: Contact;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ContactViewDialog({
  contact,
  open,
  onOpenChange,
}: ContactViewDialogProps) {
  const [isRespondDialogOpen, setIsRespondDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  const closeContactMutation = useMutation({
    mutationFn: (id: number) => contactApiRequest.closeContact(id),
    onSuccess: () => {
      toast.success("Đã đóng liên hệ thành công");
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
      onOpenChange(false);
    },
    onError: (error) => {
      console.error("Error closing contact:", error);
      toast.error("Không thể đóng liên hệ. Vui lòng thử lại sau.");
    },
  });

  const handleCloseContact = () => {
    if (window.confirm("Bạn có chắc chắn muốn đóng liên hệ này?")) {
      closeContactMutation.mutate(contact.id);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return <Badge>Chờ xử lý</Badge>;
      case "RESPONDED":
        return <Badge variant="secondary">Đã phản hồi</Badge>;
      case "CLOSED":
        return <Badge variant="outline">Đã đóng</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="w-[95vw] max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Chi tiết liên hệ</DialogTitle>
            <DialogDescription>
              ID: #{contact.id} - {getStatusBadge(contact.status)}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Thông tin người gửi */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Thông tin người gửi</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Họ tên:</span>
                  <span>{contact.fullName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Email:</span>
                  <span>{contact.email}</span>
                </div>
                {contact.phoneNumber && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Số điện thoại:</span>
                    <span>{contact.phoneNumber}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Ngày gửi:</span>
                  <span>{formatDate(new Date(contact.createdAt))}</span>
                </div>
              </CardContent>
            </Card>

            {/* Nội dung liên hệ */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Nội dung liên hệ</CardTitle>
                <CardDescription>{contact.subject}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="whitespace-pre-line rounded-md border p-4 bg-muted/50">
                  {contact.message}
                </div>
              </CardContent>
            </Card>

            {/* Phản hồi (nếu có) */}
            {(contact.status === "RESPONDED" || contact.response) && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    Phản hồi
                  </CardTitle>
                  {contact.respondedAt && (
                    <CardDescription>
                      Đã phản hồi vào:{" "}
                      {formatDate(new Date(contact.respondedAt))}
                      {contact.respondedBy &&
                        ` bởi ${contact.respondedBy.name}`}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="whitespace-pre-line rounded-md border border-blue-100 bg-blue-50 p-4 text-blue-900">
                    {contact.response}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <Separator className="my-4" />

          <div className="flex justify-end gap-2">
            {contact.status === "PENDING" && (
              <Button
                onClick={() => setIsRespondDialogOpen(true)}
                className="gap-1"
              >
                <Send className="h-4 w-4" />
                Phản hồi
              </Button>
            )}
            {contact.status !== "CLOSED" && (
              <Button
                variant="outline"
                onClick={handleCloseContact}
                className="gap-1"
              >
                <XCircle className="h-4 w-4" />
                Đóng liên hệ
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Respond Dialog */}
      {contact.status === "PENDING" && (
        <ContactRespondDialog
          contact={contact}
          open={isRespondDialogOpen}
          onOpenChange={(open) => {
            setIsRespondDialogOpen(open);
            if (!open) {
              // Refresh the data after responding
              queryClient.invalidateQueries({ queryKey: ["contacts"] });
            }
          }}
        />
      )}
    </>
  );
}
