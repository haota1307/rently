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
      case ContractStatus.DRAFT:
        return "secondary";
      default:
        return "secondary";
    }
  };

  const getCustomStyles = () => {
    switch (status) {
      case ContractStatus.ACTIVE:
        return "bg-green-100 text-green-800 hover:bg-green-100/80";
      case ContractStatus.AWAITING_LANDLORD_SIGNATURE:
      case ContractStatus.AWAITING_TENANT_SIGNATURE:
        return "bg-yellow-100 text-yellow-800 hover:bg-yellow-100/80";
      case ContractStatus.EXPIRED:
      case ContractStatus.TERMINATED:
        return "bg-red-100 text-red-800 hover:bg-red-100/80";
      case ContractStatus.RENEWED:
        return "bg-blue-100 text-blue-800 hover:bg-blue-100/80";
      case ContractStatus.DRAFT:
        return "bg-gray-100 text-gray-800 hover:bg-gray-100/80";
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-100/80";
    }
  };

  return (
    <Badge variant="outline" className={`font-medium ${getCustomStyles()}`}>
      {CONTRACT_STATUS_LABELS[status]}
    </Badge>
  );
}
