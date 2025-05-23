import { useRef, useState } from "react";
import SignatureCanvas from "react-signature-canvas";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface SignaturePadProps {
  onSave: (signatureDataUrl: string) => void;
  width?: number;
  height?: number;
}

export function SignaturePad({
  onSave,
  width = 500,
  height = 200,
}: SignaturePadProps) {
  const sigCanvas = useRef<SignatureCanvas>(null);
  const [isEmpty, setIsEmpty] = useState(true);

  const clear = () => {
    sigCanvas.current?.clear();
    setIsEmpty(true);
  };

  const save = () => {
    if (isEmpty) {
      toast.error("Vui lòng ký tên trước khi lưu");
      return;
    }

    if (sigCanvas.current) {
      const dataURL = sigCanvas.current.toDataURL("image/png");
      onSave(dataURL);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="border border-input rounded-md bg-background">
        <SignatureCanvas
          ref={sigCanvas}
          canvasProps={{
            width,
            height,
            className: "w-full h-full",
          }}
          onBegin={() => setIsEmpty(false)}
        />
      </div>
      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline" onClick={clear}>
          Xóa
        </Button>
        <Button type="button" onClick={save}>
          Xác nhận
        </Button>
      </div>
      <p className="text-sm text-muted-foreground">
        Sử dụng chuột để ký tên vào ô trên
      </p>
    </div>
  );
}
