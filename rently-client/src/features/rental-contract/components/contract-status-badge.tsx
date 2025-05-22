import { Badge } from "@/components/ui/badge";
import {
  CONTRACT_STATUS_COLORS,
  CONTRACT_STATUS_LABELS,
  ContractStatus,
} from "../contract.constants";

interface ContractStatusBadgeProps {
  status: ContractStatus;
}

export function ContractStatusBadge({ status }: ContractStatusBadgeProps) {
  const getVariant = () => {
    switch (status) {
      case ContractStatus.ACTIVE:
        return "success";
      case ContractStatus.AWAITING_LANDLORD_SIGNATURE:
      case ContractStatus.AWAITING_TENANT_SIGNATURE:
        return "warning";
      case ContractStatus.EXPIRED:
      case ContractStatus.TERMINATED:
        return "destructive";
      case ContractStatus.RENEWED:
        return "info";
      default:
        return "secondary";
    }
  };

  return (
    <Badge variant={getVariant() as any}>
      {CONTRACT_STATUS_LABELS[status]}
    </Badge>
  );
}
