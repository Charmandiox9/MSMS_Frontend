import {
  AlertCircle,
  CheckCircle2,
  CircleHelp,
  Clock3,
  FileCheck2,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import SearchHighlight from "@/components/ui/SearchHighlight";
import StatusBadge from "@/components/ui/StatusBadge";
import TitulationStageBadge from "./TitulationStageBadge";
import TitulationOutcomeBadge from "./TitulationOutcomeBadge";
import TitulationAttachments from "./TitulationAttachments";
import TitulationDocumentDrafts from "./TitulationDocumentDrafts";
import type { TitulationProcess } from "./titulation-types";

const DOCUMENTS = [
  ["defenseAnnexesStatus", "defenseAnnexes"],
  ["thesisSummaryStatus", "thesisSummary"],
  ["libraryFormStatus", "libraryForm"],
  ["actaStatus", "acta"],
  ["evaluationsStatus", "evaluations"],
] as const;
const CORE_FIELDS = [
  "studentRut",
  "studentEmail",
  "studentPhone",
  "degree",
  "thesisTopic",
  "guideName",
  "reviewerOneName",
  "reviewerTwoName",
  "defenseDate",
] as const;
const DOCUMENT_ICONS = {
  UNVERIFIED: CircleHelp,
  PENDING: Clock3,
  RECEIVED: CheckCircle2,
  PREPARED: FileCheck2,
};

function DetailValue({
  label,
  value,
  missing,
  query,
}: {
  label: string;
  value: string | null;
  missing: string;
  query: string;
}) {
  return (
    <div className="min-w-0">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="mt-1 break-words text-base leading-relaxed text-foreground">
        {value ? (
          <SearchHighlight text={value} query={query} />
        ) : (
          <span className="text-muted-foreground">{missing}</span>
        )}
      </dd>
    </div>
  );
}

export default function TitulationRecordDetails({
  process,
  query,
  defenseDate,
  canManage,
}: {
  process: TitulationProcess;
  query: string;
  defenseDate: string;
  canManage: boolean;
}) {
  const t = useTranslations("TitulationPage");
  const missing = CORE_FIELDS.filter((field) => !process[field]);
  const value = (label: string, text: string | null) => (
    <DetailValue
      label={label}
      value={text}
      missing={t("missingValue")}
      query={query}
    />
  );

  return (
    <div className="space-y-6">
      <header className="space-y-3">
        <h3 className="text-xl font-semibold text-foreground">
          <SearchHighlight text={process.studentName} query={query} />
        </h3>
        <div className="flex flex-wrap gap-2">
          <TitulationOutcomeBadge
            outcome={process.outcome}
            label={t(`outcomes.${process.outcome}`)}
          />
          <TitulationStageBadge
            stage={process.stage}
            label={t(`statuses.${process.stage}`)}
          />
        </div>
        <p className="text-sm text-muted-foreground">
          {t(`sources.${process.source}`)}
        </p>
      </header>

      {missing.length > 0 && (
        <div className="space-y-2 rounded-xl bg-warning/10 p-4" role="status">
          <p className="flex items-center gap-2 text-sm font-semibold text-warning">
            <AlertCircle className="size-4 shrink-0" aria-hidden="true" />
            {t("workflow.missing", { count: missing.length })}
          </p>
          <p className="text-sm leading-relaxed text-foreground">
            {t("workflow.missingHelp")}
          </p>
        </div>
      )}

      <section className="space-y-3" aria-labelledby="titulation-student-title">
        <h3
          id="titulation-student-title"
          className="text-base font-semibold text-foreground"
        >
          {t("workflow.student")}
        </h3>
        {process.student ? (
          <div className="space-y-2 rounded-xl bg-muted/50 p-3">
            <p className="text-sm text-foreground">
              {t("workflow.linkedStudent", { name: process.student.name })}
            </p>
            <Link
              href={`/dashboard/students/${encodeURIComponent(process.student.id)}/progress`}
              className="inline-flex min-h-11 items-center text-sm font-medium text-primary underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-primary"
            >
              {t("workflow.studentRecord")}
            </Link>
          </div>
        ) : (
          <p className="text-sm text-warning">
            {t("workflow.studentUnlinked")}
          </p>
        )}
        <dl className="grid gap-4 sm:grid-cols-2">
          {value(t("form.studentRut"), process.studentRut)}
          {value(t("form.studentEmail"), process.studentEmail)}
          {value(t("form.studentPhone"), process.studentPhone)}
          {value(t("form.career"), process.careerName)}
        </dl>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {t("workflow.snapshotHelp")}
        </p>
      </section>

      <section
        className="space-y-3 border-t border-border pt-5"
        aria-labelledby="titulation-thesis-title"
      >
        <h3
          id="titulation-thesis-title"
          className="text-base font-semibold text-foreground"
        >
          {t("workflow.thesis")}
        </h3>
        <dl className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            {value(t("form.thesisTopic"), process.thesisTopic)}
          </div>
          <div className="sm:col-span-2">
            {value(t("form.degree"), process.degree)}
          </div>
          {value(t("committeeRoles.guide"), process.guideName)}
          {value(t("committeeRoles.coGuide"), process.coGuideName)}
          {value(t("committeeRoles.reviewerOne"), process.reviewerOneName)}
          {value(t("committeeRoles.reviewerTwo"), process.reviewerTwoName)}
        </dl>
      </section>

      <section
        className="space-y-3 border-t border-border pt-5"
        aria-labelledby="titulation-defense-title"
      >
        <h3
          id="titulation-defense-title"
          className="text-base font-semibold text-foreground"
        >
          {t("workflow.defense")}
        </h3>
        <dl>{value(t("form.defenseDate"), defenseDate)}</dl>
      </section>

      <section
        className="space-y-3 border-t border-border pt-5"
        aria-labelledby="titulation-documents-title"
      >
        <h3
          id="titulation-documents-title"
          className="text-base font-semibold text-foreground"
        >
          {t("documentsTitle")}
        </h3>
        <ul className="divide-y divide-border">
          {DOCUMENTS.map(([field, document]) => (
            <li
              key={field}
              className="flex flex-wrap items-center justify-between gap-3 py-3"
            >
              <span className="text-base text-foreground">
                {t(`documents.${document}`)}
              </span>
              <StatusBadge
                label={t(`documentStatus.${process[field]}`)}
                icon={DOCUMENT_ICONS[process[field]]}
                tone={
                  process[field] === "RECEIVED"
                    ? "success"
                    : process[field] === "UNVERIFIED"
                      ? "warning"
                      : "neutral"
                }
              />
            </li>
          ))}
        </ul>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {t("documentsManualNote")}
        </p>
      </section>

      {canManage && (
        <>
          <details className="rounded-xl border border-border p-4">
            <summary className="min-h-11 cursor-pointer content-center text-base font-semibold text-foreground focus-visible:outline-2 focus-visible:outline-primary">
              {t("workflow.receivedFiles")}
            </summary>
            <div className="mt-4">
              <TitulationAttachments
                key={`${process.id}-attachments`}
                processId={process.id}
              />
            </div>
          </details>
          {process.documentDrafts.length > 0 && (
            <details className="rounded-xl border border-border p-4">
              <summary className="min-h-11 cursor-pointer content-center text-base font-semibold text-foreground focus-visible:outline-2 focus-visible:outline-primary">
                {t("workflow.generateDocuments")}
              </summary>
              <div className="mt-4">
                <TitulationDocumentDrafts
                  key={`${process.id}-drafts`}
                  processId={process.id}
                  reference={process.reference}
                  drafts={process.documentDrafts}
                />
              </div>
            </details>
          )}
        </>
      )}
    </div>
  );
}
