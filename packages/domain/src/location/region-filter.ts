import { listAdminDistrictGroups } from "./admin-districts.js";

export type RegionFilterClause = {
  sido?: string;
  sigungu?: string;
};

/**
 * Build hierarchical region clauses for multi-select filters.
 *
 * - Sido with no selected districts → whole sido
 * - Sido with selected districts → (sido ∧ sigungu) per district
 * - Orphan sigungu (no parent sido selected) → pair with known parent(s), else sigungu only
 *
 * Callers OR these clauses together. Never OR bare sido with its own districts.
 */
export function buildRegionFilterClauses(
  sidos: string[],
  sigungus: string[],
): RegionFilterClause[] {
  if (sidos.length === 0 && sigungus.length === 0) return [];

  const groups = listAdminDistrictGroups();
  const districtsBySido = new Map(groups.map((group) => [group.sido, group.districts]));
  const parentsBySigungu = new Map<string, string[]>();
  for (const group of groups) {
    for (const district of group.districts) {
      const parents = parentsBySigungu.get(district) ?? [];
      parents.push(group.sido);
      parentsBySigungu.set(district, parents);
    }
  }

  const sigunguSet = new Set(sigungus);
  const coveredSigungus = new Set<string>();
  const clauses: RegionFilterClause[] = [];

  for (const sido of sidos) {
    const districts = districtsBySido.get(sido) ?? [];
    const selectedUnder = districts.filter((district) => sigunguSet.has(district));
    if (selectedUnder.length === 0) {
      clauses.push({ sido });
      continue;
    }
    for (const sigungu of selectedUnder) {
      clauses.push({ sido, sigungu });
      coveredSigungus.add(sigungu);
    }
  }

  for (const sigungu of sigungus) {
    if (coveredSigungus.has(sigungu)) continue;
    const parents = parentsBySigungu.get(sigungu) ?? [];
    if (parents.length === 0) {
      clauses.push({ sigungu });
      continue;
    }
    for (const sido of parents) {
      clauses.push({ sido, sigungu });
    }
  }

  return clauses;
}
