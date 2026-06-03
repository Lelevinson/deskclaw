import { ListPageSkeleton } from "@/components/store/Skeleton";

// Orders list loading skeleton (DESIGN §5.7).
export default function OrdersLoading() {
  return <ListPageSkeleton title="Your Orders" rows={3} />;
}
