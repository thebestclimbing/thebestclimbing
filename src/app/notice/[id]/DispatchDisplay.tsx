interface DispatchDisplayEntry {
  vehicleModel: string;
  ownerName: string;
  passengerNames: string[];
}

export function DispatchDisplay({ dispatches }: { dispatches: DispatchDisplayEntry[] }) {
  if (dispatches.length === 0) return null;

  return (
    <section className="card mt-6 rounded-2xl p-6">
      <h2 className="mb-4 text-lg font-bold text-[var(--chalk)]">배차 현황</h2>
      <div className="grid gap-3">
        {dispatches.map((d, i) => (
          <div key={i} className="rounded-lg bg-[var(--surface-muted)] p-3">
            <p className="text-sm font-medium text-[var(--chalk)]">
              {d.ownerName} — {d.vehicleModel}
            </p>
            <p className="mt-1 text-sm text-[var(--chalk-muted)]">
              탑승자: {d.passengerNames.length > 0 ? d.passengerNames.join(", ") : "-"}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
