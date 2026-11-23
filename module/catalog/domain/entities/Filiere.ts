export interface Parcours {
  id: string;
  filiereId: string;
  code: string;
  name: string;
  isActive: boolean;
}

export interface Filiere {
  id: string;
  code: string;
  name: string;
  facultyName: string | null;
  isActive: boolean;
  parcours: Parcours[];
}
