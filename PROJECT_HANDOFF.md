# FORMA Project Handoff

## Freeze date

2026-09-07

## Reason

Project paused for approximately four months while owner is at sea.

## Repository

`/Users/cudoudo/WebProjects/forma`

## Stable checkpoint before current topology work

Commit:
`c8e6f25588503ee788c2cec56a1221066b198142`

Message:
`FORMA: add door and window plan markup`

## Freeze commit

`TO_BE_FILLED_AFTER_COMMIT`

## Freeze tag

`forma-freeze-2026-09-07`

## Current branch

`main`

## Environment

- Operating system: macOS
- Node: `v24.19.0`
- npm: `11.17.0`
- Git: `2.50.1 (Apple Git-155)`
- Next.js: `16.3.3`
- three: `0.185.1`
- @react-three/fiber: `9.7.0`

## What already works

- The original FORMA Planner manual workflow and its steps remain available.
- Local JPG/JPEG/PNG/PDF floor-plan import foundation and safe local preview.
- Scale calibration using two image points and a known real-world length.
- Canonical geometry in intrinsic image pixels, including non-square images.
- Manual wall segment markup with derived metric lengths.
- Manual room polygons, area, perimeter, centroid labels, rename, and delete.
- Duplicate-point and self-intersection protection for room polygons.
- Manual door/window markup bound to source wall IDs.
- Opening selection, dimension/position editing, deletion, and wall-delete cascade.
- Import workflow session persistence, scale reset/recalibration preservation, and file-replacement reset.
- Assisted room-boundary snapping to architectural nodes and source walls.
- Architectural graph foundation derived from source markup without mutating it.
- Deterministic endpoint clustering in intrinsic pixel space.
- Endpoint-to-wall-interior T-junction detection and derived edge splitting.
- Source wall identity and opening references preserved across derived splits.
- Room-to-wall coverage diagnostics with orientation-independent matching and interval union.
- Numerical per-segment candidate trace and complete source-to-derived wall inventory.
- Runtime wall-path counters have been added for STEP 05C.5F, but have not yet been verified against the failing browser session.
- Existing manual-room Three.js preview, room switching, openings, and camera presets.

## Current topology work

- **STEP 05C.5 — Architectural Graph Foundation:** derived nodes, wall edges, room boundary association, and connectivity diagnostics.
- **STEP 05C.5A — Junction & Boundary Refinement:** endpoint-interior T-junctions, deterministic derived splitting, and improved boundary coverage union.
- **STEP 05C.5B — Room Boundary Diagnostics / Matching Refinement:** orientation-independent matching, gap handling, and clearer segment statuses.
- **STEP 05C.5C — Real Room Boundary Trace:** normalized/pixel endpoints, candidate geometry, angles, distances, projections, and rejection reasons.
- **STEP 05C.5D — Source → Derived Wall Inventory:** source-wall inventory, split-edge/node traceability, and missing-boundary-wall status.
- **STEP 05C.5E — Source Wall Audit Diagnostics:** full source-wall orientation/classification and compatibility ranking.
- **STEP 05C.6 — Room Boundary Snapping:** node-first, wall-second, free-point fallback with intrinsic-pixel snapping and draft preview.
- **STEP 05C.5F — Runtime wall-path diagnosis (started, unresolved):** counters exist for UI walls, connectivity input, function input, normalized source walls, derived segments, nodes, and edges. The failing real browser session has not yet been used to read these counters, so the first zero-wall boundary is not proven.

## Current unresolved issue

REAL BROWSER OBSERVATION:

The imported plan visibly shows marked wall overlays, but Connectivity Diagnostics currently displayed:

- Nodes: 0
- Wall connections: 0
- Linked rooms: 0 / 7
- Problems: 7

Room boundary traces consequently show:

- Compatible source walls: 0
- Compatible derived segments: 0

This suggests an upstream runtime/data wiring issue may exist between the wall markup displayed in the UI and the wall array consumed by `buildArchitecturalGraph`/connectivity diagnostics.

**THIS HAS NOT YET BEEN PROVEN.** The visually present dark lines may be background-image geometry rather than stored `ImportedWall` SVG overlays. Static code inspection shows both SVG rendering and connectivity currently read `markup.walls`, so the new runtime counters must be checked before changing code.

