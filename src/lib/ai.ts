/**
 * AI helpers with deterministic template fallbacks.
 * Full implementations land in Phases 3 and 7.
 */

export type NarrativeSource = "ai" | "template";

export async function generateDailyNarrative(
  reportData: unknown,
  projectContext: unknown,
): Promise<{ narrative: string; source: NarrativeSource }> {
  void reportData;
  void projectContext;
  return {
    narrative: "",
    source: "template",
  };
}

export async function generateWeeklyExecutiveSummary(
  weekFacts: unknown,
  projectContext: unknown,
): Promise<{ narrative: string; source: NarrativeSource }> {
  void weekFacts;
  void projectContext;
  return {
    narrative: "",
    source: "template",
  };
}
