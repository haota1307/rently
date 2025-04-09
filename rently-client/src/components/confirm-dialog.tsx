"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  ReactNode,
  useState,
  createContext,
  useContext,
  useEffect,
} from "react";

interface ConfirmDialogProps {
  title: string;
  description: string;
  cancelText?: string;
  confirmText?: string;
  onConfirm: () => void;
  onCancel?: () => void;
  destructive?: boolean;
}

interface ConfirmContextProps {
  showConfirm: (props: ConfirmDialogProps) => void;
}

const ConfirmContext = createContext<ConfirmContextProps | undefined>(
  undefined
);

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [dialogProps, setDialogProps] = useState<ConfirmDialogProps>({
    title: "",
    description: "",
    confirmText: "Xác nhận",
    cancelText: "Hủy",
    onConfirm: () => {},
  });

  const showConfirm = (props: ConfirmDialogProps) => {
    setDialogProps(props);
    setOpen(true);
  };

  const handleConfirm = () => {
    dialogProps.onConfirm();
    setOpen(false);

    document.body.style.pointerEvents = "auto";
    setTimeout(() => {
      document.body.style.pointerEvents = "auto";
    }, 300);
  };

  const handleCancel = () => {
    dialogProps.onCancel?.();
    setOpen(false);

    document.body.style.pointerEvents = "auto";
    setTimeout(() => {
      document.body.style.pointerEvents = "auto";
    }, 300);
  };

  // Xử lý pointer-events khi component được mount và unmount
  useEffect(() => {
    document.body.style.pointerEvents = "auto";

    // Xử lý khi dialog mở và đóng
    if (open) {
      document.body.style.pointerEvents = "auto";
    } else {
      document.body.style.pointerEvents = "auto";
      setTimeout(() => {
        document.body.style.pointerEvents = "auto";
      }, 300);
    }

    return () => {
      document.body.style.pointerEvents = "auto";
      setTimeout(() => {
        document.body.style.pointerEvents = "auto";
      }, 300);
    };
  }, [open]);

  return (
    <ConfirmContext.Provider value={{ showConfirm }}>
      {children}
      <AlertDialog
        open={open}
        onOpenChange={(isOpen) => {
          setOpen(isOpen);
          if (!isOpen) {
            // Đảm bảo pointer-events được đặt lại khi dialog đóng
            document.body.style.pointerEvents = "auto";
            setTimeout(() => {
              document.body.style.pointerEvents = "auto";
            }, 300);
          }
        }}
      >
        <AlertDialogContent
          onEscapeKeyDown={() => {
            // Đảm bảo pointer-events được đặt lại khi nhấn ESC
            document.body.style.pointerEvents = "auto";
          }}
        >
          <AlertDialogHeader>
            <AlertDialogTitle>{dialogProps.title}</AlertDialogTitle>
            <AlertDialogDescription>
              {dialogProps.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancel}>
              {dialogProps.cancelText || "Hủy"}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirm}
              className={
                dialogProps.destructive
                  ? "bg-destructive hover:bg-destructive/90"
                  : ""
              }
            >
              {dialogProps.confirmText || "Xác nhận"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error("useConfirm must be used within a ConfirmProvider");
  }
  return context;
}
