export interface CourseSummary {
  id: string;
  title: string;
  summary: string | null;
  subjectCode: string;
  subjectName: string;
}

export interface CourseDetail extends CourseSummary {
  description: string | null;
  professorName: string | null;
  publishedAt: Date | null;
}
