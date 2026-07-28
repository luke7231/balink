import type { SourceName } from "../domain/enums.js";

export interface JobPostFilterInput {
  sido?: string | null;
  sigungu?: string | null;
  jobType?: string | null;
  source?: SourceName | null;
}
