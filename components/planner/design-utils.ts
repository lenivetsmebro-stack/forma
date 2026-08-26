import { getStyleById } from "@/components/planner/style-catalog";
import type {
  InteriorStyleDefinition,
  PlannerDesignData,
  PlannerRoom,
  RoomDesignSpecification,
} from "@/components/planner/types";
import { getRoomName } from "@/components/planner/planner-utils";

export function getEffectiveStyleForRoom(
  design: PlannerDesignData,
  roomId: string,
): InteriorStyleDefinition | null {
  const styleId = design.mode === "global"
    ? design.globalStyleId
    : design.roomStyleSelections[roomId];
  return getStyleById(styleId) ?? null;
}

export function getRoomDesignSpecification(
  room: PlannerRoom,
  roomIndex: number,
  design: PlannerDesignData,
): RoomDesignSpecification | null {
  const style = getEffectiveStyleForRoom(design, room.id);
  if (!style) return null;
  return {
    roomId: room.id,
    roomName: getRoomName(room, roomIndex),
    styleId: style.id,
    styleName: style.name,
    palette: style.palette,
    materials: style.materials,
    mood: style.mood,
    keywords: style.keywords,
  };
}

export function getDesignSpecifications(
  rooms: PlannerRoom[],
  design: PlannerDesignData,
): RoomDesignSpecification[] {
  return rooms.flatMap((room, index) => {
    const specification = getRoomDesignSpecification(room, index, design);
    return specification ? [specification] : [];
  });
}

export function isDesignStepComplete(
  design: PlannerDesignData,
  rooms: PlannerRoom[],
): boolean {
  if (rooms.length === 0) return false;
  if (design.mode === "global") return getStyleById(design.globalStyleId) !== undefined;
  return rooms.every(
    (room) => getStyleById(design.roomStyleSelections[room.id]) !== undefined,
  );
}
