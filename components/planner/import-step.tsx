"use client";

import Image from "next/image";
import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import type { ChangeEvent, DragEvent } from "react";

import type { ImportedFloorPlan } from "@/components/planner/imported-plan-types";
import type { ImportedPlanMarkup } from "@/components/planner/imported-plan-types";
import {
  formatImportFileSize,
  getImportedPlanSourceType,
  isSupportedPlanFile,
  MAX_IMPORT_FILE_SIZE,
  normalizeImportedFloorPlan,
  validateImportedFloorPlan,
} from "@/components/planner/imported-plan-utils";
import { PlanMarkupStep } from "@/components/planner/plan-markup-step";

type ImportStepProps = {
  onCancel: () => void;
};

type ImportSessionFile = {
  id: string;
  file: File;
  previewUrl: string | null;
};

function createEmptyMarkup(fileSessionId: string): ImportedPlanMarkup {
  return {
    fileSessionId,
    calibrationPoints: [],
    calibration: null,
    walls: [],
    rooms: [],
  };
}

function readPositiveNumber(value: string) {
  if (value.trim() === "") return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}

export function ImportStep({ onCancel }: ImportStepProps) {
  const inputId = useId();
  const replaceInputId = useId();
  const previewUrlRef = useRef<string | null>(null);
  const nextFileSessionId = useRef(1);
  const [sessionFile, setSessionFile] = useState<ImportSessionFile | null>(null);
  const [plan, setPlan] = useState<ImportedFloorPlan | null>(null);
  const [workflowScreen, setWorkflowScreen] = useState<"parameters" | "markup">("parameters");
  const [markup, setMarkup] = useState<ImportedPlanMarkup | null>(null);
  const [realLengthInput, setRealLengthInput] = useState("");
  const [scaleInput, setScaleInput] = useState("");
  const [ceilingInput, setCeilingInput] = useState("2.7");
  const [fileError, setFileError] = useState<string | null>(null);

  useEffect(
    () => () => {
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    },
    [],
  );

  const normalizedPlan = useMemo(
    () => (plan ? normalizeImportedFloorPlan(plan) : null),
    [plan],
  );
  const validation = useMemo(
    () => (plan ? validateImportedFloorPlan(plan) : null),
    [plan],
  );
  const scaleReady = plan?.planScale !== undefined;
  const ceilingReady = plan?.defaultCeilingHeight !== undefined;
  const scaleInvalid = scaleInput !== "" && !scaleReady;
  const ceilingInvalid = ceilingInput !== "" && !ceilingReady;
  const readyForMarkup = Boolean(sessionFile && ceilingReady);
  const canOpenMarkup = Boolean(
    readyForMarkup &&
      plan?.sourceType === "image" &&
      sessionFile?.previewUrl &&
      markup,
  );

  function clearPreviewUrl() {
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    previewUrlRef.current = null;
  }

  function acceptFile(file: File) {
    setFileError(null);
    if (file.size > MAX_IMPORT_FILE_SIZE) {
      setFileError("Файл превышает локальный лимит 20 МБ.");
      return;
    }
    if (!isSupportedPlanFile(file)) {
      setFileError("Выберите JPG, JPEG, PNG или PDF с корректным типом файла.");
      return;
    }

    const sourceType = getImportedPlanSourceType(file);
    if (!sourceType) {
      setFileError("Не удалось определить безопасный формат файла.");
      return;
    }

    clearPreviewUrl();
    const previewUrl = sourceType === "image" ? URL.createObjectURL(file) : null;
    const fileSessionId = `import-file-${nextFileSessionId.current}`;
    nextFileSessionId.current += 1;
    previewUrlRef.current = previewUrl;
    setSessionFile({ id: fileSessionId, file, previewUrl });
    setMarkup(createEmptyMarkup(fileSessionId));
    setRealLengthInput("");
    setWorkflowScreen("parameters");
    setPlan({
      sourceType,
      fileName: file.name,
      planScale: readPositiveNumber(scaleInput),
      defaultCeilingHeight: readPositiveNumber(ceilingInput),
      rooms: [],
    });
  }

  function handleFileInput(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) acceptFile(file);
    event.target.value = "";
  }

  function handleDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0];
    if (file) acceptFile(file);
  }

  function updateScale(value: string) {
    setScaleInput(value);
    const planScale = readPositiveNumber(value);
    setPlan((current) =>
      current
        ? { ...current, planScale }
        : current,
    );
  }

  function updateCeilingHeight(value: string) {
    setCeilingInput(value);
    const defaultCeilingHeight = readPositiveNumber(value);
    setPlan((current) =>
      current
        ? { ...current, defaultCeilingHeight }
        : current,
    );
  }

  function removeFile() {
    clearPreviewUrl();
    setSessionFile(null);
    setPlan(null);
    setMarkup(null);
    setRealLengthInput("");
    setWorkflowScreen("parameters");
    setFileError(null);
  }

  if (
    workflowScreen === "markup" &&
    sessionFile?.previewUrl &&
    plan?.sourceType === "image" &&
    markup?.fileSessionId === sessionFile.id
  ) {
    return (
      <PlanMarkupStep
        fileName={sessionFile.file.name}
        previewUrl={sessionFile.previewUrl}
        markup={markup}
        realLengthInput={realLengthInput}
        onRealLengthChange={setRealLengthInput}
        onMarkupChange={setMarkup}
        onBack={() => setWorkflowScreen("parameters")}
      />
    );
  }

  return (
    <section className="import-step" aria-labelledby="import-step-title">
      <header className="import-step__header">
        <span aria-hidden="true">01</span>
        <div>
          <p className="section-label">Импорт планировки</p>
          <h2 id="import-step-title">Подготовьте исходный план</h2>
          <p>
            Файл обрабатывается локально и не покидает это устройство.
            Автоматическое распознавание геометрии появится на следующем этапе.
          </p>
        </div>
      </header>

      <div className="import-step__layout">
        <div className="import-preview">
          {sessionFile ? (
            <>
              {plan?.sourceType === "image" && sessionFile.previewUrl ? (
                <div className="import-preview__image">
                  <Image
                    src={sessionFile.previewUrl}
                    alt={`Предпросмотр планировки: ${sessionFile.file.name}`}
                    fill
                    sizes="(max-width: 1023px) 100vw, 62vw"
                    unoptimized
                  />
                </div>
              ) : (
                <div className="import-preview__pdf" role="img" aria-label="PDF-планировка загружена">
                  <span aria-hidden="true">PDF</span>
                  <p>
                    PDF загружен. Детальное распознавание будет доступно на
                    следующем этапе.
                  </p>
                </div>
              )}
              <div className="import-preview__file-actions">
                <label className="import-preview__replace" htmlFor={replaceInputId}>
                  <input
                    id={replaceInputId}
                    type="file"
                    accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf"
                    onChange={handleFileInput}
                  />
                  Заменить файл
                </label>
                <button className="import-preview__replace" type="button" onClick={removeFile}>
                  Удалить файл
                </button>
              </div>
            </>
          ) : (
            <label
              className="import-dropzone"
              htmlFor={inputId}
              onDragOver={(event) => event.preventDefault()}
              onDrop={handleDrop}
            >
              <input
                id={inputId}
                type="file"
                accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf"
                onChange={handleFileInput}
              />
              <span aria-hidden="true">01 / FILE</span>
              <strong>Перетащите планировку сюда</strong>
              <small>или выберите файл · JPG, PNG, PDF · до 20 МБ</small>
            </label>
          )}
          <p className="import-step__error" aria-live="polite">
            {fileError ?? ""}
          </p>
          <ol className="import-flow" aria-label="Как подготовить планировку">
            <li>Загрузите планировку</li>
            <li>Проверьте изображение</li>
            <li>Укажите высоту потолков</li>
            <li>На следующем этапе отметьте один известный размер</li>
            <li>FORMA рассчитает масштаб плана</li>
          </ol>
        </div>

        <aside className="import-summary" aria-labelledby="import-summary-title">
          <p className="section-label">Параметры импорта</p>
          <h2 id="import-summary-title">Исходный файл</h2>

          {sessionFile && plan ? (
            <dl className="import-summary__file">
              <div>
                <dt>Имя</dt>
                <dd title={sessionFile.file.name} aria-label={`Имя файла: ${sessionFile.file.name}`}>
                  {sessionFile.file.name}
                </dd>
              </div>
              <div><dt>Тип</dt><dd>{plan.sourceType === "pdf" ? "PDF" : "Изображение"}</dd></div>
              <div><dt>Размер</dt><dd>{formatImportFileSize(sessionFile.file.size)}</dd></div>
            </dl>
          ) : (
            <p className="import-summary__empty">Файл ещё не выбран.</p>
          )}

          <div className="import-summary__fields">
            <div className="field">
              <label htmlFor="plan-scale">Ручной масштаб (необязательно)</label>
              <div className="field__control">
                <input
                  id="plan-scale"
                  type="number"
                  min="0.0001"
                  step="0.01"
                  inputMode="decimal"
                  placeholder="0.01"
                  value={scaleInput}
                  onChange={(event) => updateScale(event.target.value)}
                  disabled={!sessionFile}
                  aria-invalid={scaleInvalid}
                  aria-describedby={scaleInvalid ? "plan-scale-note plan-scale-error" : "plan-scale-note"}
                />
                <span>м / ед.</span>
              </div>
              <p id="plan-scale-note">
                Если точный масштаб уже известен, его можно указать сейчас.
                Иначе он будет рассчитан по известному размеру стены на этапе
                разметки. 1 единица плана = указанное число метров.
              </p>
              {scaleInvalid && <p className="field-error" id="plan-scale-error">Масштаб должен быть больше нуля.</p>}
            </div>

            <div className="field">
              <label htmlFor="import-ceiling-height">Высота потолков</label>
              <div className="field__control">
                <input
                  id="import-ceiling-height"
                  type="number"
                  min="0.1"
                  step="0.1"
                  inputMode="decimal"
                  value={ceilingInput}
                  onChange={(event) => updateCeilingHeight(event.target.value)}
                  disabled={!sessionFile}
                  aria-invalid={ceilingInvalid}
                  aria-describedby={ceilingInvalid ? "import-ceiling-note import-ceiling-error" : "import-ceiling-note"}
                />
                <span>м</span>
              </div>
              <p id="import-ceiling-note">Отдельная высота, не зависящая от масштаба плана.</p>
              {ceilingInvalid && <p className="field-error" id="import-ceiling-error">Высота должна быть больше нуля.</p>}
            </div>
          </div>

          <div className="import-status" aria-live="polite">
            <p className="section-label">Статус</p>
            <ul>
              <li>{sessionFile ? "Файл загружен" : "Ожидается файл"}</li>
              <li>{scaleReady ? "Ручной масштаб задан" : "Масштаб будет определён при разметке"}</li>
              <li>{ceilingReady ? "Высота потолков задана" : "Укажите высоту потолков"}</li>
              <li>Геометрия ещё не размечена</li>
              {readyForMarkup && <li>Готово к разметке</li>}
            </ul>
            {validation && validation.errors.length > 0 && (
              <p>{validation.errors[0].message}</p>
            )}
          </div>

          <div className="import-step__actions">
            <button
              className="button button--primary"
              type="button"
              disabled={!canOpenMarkup}
              onClick={() => setWorkflowScreen("markup")}
            >
              Перейти к разметке
            </button>
            <p>
              {plan?.sourceType === "pdf" && readyForMarkup
                ? "Интерактивная разметка PDF будет добавлена позже."
                : normalizedPlan && readyForMarkup
                ? "Следующий этап — разметка стен и помещений."
                : "Загрузите файл и задайте параметры импорта."}
            </p>
            <button className="button button--secondary" type="button" onClick={onCancel}>
              Отменить импорт
            </button>
          </div>
        </aside>
      </div>
    </section>
  );
}
