"use client";

import { useState } from "react";
import { useQuery } from "@apollo/client/react";
import { ArrowLeft } from "lucide-react";
import { useTranslations } from "next-intl";
import { useActiveRole } from "@/context/ActiveRoleContext";
import { Link } from "@/i18n/routing";
import { createApiGraphqlClient } from "@/lib/graphql-client";
import { ENTRY } from "@/features/editorial/graphql";
import {
  buttonClass,
  linkClass,
  roleHeaders,
} from "@/features/editorial/presentation";
import DraftEditor from "./DraftEditor";

export default function EditorialEntry({ id }: { id: string }) {
  const { activeRole } = useActiveRole();
  return (
    <RoleEditorialEntry
      key={`${id}:${activeRole}`}
      id={id}
      activeRole={activeRole}
    />
  );
}

function RoleEditorialEntry({
  id,
  activeRole,
}: {
  id: string;
  activeRole: string | null;
}) {
  const t = useTranslations("Editorial");
  const [client] = useState(createApiGraphqlClient);
  const { data, loading, error, refetch } = useQuery(ENTRY, {
    client,
    variables: { id },
    context: { headers: roleHeaders(activeRole) },
    fetchPolicy: "no-cache",
  });
  const entry = data?.editorialManagedEntry;
  return (
    <div className="space-y-5">
      <Link
        href="/dashboard/editorial"
        className={`${linkClass} inline-flex items-center gap-2`}
      >
        <ArrowLeft size={16} aria-hidden="true" />
        {t("admin.back")}
      </Link>
      {loading ? (
        <p role="status">{t("loading")}</p>
      ) : error || !entry || !activeRole ? (
        <div role="alert" className="space-y-3">
          <p>{t("admin.loadError")}</p>
          <button
            type="button"
            className={buttonClass}
            onClick={() => void refetch().catch(() => undefined)}
          >
            {t("retry")}
          </button>
        </div>
      ) : (
        <DraftEditor
          key={`${entry.id}:${activeRole}`}
          initial={entry}
          client={client}
          role={activeRole}
          reload={async () => (await refetch()).data?.editorialManagedEntry}
        />
      )}
    </div>
  );
}
