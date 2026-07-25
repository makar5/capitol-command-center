/**
 * AI helpers with deterministic template fallbacks.
 * Full implementations land in Phases 3 and 7.
 */

export type NarrativeSource = "ai" | "template";

export async function generateDailyNarrative(
  _reportData: unknown,
  _projectContext: unknown,
): Promise<{ narrative: string; source: NarrativeSource }> {
  return {
    narrative: "",
    source: "template",
  };
}

export async function generateWeeklyExecutiveSummary(
  _weekFacts: unknown,
  _projectContext: unknown,
): Promise<{ narrative: string; source: NarrativeSource }> {
  return {
    narrative: "",
    source: "template",
  };
}
