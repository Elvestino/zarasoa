export interface StudentSummary {
  id: string;
  userId: string;
  registrationNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string | null;
  accountStatus: string;
  enrollmentStatus: string;
  approvedAt: Date;
  filiere: { id: string; code: string; name: string };
  parcours: { id: string; code: string; name: string } | null;
  level: { id: string; code: string; label: string };
}

export interface StudentFilters {
  search?: string;
  filiereId?: string;
  levelId?: string;
  page: number;
  pageSize: number;
}

export const studentFullName = (s: Pick<StudentSummary, "firstName" | "lastName">) => `${s.lastName} ${s.firstName}`.trim();
