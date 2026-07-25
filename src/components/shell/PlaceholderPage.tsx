import { PageHeader } from "./PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";

export function PlaceholderPage({
  title,
  phase,
}: {
  title: string;
  phase: string;
}) {
  return (
    <div>
      <PageHeader title={title} description={`Placeholder — full UI in ${phase}.`} />
      <EmptyState
        title={`${title} coming next`}
        description={`This screen is wired into the shell for navigation. Implementation lands in ${phase}.`}
      />
    </div>
  );
}
