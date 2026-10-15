import { useFormatter, useTranslations } from "next-intl";
import Modal from "@/components/ui/Modal";
import type {
  RepositoryKind,
  RepositoryRecord,
} from "@/types/academic-repository";
import { groupsFor, primaryButton } from "./repository-fields";

export default function RepositoryDetails({
  kind,
  record,
  onClose,
  onEdit,
}: {
  kind: RepositoryKind;
  record: RepositoryRecord;
  onClose: () => void;
  onEdit: () => void;
}) {
  const t = useTranslations("AcademicRepository");
  const format = useFormatter();
  return (
    <Modal
      isOpen
      title={record.title}
      eyebrow={t(`${kind}.title`)}
      size="4xl"
      onClose={onClose}
      closeLabel={t("close")}
      footer={
        <button type="button" className={primaryButton} onClick={onEdit}>
          {t("edit")}
        </button>
      }
    >
      <div className="space-y-6">
        {groupsFor(kind).map((group) => (
          <section key={group.key}>
            <h2 className="mb-3 text-sm font-bold text-primary">
              {t(`groups.${group.key}`)}
            </h2>
            <dl className="grid gap-4 sm:grid-cols-2">
              {group.fields.map((field) => {
                const raw = record[field.key];
                const value =
                  raw === null || raw === undefined || raw === ""
                    ? t("unknown")
                    : field.type === "boolean"
                      ? t(raw ? "yes" : "no")
                      : field.type === "status"
                        ? t(`statuses.${raw}`)
                        : field.type === "date"
                          ? format.dateTime(new Date(String(raw)), {
                              dateStyle: "medium",
                              timeZone: "UTC",
                            })
                          : field.type === "money"
                            ? format.number(Number(raw), {
                                style: "currency",
                                currency: record.currency ?? "CLP",
                                maximumFractionDigits: 2,
                              })
                          : String(raw);
                return (
                  <div
                    key={field.key}
                    className={field.type === "textarea" ? "sm:col-span-2" : ""}
                  >
                    <dt className="text-xs font-medium text-muted-foreground">
                      {t(`fields.${field.key}`)}
                    </dt>
                    <dd className="mt-1 break-words whitespace-pre-wrap text-sm text-foreground">
                      {field.key === "folderUrl" &&
                      typeof raw === "string" &&
                      /^https?:\/\//i.test(raw) ? (
                        <a
                          href={raw}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary underline"
                        >
                          {t("openFolder")}
                        </a>
                      ) : (
                        value
                      )}
                    </dd>
                  </div>
                );
              })}
            </dl>
          </section>
        ))}
        {kind === "research" && (
          <section>
            <h2 className="mb-2 text-sm font-bold text-primary">
              {t("groups.project")}
            </h2>
            <p className="text-sm">{record.project?.title ?? t("noProject")}</p>
          </section>
        )}
        {record.research && (
          <p className="text-sm">
            {t("linkedResearch", { title: record.research.title })}
          </p>
        )}
        <section>
          <h2 className="mb-3 text-sm font-bold text-primary">
            {t("groups.participants")}
          </h2>
          {record.participants.length ? (
            <ul className="space-y-3">
              {record.participants.map((participant, index) => (
                <li
                  key={participant.id ?? index}
                  className="rounded-xl bg-muted/40 p-3 text-sm"
                >
                  <p className="font-semibold">{participant.name}</p>
                  <p className="text-muted-foreground">{participant.role}</p>
                  {participant.contactEmail && (
                    <p className="break-words">{participant.contactEmail}</p>
                  )}
                  {participant.gender && (
                    <p>
                      {t("fields.gender")}: {participant.gender}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">
              {t("noParticipants")}
            </p>
          )}
        </section>
        <p className="text-xs text-muted-foreground">
          {t("outputCount", { count: record._count.outputs })}
        </p>
      </div>
    </Modal>
  );
}
