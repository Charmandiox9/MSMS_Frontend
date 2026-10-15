"use client";
import { useEffect, useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import Modal from "@/components/ui/Modal";
import { FormSkeleton } from "@/components/ui/LoadingSkeletons";
import { apiFetch } from "@/lib/api";
import { createApiGraphqlClient } from '@/lib/graphql-client';
import { PROJECT_OPTIONS, type ProjectOption } from './repository-queries';
import type { ApolloClient } from '@apollo/client';
import { fetchAllTeachers } from "@/lib/teachers";
import type { Teacher } from "@/types/justifications";
import type {
  RepositoryKind,
  RepositoryParticipant,
  RepositoryRecord,
} from "@/types/academic-repository";
import RepositoryFields from "./RepositoryFields";
import RepositoryParticipants from "./RepositoryParticipants";
import {
  fieldClass,
  fieldsPayload,
  initialValues,
  primaryButton,
  secondaryButton,
} from "./repository-fields";

async function projectOptions(client: ApolloClient, errorMessage: string) {
  const first = await client.query({ query: PROJECT_OPTIONS, variables: { filters: { page: 1, pageSize: 100 } }, fetchPolicy: 'no-cache' });
  if (!first.data) throw new Error(errorMessage);
  const items = [...first.data.repositoryProjectOptions.items];
  for (let page = 2; page <= first.data.repositoryProjectOptions.totalPages; page++) {
    const result = await client.query({ query: PROJECT_OPTIONS, variables: { filters: { page, pageSize: 100 } }, fetchPolicy: 'no-cache' });
    if (!result.data) throw new Error(errorMessage);
    items.push(...result.data.repositoryProjectOptions.items);
  }
  return items;
}

export default function RepositoryEditor({
  kind,
  record,
  onClose,
  onSaved,
}: {
  kind: RepositoryKind;
  record: RepositoryRecord | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const t = useTranslations("AcademicRepository");
  const [graphqlClient] = useState(createApiGraphqlClient);
  const [values, setValues] = useState(() => initialValues(kind, record));
  const [participants, setParticipants] = useState<RepositoryParticipant[]>(
    record?.participants ?? [],
  );
  const [projectId, setProjectId] = useState(record?.projectId ?? "");
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [retry, setRetry] = useState(0);
  const errorLabel = t("loadError");
  useEffect(() => {
    let active = true;
    Promise.all([
      fetchAllTeachers(),
      kind === "research" ? projectOptions(graphqlClient, errorLabel) : Promise.resolve([]),
    ])
      .then(([teacherRows, projectRows]) => {
        if (active) {
          setTeachers(teacherRows);
          setProjects(projectRows);
          setLoadError(null);
        }
      })
      .catch((cause: unknown) => {
        if (active)
          setLoadError(cause instanceof Error ? cause.message : errorLabel);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [kind, graphqlClient, retry, errorLabel]);
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (saving || loading || loadError) return;
    setSaving(true);
    const payload = {
      ...fieldsPayload(kind, values),
      participants: participants.map(
        ({ name, role, teacherId, contactEmail, gender }) => ({
          name: name.trim(),
          role: role.trim(),
          teacherId,
          ...(kind === "projects"
            ? {
                contactEmail: contactEmail?.trim() || null,
                gender: gender?.trim() || null,
              }
            : {}),
        }),
      ),
      ...(kind === "research" ? { projectId: projectId || null } : {}),
      ...(record ? { expectedUpdatedAt: record.updatedAt } : {}),
    };
    const operation = apiFetch<RepositoryRecord>(
      `/academic/${kind}${record ? `/${record.id}` : ""}`,
      { method: record ? "PUT" : "POST", body: JSON.stringify(payload) },
    );
    toast.promise(operation, {
      loading: t("saving"),
      success: t(record ? "updated" : "created"),
      error: (cause: unknown) =>
        cause instanceof Error ? cause.message : t("saveError"),
    });
    try {
      await operation;
      onSaved();
    } catch {
      /* The toast reports the error; retain the user's form. */
    } finally {
      setSaving(false);
    }
  };
  return (
    <Modal
      isOpen
      title={t(`${kind}.${record ? "edit" : "create"}`)}
      description={t("formHint")}
      size="4xl"
      onClose={() => {
        if (!saving) onClose();
      }}
      closeOnEscape={!saving}
      closeOnBackdropClick={!saving}
      closeLabel={t("close")}
    >
      <form onSubmit={submit} className="space-y-5">
        {loading ? (
          <FormSkeleton label={t("loading")} />
        ) : loadError ? (
          <div
            role="alert"
            className="rounded-xl border border-red-500/30 bg-red-500/5 p-4 text-sm"
          >
            {loadError}
            <button
              type="button"
              className={`${secondaryButton} ml-3`}
              onClick={() => {
                setLoading(true);
                setRetry((value) => value + 1);
              }}
            >
              {t("retry")}
            </button>
          </div>
        ) : null}
        <RepositoryFields
          kind={kind}
          values={values}
          disabled={saving || loading || !!loadError}
          onChange={(key, value) =>
            setValues((current) => ({ ...current, [key]: value }))
          }
        />
        {kind === "research" && (
          <fieldset
            disabled={saving || loading || !!loadError}
            className="rounded-2xl border border-border p-5"
          >
            <legend className="px-2 text-sm font-bold">
              {t("groups.project")}
            </legend>
            <label className="text-sm font-medium">
              {t("fields.projectId")}
              <select
                value={projectId}
                className={fieldClass}
                onChange={(event) => setProjectId(event.target.value)}
              >
                <option value="">{t("noProject")}</option>
                {projects.map((project) => (
                  <option
                    key={project.id}
                    value={project.id}
                    disabled={
                      !!project.researchId && project.researchId !== record?.id
                    }
                  >
                    {project.code ? `${project.code} · ` : ""}
                    {project.title}
                  </option>
                ))}
              </select>
            </label>
            <p className="mt-2 text-xs text-muted-foreground">
              {t("projectHint")}
            </p>
          </fieldset>
        )}
        <RepositoryParticipants
          kind={kind}
          value={participants}
          teachers={teachers}
          disabled={saving || loading || !!loadError}
          onChange={setParticipants}
        />
        <div className="sticky bottom-0 flex justify-end gap-3 border-t border-border bg-card py-4">
          <button
            type="button"
            disabled={saving}
            className={secondaryButton}
            onClick={onClose}
          >
            {t("cancel")}
          </button>
          <button
            type="submit"
            disabled={saving || loading || !!loadError}
            className={primaryButton}
          >
            {t(saving ? "saving" : "save")}
          </button>
        </div>
      </form>
    </Modal>
  );
}