Do not resume by changing geometry tolerances.

## Next exact task

STEP 05C.5F

Trace:

`markup.walls` → `plan-markup-step` → `buildArchitecturalGraph` → source wall inventory → derived segments → diagnostics

Determine the first boundary where non-empty walls become zero. Compare:

- UI markup wall count
- Connectivity input wall count
- Function received wall count
- Source normalized wall count
- Derived segment count
- Node count
- Edge count

Open **Связность плана → Показать диагностику → Путь данных стен** and record every count and ID list from the real session.

Do not redraw the plan until it is proven that `markup.walls` itself is empty.

## Important geometry rules

- Normalized coordinates (`0..1`) are the persisted storage format.
- Canonical topology and distance calculations use intrinsic image pixels.
- `xPx = normalizedX * naturalWidth`
- `yPx = normalizedY * naturalHeight`
- Never use naïve normalized Euclidean distance for canonical geometry.
- Non-square images are supported and must remain correct.
- Linked room threshold remains `>= 90%`.
- Partial room threshold remains `>= 50%`.
- Endpoint graph tolerance remains `8` intrinsic pixels.
- Boundary distance tolerance remains `12` intrinsic pixels.
- Do not loosen tolerances merely to make diagnostics green.

## Important product rules

- Source markup is the source of truth.
- The architectural graph is deterministic derived data.
- Never mutate source walls, rooms, openings, or calibration during diagnostics.
- Do not automatically create missing walls yet.
- Do not generate imported 3D yet.
- Do not add AI, CV, or OCR yet.
- Do not skip topology correctness before imported 3D conversion.

## Safety rules

- NORD GARAGE must never be modified by FORMA tasks.
- PocketOptionBot must never be modified by FORMA tasks.
- Never use `git add .` or `git add -A` for checkpoint work.
- Stage exact reviewed files only.
- Do not push unless explicitly authorized.
- Do not update dependencies as the first action after returning.

## First actions after returning

1. Read `PROJECT_HANDOFF.md`.
2. Run `git status --short`.
3. Verify tag `forma-freeze-2026-09-07`.
4. Verify the final freeze commit recorded below.
5. Check Node and npm versions against this document.
6. Run `npm install` only if `node_modules` is missing. Prefer `npm ci` when recreating the environment.
7. Do not upgrade packages.
8. Run `npx tsc --noEmit --incremental false`, `npm run lint`, and `npm run build -- --webpack`.
9. Start the application with `npm run dev`.
10. Open `http://localhost:3000/planner`.
11. Reproduce the current plan/session if it is still available.
12. Continue STEP 05C.5F by reading the runtime wall-path counters.
13. Do not begin imported 3D until the connectivity problem is resolved.

## Backup locations

- Backup directory: `TO_BE_FILLED_AFTER_BACKUP`
- Git bundle: `TO_BE_FILLED_AFTER_BACKUP`
- Source archive: `TO_BE_FILLED_AFTER_BACKUP`
- Checksums: `TO_BE_FILLED_AFTER_BACKUP`
- Freeze metadata: `TO_BE_FILLED_AFTER_BACKUP`

## Restore procedure

### Restore from the Git tag in this repository

1. Verify the tag with `git show --no-patch forma-freeze-2026-09-07`.
2. Create a recovery branch without changing the preserved branch: `git switch -c forma-recovery forma-freeze-2026-09-07`.
3. Install dependencies only if needed, preferably with `npm ci`.
4. Run the three health checks listed above before development.

### Restore from the Git bundle

1. Verify it: `git bundle verify /path/to/forma-freeze-2026-09-07.bundle`.
2. Clone it into a new empty directory: `git clone /path/to/forma-freeze-2026-09-07.bundle forma-restored`.
3. Enter the clone, inspect branches/tags, and switch to `forma-freeze-2026-09-07` on a new recovery branch.
4. Run `npm ci` and the health checks.

### Restore from the source archive

1. Verify its SHA-256 against `SHA256SUMS.txt`.
2. Extract into a new empty directory: `tar -xzf forma-source-freeze-2026-09-07.tar.gz`.
3. The archive is source-only and excludes `.git`, `.next`, `node_modules`, logs, and caches.
4. Use it when Git history is unavailable; initialize a new repository only after preserving the extracted copy.
