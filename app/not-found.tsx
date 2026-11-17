import { ErrorState } from "@/components/error-state";

export default function NotFound() {
  return <ErrorState code="404" title="This page could not be found" description="The link may be outdated, or this page may have moved. Return to the hymnbook to find your next hymn." />;
}
