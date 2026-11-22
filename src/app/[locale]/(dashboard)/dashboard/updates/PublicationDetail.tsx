"use client";

import { useState } from "react";
import { useQuery } from "@apollo/client/react";
import { CombinedGraphQLErrors } from "@apollo/client/errors";
import { ArrowLeft } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { createApiGraphqlClient } from "@/lib/graphql-client";
import { EditorialContent } from "@/features/editorial/EditorialContent";
import { PUBLICATION } from "@/features/editorial/graphql";
import { buttonClass, linkClass } from "@/features/editorial/presentation";
import type { EditorialKind } from "@/features/editorial/schema-types";

export default function PublicationDetail({
  id,
  kind,
}: {
  id: string;
  kind: EditorialKind;
}) {
  const t = useTranslations("Editorial");
  const [client] = useState(createApiGraphqlClient);
  const { data, loading, error, refetch } = useQuery(PUBLICATION, {
    client,
    fetchPolicy: "no-cache",
    variables: { id },
  });
  const publication = data?.editorialPublication;
  const unavailable =
    CombinedGraphQLErrors.is(error) &&
    error.errors.some((issue) => {
      const original = issue.extensions?.originalError;
      return (
        original &&
        typeof original === "object" &&
        "statusCode" in original &&
        (original.statusCode === 404 || original.statusCode === 400)
      );
    });
  return (
    <div className="space-y-5">
      <Link
        href={
          kind === "GUIDE"
            ? "/dashboard/updates?tab=guides"
            : "/dashboard/updates"
        }
        className={`${linkClass} inline-flex items-center gap-2`}
      >
        <ArrowLeft size={16} aria-hidden="true" />
        {t(kind === "GUIDE" ? "backGuides" : "backNews")}
      </Link>
      {loading ? (
        <p role="status">{t("loading")}</p>
      ) : error && !unavailable ? (
        <div role="alert" className="space-y-3">
          <p>{t("loadError")}</p>
          <button
            type="button"
            className={buttonClass}
            onClick={() => void refetch().catch(() => undefined)}
          >
            {t("retry")}
          </button>
        </div>
      ) : publication?.published && publication.kind === kind ? (
        <EditorialContent
          publication={publication}
          revision={publication.published}
        />
      ) : (
        <p role="status">{t("unavailable")}</p>
      )}
    </div>
  );
}
