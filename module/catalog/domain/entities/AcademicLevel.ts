export type AcademicLevelCode = "L1" | "L2" | "L3" | "M1" | "M2";

export interface AcademicLevel {
  id: string;
  code: AcademicLevelCode;
  label: string;
  cycle: "licence" | "master";
  sortOrder: number;
  isActive: boolean;
}
