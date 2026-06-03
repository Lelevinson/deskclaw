// The catalogue grid layout (DESIGN §3.3: 4 cols desktop / 2 ≤980px / 1 mobile,
// 26px gap). Shared so the real grid (CatalogueBrowser) and its loading skeleton
// (app/loading.tsx) can't drift — change the columns/gap/breakpoints in one place.
export const CATALOGUE_GRID =
  "grid grid-cols-1 gap-[26px] min-[600px]:grid-cols-2 min-[980px]:grid-cols-4";
