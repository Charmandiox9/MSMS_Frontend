import type {
  RepositoryFieldGroup,
  RepositoryFormValues,
  RepositoryKind,
  RepositoryRecord,
} from "@/types/academic-repository";

const identity: RepositoryFieldGroup = {
  key: "identity",
  fields: [
    { key: "title", required: true, maxLength: 500 },
    { key: "code", maxLength: 100 },
    { key: "academicUnit", required: true, maxLength: 200 },
  ],
};
const period: RepositoryFieldGroup = {
  key: "period",
  fields: [
    { key: "startsOn", type: "date" },
    { key: "endsOn", type: "date" },
  ],
};
export const projectGroups: RepositoryFieldGroup[] = [
  {
    key: "identity",
    fields: [
      ...identity.fields,
      { key: "reportingYear", type: "number", required: true },
      { key: "status", type: "status", required: true },
      { key: "faculty" },
      { key: "resolution" },
      { key: "classification" },
      { key: "officialized", type: "boolean" },
    ],
  },
  {
    key: "funding",
    fields: [
      { key: "fundingSource" },
      { key: "program" },
      { key: "competition" },
      { key: "applicationArea" },
      { key: "participationScope" },
    ],
  },
  {
    key: "period",
    fields: [
      ...period.fields,
      { key: "revisedEndsOn", type: "date" },
      { key: "closedOn", type: "date" },
    ],
  },
  {
    key: "amounts",
    fields: [
      { key: "currency", maxLength: 3 },
      ...(
        [
          "totalAmount",
          "vraContribution",
          "vridtContribution",
          "recoveryAmount",
          "facultyContribution",
          "depreciationAmount",
          "profitabilityAmount",
        ] as const
      ).map((key) => ({ key, type: "money" as const })),
    ],
  },
  {
    key: "notes",
    fields: [
      { key: "folderUrl", type: "url", maxLength: 2000 },
      { key: "notes", type: "textarea", maxLength: 10000 },
    ],
  },
];
export const researchGroups: RepositoryFieldGroup[] = [
  identity,
  {
    key: "research",
    fields: [
      { key: "researchArea" },
      { key: "description", type: "textarea", maxLength: 10000 },
    ],
  },
  period,
];
export const groupsFor = (kind: RepositoryKind) =>
  kind === "projects" ? projectGroups : researchGroups;
export const fieldsFor = (kind: RepositoryKind) =>
  groupsFor(kind).flatMap((group) => group.fields);
export function initialValues(
  kind: RepositoryKind,
  record: RepositoryRecord | null,
): RepositoryFormValues {
  return Object.fromEntries(
    fieldsFor(kind)
      .map((field) => {
        const raw = record?.[field.key];
        const value = raw === null || raw === undefined ? "" : String(raw);
        return [field.key, field.type === "date" ? value.slice(0, 10) : value];
      })
      .concat(
        kind === "projects" && !record
          ? [
              ["reportingYear", String(new Date().getFullYear())],
              ["status", "REGISTERED"],
            ]
          : [],
      ),
  );
}
export function fieldsPayload(
  kind: RepositoryKind,
  values: RepositoryFormValues,
) {
  return Object.fromEntries(
    fieldsFor(kind).map(({ key, type }) => {
      const value = values[key]?.trim() ?? "";
      return [
        key,
        value === ""
          ? null
          : type === "number"
            ? Number(value)
            : type === "boolean"
              ? value === "true"
              : key === "currency"
                ? value.toUpperCase()
                : value,
      ];
    }),
  );
}
export const fieldClass =
  "mt-1 block w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:opacity-60";
export const primaryButton =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground transition hover:opacity-90 disabled:opacity-50";
export const secondaryButton =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-sm font-semibold text-foreground transition hover:bg-muted disabled:opacity-50";
