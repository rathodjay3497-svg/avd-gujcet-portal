import Badge from '@/components/ui/Badge/Badge';

const STATUS_VARIANT = {
  active: 'success',
  draft: 'warning',
  closed: 'danger',
  confirmed: 'success',
  cancelled: 'danger',
  waitlisted: 'warning',
};

export default function EventBadge({ status }) {
  return (
    <Badge variant={STATUS_VARIANT[status] || 'default'}>
      {status?.charAt(0).toUpperCase() + status?.slice(1)}
    </Badge>
  );
}
