// Shared shape for a glossary contribution submission. Kept out of the
// 'use server' actions file so nothing but async functions is exported there
// (a Next.js requirement for server-action modules).

export type ContributionInput = {
  plant_id: string | null;
  plant_not_in_list: string | null;
  plant_name: string;
  plant_scientific: string;
  kind: string;
  proposed_name: string;
  note: string;
  department_code: string;
  commune: string;
  locality: string;
  knowledge_source: string;
  photo_confirmation: string | null;
  photos: string[];
  contributor_name: string;
  contributor_contact: string;
  allow_cite: boolean;
};
