import { Badge } from 'native-base';

interface StatusBadgeProps {
  status: string;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'validated':
      case 'reconciled':
        return 'success';
      case 'pending':
        return 'warning';
      case 'processing':
        return 'info';
      case 'failed':
      case 'error':
        return 'error';
      default:
        return 'gray';
    }
  };

  return (
    <Badge colorScheme={getStatusColor(status)}>
      {status}
    </Badge>
  );
}
