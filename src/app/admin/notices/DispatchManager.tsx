"use client";

export interface DispatchVehicleOption {
  id: string;
  model: string;
  seatCount: number;
  ownerName: string;
}

export interface DispatchMemberOption {
  id: string;
  name: string;
}

export interface DispatchEntry {
  vehicleId: string;
  passengerIds: string[];
}

export function DispatchManager({
  availableVehicles,
  availableMembers,
  dispatches,
  onChange,
}: {
  availableVehicles: DispatchVehicleOption[];
  availableMembers: DispatchMemberOption[];
  dispatches: DispatchEntry[];
  onChange: (next: DispatchEntry[]) => void;
}) {
  const usedVehicleIds = new Set(dispatches.map((d) => d.vehicleId));
  const selectableVehicles = availableVehicles.filter((v) => !usedVehicleIds.has(v.id));
  const assignedMemberIds = new Set(dispatches.flatMap((d) => d.passengerIds));

  function addVehicle(vehicleId: string) {
    if (!vehicleId) return;
    onChange([...dispatches, { vehicleId, passengerIds: [] }]);
  }

  function removeVehicle(vehicleId: string) {
    onChange(dispatches.filter((d) => d.vehicleId !== vehicleId));
  }

  function addPassenger(vehicleId: string, profileId: string) {
    if (!profileId) return;
    onChange(
      dispatches.map((d) =>
        d.vehicleId === vehicleId ? { ...d, passengerIds: [...d.passengerIds, profileId] } : d
      )
    );
  }

  function removePassenger(vehicleId: string, profileId: string) {
    onChange(
      dispatches.map((d) =>
        d.vehicleId === vehicleId
          ? { ...d, passengerIds: d.passengerIds.filter((id) => id !== profileId) }
          : d
      )
    );
  }

  return (
    <div className="mt-2 rounded-xl border border-[var(--border)] p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-bold text-[var(--chalk)]">배차 관리</h3>
        <select
          value=""
          onChange={(e) => addVehicle(e.target.value)}
          className="input-base w-auto text-sm"
        >
          <option value="">+ 차량 추가</option>
          {selectableVehicles.map((v) => (
            <option key={v.id} value={v.id}>
              {v.ownerName} — {v.model} ({v.seatCount}인승)
            </option>
          ))}
        </select>
      </div>

      {dispatches.length === 0 && (
        <p className="text-sm text-[var(--chalk-muted)]">추가된 차량이 없습니다.</p>
      )}

      <div className="grid gap-3">
        {dispatches.map((entry) => {
          const vehicle = availableVehicles.find((v) => v.id === entry.vehicleId);
          if (!vehicle) return null;
          const isOverCapacity = entry.passengerIds.length > vehicle.seatCount;
          const selectableMembers = availableMembers.filter(
            (m) => !assignedMemberIds.has(m.id)
          );
          return (
            <div key={entry.vehicleId} className="rounded-lg bg-[var(--surface-muted)] p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-[var(--chalk)]">
                  {vehicle.ownerName} — {vehicle.model} ({entry.passengerIds.length}/{vehicle.seatCount}인승)
                </span>
                <button
                  type="button"
                  onClick={() => removeVehicle(entry.vehicleId)}
                  className="text-xs text-red-600 hover:underline"
                >
                  차량 제거
                </button>
              </div>
              {isOverCapacity && (
                <p className="mt-1 text-xs text-amber-500">
                  탑승 인원이 좌석수({vehicle.seatCount}석)를 초과했습니다.
                </p>
              )}
              <div className="mt-2 flex flex-wrap gap-2">
                {entry.passengerIds.map((pid) => {
                  const member = availableMembers.find((m) => m.id === pid);
                  return (
                    <span
                      key={pid}
                      className="inline-flex items-center gap-1 rounded-full bg-[var(--primary-muted)] px-2.5 py-1 text-xs text-[var(--chalk)]"
                    >
                      {member?.name ?? "알수없음"}
                      <button
                        type="button"
                        onClick={() => removePassenger(entry.vehicleId, pid)}
                        className="text-[var(--chalk-muted)] hover:text-red-600"
                      >
                        ×
                      </button>
                    </span>
                  );
                })}
              </div>
              <select
                value=""
                onChange={(e) => addPassenger(entry.vehicleId, e.target.value)}
                className="input-base mt-2 w-auto text-sm"
              >
                <option value="">+ 탑승자 추가</option>
                {selectableMembers.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>
          );
        })}
      </div>
    </div>
  );
}
