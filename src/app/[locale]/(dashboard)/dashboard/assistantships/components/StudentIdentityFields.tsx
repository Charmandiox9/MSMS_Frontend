import { useState } from "react";
import { useQuery } from "@apollo/client/react";
import { useTranslations } from "next-intl";
import { STUDENT, type Assistantship } from "../graphql";
import type { AssistantshipCareerOption } from "../schema-types";
import { Field, inputClass, buttonClass } from "./controls";

export function useAssistantshipStudent(
  initialRecord: Assistantship | undefined,
  careers: AssistantshipCareerOption[],
) {
  const [email, setEmail] = useState(initialRecord?.assistantEmail ?? "");
  const [lookupEmail, setLookupEmail] = useState(
    initialRecord?.assistantEmail.toLowerCase() ?? "",
  );
  const [manualName, setManualName] = useState(
    initialRecord?.assistantName ?? "",
  );
  const [curriculumId, setCurriculumId] = useState(
    initialRecord?.careerCurriculumVersionId ?? "",
  );
  const normalizedEmail = email.trim().toLowerCase();
  const lookup = useQuery(STUDENT, {
    variables: { email: lookupEmail },
    skip: !lookupEmail,
    fetchPolicy: "network-only",
  });
  const lookupCurrent = !!lookupEmail && lookupEmail === normalizedEmail;
  const student = lookupCurrent ? lookup.data?.assistantshipStudent : undefined;
  const effectiveCurriculumId =
    student?.careerCurriculumVersionId ?? curriculumId;
  const studentCareer = careers.find((career) =>
    career.curriculumVersions.some(
      (version) => version.id === effectiveCurriculumId,
    ),
  );
  const lookupReady =
    lookupCurrent &&
    !lookup.loading &&
    !lookup.error &&
    lookup.data !== undefined;
  return {
    email,
    setEmail,
    setLookupEmail,
    manualName,
    setManualName,
    setCurriculumId,
    normalizedEmail,
    lookup,
    lookupCurrent,
    student,
    effectiveCurriculumId,
    studentCareer,
    lookupReady,
  };
}

export default function StudentIdentityFields({
  identity,
  careers,
  onEmailChange,
  onCurriculumChange,
}: {
  identity: ReturnType<typeof useAssistantshipStudent>;
  careers: AssistantshipCareerOption[];
  onEmailChange: () => void;
  onCurriculumChange: () => void;
}) {
  const t = useTranslations("AssistantshipsPage");
  const {
    student,
    manualName,
    setManualName,
    email,
    setEmail,
    setCurriculumId,
    normalizedEmail,
    setLookupEmail,
    lookupCurrent,
    lookup,
    effectiveCurriculumId,
  } = identity;
  return (
    <>
      <Field label={t("form.name")} htmlFor="register-name">
        <input
          id="register-name"
          name="name"
          value={student?.name ?? manualName}
          readOnly={!!student}
          onChange={(event) => setManualName(event.target.value)}
          className={inputClass}
          autoComplete="name"
          maxLength={200}
          required
        />
      </Field>
      <Field label={t("form.email")} htmlFor="register-email">
        <input
          id="register-email"
          name="email"
          value={email}
          onChange={(event) => {
            setEmail(event.target.value);
            setCurriculumId("");
            onEmailChange();
          }}
          onBlur={(event) => {
            if (event.target.validity.valid && normalizedEmail)
              setLookupEmail(normalizedEmail);
          }}
          type="email"
          className={inputClass}
          autoComplete="email"
          maxLength={254}
          required
        />
      </Field>
      <div className="sm:col-span-2" aria-live="polite">
        {!lookupCurrent ? (
          <p className="text-xs text-muted-foreground">
            {t("form.lookupHint")}
          </p>
        ) : lookup.loading ? (
          <p role="status">{t("loading")}</p>
        ) : lookup.error ? (
          <div role="alert">
            {t("errors.load")}{" "}
            <button
              type="button"
              className={buttonClass}
              onClick={() => void lookup.refetch().catch(() => undefined)}
            >
              {t("retry")}
            </button>
          </div>
        ) : (
          <p className="text-xs text-secondary">
            {t(student ? "form.studentFound" : "form.studentNew")}
          </p>
        )}
      </div>
      {student?.careerCurriculumVersionId ? (
        <p className="text-sm text-foreground sm:col-span-2">
          {t("form.studentCareer")}: {student.careerName}
        </p>
      ) : (
        <Field
          label={t("form.studentCurriculum")}
          htmlFor="register-curriculum"
        >
          <select
            id="register-curriculum"
            required
            className={inputClass}
            value={effectiveCurriculumId}
            onChange={(event) => {
              setCurriculumId(event.target.value);
              onCurriculumChange();
            }}
          >
            <option value="">{t("form.selectCareer")}</option>
            {careers
              .filter((career) => career.isActive)
              .map((career) => (
                <optgroup key={career.id} label={career.name}>
                  {career.curriculumVersions.map((version) => (
                    <option key={version.id} value={version.id}>
                      {career.name} ·{" "}
                      {t("form.cohort", { year: version.cohortYear })}
                    </option>
                  ))}
                </optgroup>
              ))}
          </select>
        </Field>
      )}
    </>
  );
}
