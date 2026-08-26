import {
  getMaterialById,
  getMaterialsForSurface,
  materialSurfaceLabels,
} from "@/components/planner/material-catalog";
import {
  calculateMaterialRequirement,
  wasteOptions,
} from "@/components/planner/material-utils";
import type {
  MaterialSurface,
  PlannerMaterialSelection,
  WastePercent,
} from "@/components/planner/types";
import { formatArea } from "@/components/planner/planner-utils";

type MaterialFinishSelectorProps = {
  roomId: string;
  roomName: string;
  surface: MaterialSurface;
  surfaceArea: number;
  selection: PlannerMaterialSelection;
  onChange: (selection: PlannerMaterialSelection) => void;
};

export function MaterialFinishSelector({
  roomId,
  roomName,
  surface,
  surfaceArea,
  selection,
  onChange,
}: MaterialFinishSelectorProps) {
  const materials = getMaterialsForSurface(surface);
  const selectedMaterial = getMaterialById(selection.materialId);
  const calculation = calculateMaterialRequirement(surfaceArea, selection);
  const groupId = `${roomId}-${surface}`;

  return (
    <fieldset className="material-finish">
      <legend>{materialSurfaceLabels[surface]}</legend>
      <div className="material-finish__options">
        {materials.map((material) => (
          <label key={material.id}>
            <input
              type="radio"
              name={`${groupId}-material`}
              value={material.id}
              checked={selection.materialId === material.id}
              onChange={() => onChange({ ...selection, materialId: material.id })}
            />
            <span>{material.label}</span>
          </label>
        ))}
      </div>

      {selectedMaterial && !selectedMaterial.isNone && (
        <div className="material-finish__calculation">
          <fieldset className="material-waste">
            <legend>Запас материала</legend>
            <div>
              {wasteOptions.map((waste) => (
                <label key={waste}>
                  <input
                    type="radio"
                    name={`${groupId}-waste`}
                    value={waste}
                    checked={selection.wastePercent === waste}
                    onChange={() =>
                      onChange({ ...selection, wastePercent: waste as WastePercent })
                    }
                  />
                  <span>{waste}%</span>
                </label>
              ))}
            </div>
          </fieldset>

          <dl className="material-quantity" aria-live="polite">
            <div><dt>Базовая площадь</dt><dd>{formatArea(calculation.baseArea)} м²</dd></div>
            <div><dt>Запас</dt><dd>{selection.wastePercent}%</dd></div>
            <div><dt>Итого материала</dt><dd>{formatArea(calculation.requiredArea)} м²</dd></div>
          </dl>

          {calculation.packages !== null && calculation.purchasedArea !== null && (
            <p className="material-quantity__package">
              Необходимо: <strong>{calculation.packages} уп.</strong>
              <span>Фактически будет куплено: {formatArea(calculation.purchasedArea)} м²</span>
            </p>
          )}
        </div>
      )}

      {selectedMaterial?.isNone && (
        <p className="material-finish__none">Для поверхности «{materialSurfaceLabels[surface]}» отделка не выбрана.</p>
      )}
      <span className="sr-only">Выбор отделки для поверхности «{materialSurfaceLabels[surface]}», комната {roomName}</span>
    </fieldset>
  );
}
