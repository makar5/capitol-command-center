import { format } from "date-fns";

type MilestoneView = {
  id: string;
  name: string;
  plannedDate: Date | string;
  forecastDate?: Date | string | null;
  actualDate?: Date | string | null;
  status: string;
};

function asDate(value: Date | string): Date {
  return typeof value === "string" ? new Date(value) : value;
}

export function MilestoneTimeline({
  milestones,
  startDate,
  endDate,
  today,
}: {
  milestones: MilestoneView[];
  startDate: Date | string;
  endDate: Date | string;
  today: Date | string;
}) {
  const startDateObj = asDate(startDate);
  const endDateObj = asDate(endDate);
  const todayObj = asDate(today);
  const start = startDateObj.getTime();
  const end = endDateObj.getTime();
  const span = Math.max(1, end - start);
  const labelW = 168;
  const trackW = 420;
  const width = labelW + trackW + 16;
  const x = (d: Date) => labelW + ((d.getTime() - start) / span) * trackW;
  const todayX = Math.min(labelW + trackW, Math.max(labelW, x(todayObj)));

  const months: Date[] = [];
  const cursor = new Date(startDateObj.getFullYear(), startDateObj.getMonth(), 1);
  while (cursor.getTime() <= end) {
    if (cursor.getTime() >= start) months.push(new Date(cursor));
    cursor.setMonth(cursor.getMonth() + 2);
  }

  const rowH = 26;
  const topPad = 24;
  const height = topPad + milestones.length * rowH + 12;

  return (
    <section id="milestones" className="rounded-lg border border-slate-200 bg-white">
      <div className="border-b border-slate-200 px-4 py-3">
        <h2 className="text-sm font-semibold text-ink">Milestone timeline</h2>
        <p className="mt-0.5 text-xs text-slate-500">
          Hollow = planned · Filled = forecast / actual
        </p>
      </div>
      <div className="overflow-x-auto px-2 py-3">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full min-w-[560px]"
          role="img"
          aria-label="Milestone timeline"
        >
          {months.map((m) => {
            const mx = x(m);
            return (
              <g key={m.toISOString()}>
                <line
                  x1={mx}
                  y1={16}
                  x2={mx}
                  y2={height - 6}
                  stroke="#E2E8F0"
                  strokeWidth={1}
                />
                <text x={mx + 2} y={12} style={{ fontSize: 9, fill: "#94A3B8" }}>
                  {format(m, "MMM yy")}
                </text>
              </g>
            );
          })}

          <line
            x1={todayX}
            y1={14}
            x2={todayX}
            y2={height - 6}
            stroke="#0EA5E9"
            strokeWidth={1.5}
            strokeDasharray="3 3"
          />

          {milestones.map((m, i) => {
            const y = topPad + i * rowH + 8;
            const planned = asDate(m.plannedDate);
            const forecast = m.forecastDate ? asDate(m.forecastDate) : null;
            const actual = m.actualDate ? asDate(m.actualDate) : null;
            const plannedX = x(planned);
            const markerDate = actual ?? forecast ?? planned;
            const markerX = x(markerDate);
            const complete = m.status === "COMPLETE";
            const atRisk =
              forecast != null &&
              forecast.getTime() > planned.getTime() &&
              !complete;
            const lineColor = complete
              ? "#059669"
              : atRisk
                ? "#D97706"
                : "#94A3B8";
            const label =
              m.name.length > 28 ? `${m.name.slice(0, 28)}…` : m.name;

            return (
              <g key={m.id} id={`milestone-${m.id}`}>
                <text x={4} y={y + 3} style={{ fontSize: 10, fill: "#334155" }}>
                  {label}
                </text>
                <line
                  x1={Math.min(plannedX, markerX)}
                  y1={y}
                  x2={Math.max(plannedX, markerX)}
                  y2={y}
                  stroke={lineColor}
                  strokeWidth={2}
                />
                <circle
                  cx={plannedX}
                  cy={y}
                  r={4}
                  fill="white"
                  stroke={lineColor}
                  strokeWidth={2}
                />
                <circle
                  cx={markerX}
                  cy={y}
                  r={4}
                  fill={lineColor}
                  stroke={lineColor}
                  strokeWidth={2}
                />
              </g>
            );
          })}
        </svg>
      </div>
    </section>
  );
}
