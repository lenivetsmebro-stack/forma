"use client";

import { useRef, useState } from "react";

import { ObjectStep } from "@/components/planner/object-step";
import { MaterialsStep } from "@/components/planner/materials-step";
import { PlannerProgress } from "@/components/planner/planner-progress";
import { RoomsStep } from "@/components/planner/rooms-step";
import type {
  PlannerObjectData,
  PlannerOpening,
  PlannerOpeningKind,
  PlannerRoom,
} from "@/components/planner/types";

const initialData: PlannerObjectData = {
  propertyType: null,
  totalArea: null,
  roomCount: null,
  ceilingHeight: null,
  floorCount: null,
};

export function PlannerShell() {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [data, setData] = useState<PlannerObjectData>(initialData);
  const [rooms, setRooms] = useState<PlannerRoom[]>([]);
  const nextRoomId = useRef(1);
  const nextOpeningId = useRef(1);

  function updateData(update: Partial<PlannerObjectData>) {
    setData((current) => ({ ...current, ...update }));
  }

  function createRoom(): PlannerRoom {
    const room: PlannerRoom = {
      id: `room-${nextRoomId.current}`,
      type: "",
      customName: "",
      length: "",
      width: "",
      height: data.ceilingHeight?.toString() ?? "",
      doors: [],
      windows: [],
    };
    nextRoomId.current += 1;
    return room;
  }

  function openRoomsStep() {
    const requestedCount = data.roomCount;
    if (requestedCount === null) return;

    if (requestedCount < rooms.length) {
      const confirmed = window.confirm(
        `Количество помещений уменьшено с ${rooms.length} до ${requestedCount}. Удалить последние помещения?`,
      );
      if (!confirmed) {
        updateData({ roomCount: rooms.length });
        return;
      }
    }

    setRooms((current) => {
      if (requestedCount <= current.length) return current.slice(0, requestedCount);
      const additions = Array.from(
        { length: requestedCount - current.length },
        () => createRoom(),
      );
      return [...current, ...additions];
    });
    setCurrentStep(2);
  }

  function updateRoom(roomId: string, update: Partial<PlannerRoom>) {
    setRooms((current) =>
      current.map((room) => (room.id === roomId ? { ...room, ...update } : room)),
    );
  }

  function addOpening(roomId: string, kind: PlannerOpeningKind) {
    const opening: PlannerOpening = {
      id: `opening-${nextOpeningId.current}`,
      width: "",
      height: "",
    };
    nextOpeningId.current += 1;
    setRooms((current) =>
      current.map((room) =>
        room.id === roomId
          ? { ...room, [kind]: [...room[kind], opening] }
          : room,
      ),
    );
  }

  function updateOpening(
    roomId: string,
    kind: PlannerOpeningKind,
    openingId: string,
    update: Partial<PlannerOpening>,
  ) {
    setRooms((current) =>
      current.map((room) =>
        room.id === roomId
          ? {
              ...room,
              [kind]: room[kind].map((opening) =>
                opening.id === openingId ? { ...opening, ...update } : opening,
              ),
            }
          : room,
      ),
    );
  }

  function removeOpening(
    roomId: string,
    kind: PlannerOpeningKind,
    openingId: string,
  ) {
    setRooms((current) =>
      current.map((room) =>
        room.id === roomId
          ? { ...room, [kind]: room[kind].filter((item) => item.id !== openingId) }
          : room,
      ),
    );
  }

  return (
    <section className="planner-shell" aria-labelledby="planner-page-title">
      <header className="planner-shell__header">
        <p className="section-label">FORMA Planner</p>
        <h1 id="planner-page-title">Создайте параметры пространства</h1>
        <p>
          Начните с основных данных объекта. Они хранятся только в текущей
          сессии и нужны для подготовки следующих шагов.
        </p>
      </header>

      <PlannerProgress currentStep={currentStep} />

      {currentStep === 1 ? (
        <ObjectStep data={data} onChange={updateData} onContinue={openRoomsStep} />
      ) : currentStep === 2 ? (
        <RoomsStep
          objectData={data}
          rooms={rooms}
          onBack={() => setCurrentStep(1)}
          onContinue={() => setCurrentStep(3)}
          onRoomChange={updateRoom}
        />
      ) : (
        <MaterialsStep
          rooms={rooms}
          onBack={() => setCurrentStep(2)}
          onAddOpening={addOpening}
          onUpdateOpening={updateOpening}
          onRemoveOpening={removeOpening}
        />
      )}
    </section>
  );
}
