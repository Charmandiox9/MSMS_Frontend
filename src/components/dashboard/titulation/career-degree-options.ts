const CAREER_DEGREE_OPTIONS: Readonly<Record<string, readonly string[]>> = {
  BM: ["Biólogo Marino", "Bióloga Marina"],
  IA: ["Ingeniero en Acuicultura", "Ingeniera en Acuicultura"],
  "8506": [
    "Ingeniero en Prevención de Riesgos y Medioambiente",
    "Ingeniera en Prevención de Riesgos y Medioambiente",
  ],
};

export function getCareerDegreeOptions(
  careerCode: string | null | undefined,
): readonly string[] {
  const normalizedCode = careerCode?.trim().toUpperCase();
  return normalizedCode ? (CAREER_DEGREE_OPTIONS[normalizedCode] ?? []) : [];
}
