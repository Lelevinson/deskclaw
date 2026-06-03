import { ListPageSkeleton } from "@/components/store/Skeleton";

// Returns list loading skeleton (DESIGN §5.7).
export default function ReturnsLoading() {
  return <ListPageSkeleton title="Your Returns" rows={2} />;
}
