"use client";

import { useRef, useState } from "react";

import { ObjectStep } from "@/components/planner/object-step";
import { MaterialsStep } from "@/components/planner/materials-step";
import { createDefaultRoomFinishes } from "@/components/planner/material-utils";
import { PlannerProgress } from "@/components/planner/planner-progress";
import { RoomsStep } from "@/components/planner/rooms-step";
import { StyleStep } from "@/components/planner/style-step";
import { ThreeStep } from "@/components/planner/three-step";
import type {
  PlannerObjectData,
  PlannerOpening,
  PlannerOpeningKind,
  PlannerRoom,
  PlannerDesignData,
} from "@/components/planner/types";

const initialData: PlannerObjectData = {
  propertyType: null,
  totalArea: null,
  roomCount: null,
  ceilingHeight: null,
  floorCount: null,
};

const initialDesignData: PlannerDesignData = {
  mode: "global",
  globalStyleId: null,
  roomStyleSelections: {},
};

export function PlannerShell() {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [data, setData] = useState<PlannerObjectData>(initialData);
  const [rooms, setRooms] = useState<PlannerRoom[]>([]);
  const [design, setDesign] = useState<PlannerDesignData>(initialDesignData);
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
      finishes: createDefaultRoomFinishes(),
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

  function updateDesign(update: Partial<PlannerDesignData>) {
    setDesign((current) => ({ ...current, ...update }));
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
      ) : currentStep === 3 ? (
        <MaterialsStep
          rooms={rooms}
          onBack={() => setCurrentStep(2)}
          onContinue={() => setCurrentStep(4)}
          onRoomChange={updateRoom}
          onAddOpening={addOpening}
          onUpdateOpening={updateOpening}
          onRemoveOpening={removeOpening}
        />
      ) : currentStep === 4 ? (
        <StyleStep
          rooms={rooms}
          design={design}
          onChange={updateDesign}
          onBack={() => setCurrentStep(3)}
          onContinue={() => setCurrentStep(5)}
        />
      ) : (
        <ThreeStep rooms={rooms} design={design} onBack={() => setCurrentStep(4)} />
      )}
    </section>
  );
}
