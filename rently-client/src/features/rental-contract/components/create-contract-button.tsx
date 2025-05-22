import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useState } from "react";
import { CreateContractForm } from "@/features/rental-contract/components/create-contract-form";

export function CreateContractButton() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-1">
          <PlusCircle className="h-4 w-4" />
          <span>Tạo hợp đồng</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Tạo hợp đồng mới</DialogTitle>
          <DialogDescription>
            Nhập thông tin để tạo hợp đồng thuê mới
          </DialogDescription>
        </DialogHeader>
        <CreateContractForm onSuccess={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}
