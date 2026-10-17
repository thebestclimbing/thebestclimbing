"use client";

import { useEffect, useMemo, useRef, useState } from "react";

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
              <PassengerCombobox
                members={selectableMembers}
                onSelect={(profileId) => addPassenger(entry.vehicleId, profileId)}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PassengerCombobox({
  members,
  onSelect,
}: {
  members: DispatchMemberOption[];
  onSelect: (profileId: string) => void;
}) {
  const [inputValue, setInputValue] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    const q = inputValue.trim().toLowerCase();
    if (!q) return members;
    return members.filter((m) => m.name.toLowerCase().includes(q));
  }, [members, inputValue]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setIsOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleSelect(member: DispatchMemberOption) {
    onSelect(member.id);
    setInputValue("");
    setIsOpen(false);
  }

  return (
    <div className="relative mt-2 w-48" ref={containerRef}>
      <input
        type="text"
        value={inputValue}
        onChange={(e) => {
          setInputValue(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            if (filtered.length > 0) {
              handleSelect(filtered[0]);
            } else {
              setInputValue("");
            }
          }
        }}
        placeholder="+ 탑승자 검색"
        className="input-base w-full text-sm"
        autoComplete="off"
      />
      {isOpen && filtered.length > 0 && (
        <ul
          className="absolute z-10 mt-1 max-h-48 w-full overflow-auto rounded-lg border border-[var(--border)] bg-[var(--surface)] py-1 shadow-lg"
          role="listbox"
        >
          {filtered.map((m) => (
            <li
              key={m.id}
              role="option"
              aria-selected={false}
              onClick={() => handleSelect(m)}
              className="cursor-pointer px-3 py-1.5 text-sm text-[var(--chalk)] hover:bg-[var(--surface-muted)]"
            >
              {m.name}
            </li>
          ))}
        </ul>
      )}
      {isOpen && inputValue && filtered.length === 0 && (
        <p className="absolute z-10 mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-sm text-[var(--chalk-muted)] shadow-lg">
          일치하는 회원이 없습니다.
        </p>
      )}
    </div>
  );
}
