"use client";

import { useState } from "react";
import { MoreHorizontal, Eye, Send, XCircle } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Contact } from "../contact.api";

import { ContactRespondDialog } from "./contact-respond-dialog";
import { toast } from "sonner";
import contactApiRequest from "../contact.api";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ContactViewDialog } from "@/features/contact/components/contact-view-dialog";

interface ContactActionsProps {
  contact: Contact;
}

export function ContactActions({ contact }: ContactActionsProps) {
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isRespondDialogOpen, setIsRespondDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  const closeContactMutation = useMutation({
    mutationFn: (id: number) => contactApiRequest.closeContact(id),
    onSuccess: () => {
      toast.success("Đã đóng liên hệ thành công");
      queryClient.invalidateQueries({ queryKey: ["contacts"] });
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

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="h-8 w-8 p-0 flex items-center justify-center"
          >
            <span className="sr-only">Mở menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[160px]">
          <DropdownMenuItem
            onClick={() => setIsViewDialogOpen(true)}
            className="cursor-pointer"
          >
            <Eye className="mr-2 h-4 w-4" />
            <span>Xem chi tiết</span>
          </DropdownMenuItem>

          {contact.status === "PENDING" && (
            <DropdownMenuItem
              onClick={() => setIsRespondDialogOpen(true)}
              className="cursor-pointer"
            >
              <Send className="mr-2 h-4 w-4" />
              <span>Phản hồi</span>
            </DropdownMenuItem>
          )}

          {contact.status !== "CLOSED" && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleCloseContact}
                className="cursor-pointer text-destructive focus:text-destructive"
              >
                <XCircle className="mr-2 h-4 w-4" />
                <span>Đóng liên hệ</span>
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* View Dialog */}
      <ContactViewDialog
        contact={contact}
        open={isViewDialogOpen}
        onOpenChange={setIsViewDialogOpen}
      />

      {/* Respond Dialog */}
      {contact.status === "PENDING" && (
        <ContactRespondDialog
          contact={contact}
          open={isRespondDialogOpen}
          onOpenChange={setIsRespondDialogOpen}
        />
      )}
    </>
  );
}
