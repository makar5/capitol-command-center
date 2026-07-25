export type EvidenceNodeKey =
  | "photo"
  | "dailyReport"
  | "verification"
  | "sovLine"
  | "payApp";

export type EvidenceChainState = Partial<Record<EvidenceNodeKey, boolean>>;

const NODES: { key: EvidenceNodeKey; label: string }[] = [
  { key: "photo", label: "Photo" },
  { key: "dailyReport", label: "Daily report" },
  { key: "verification", label: "Verification" },
  { key: "sovLine", label: "SOV line" },
  { key: "payApp", label: "Pay app" },
];

export function EvidenceChain({
  state,
  compact = false,
}: {
  state: EvidenceChainState;
  compact?: boolean;
}) {
  return (
    <div
      className={`flex items-center ${compact ? "gap-0.5" : "gap-1"}`}
      title="Evidence chain"
      aria-label="Evidence chain"
    >
      {NODES.map((node, index) => {
        const filled = Boolean(state[node.key]);
        return (
          <div key={node.key} className="flex items-center">
            <div className="flex flex-col items-center">
              <span
                className={`block rounded-full border-2 ${
                  compact ? "h-2.5 w-2.5" : "h-3 w-3"
                } ${
                  filled
                    ? "border-sky bg-sky"
                    : "border-slate-300 bg-white"
                }`}
                aria-label={`${node.label}: ${filled ? "present" : "missing"}`}
              />
              {!compact ? (
                <span className="mt-1 max-w-[4.5rem] text-center text-[10px] leading-tight text-slate-500">
                  {node.label}
                </span>
              ) : null}
            </div>
            {index < NODES.length - 1 ? (
              <div
                className={`mx-0.5 ${compact ? "w-3" : "w-4"} h-px ${
                  filled && state[NODES[index + 1]!.key]
                    ? "bg-sky"
                    : "bg-slate-300"
                }`}
              />
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
