import { useTranslations } from "next-intl";
import {
  academicDegrees,
  teacherCertifications,
  type AcademicDegree,
  type TeacherCertification,
} from "@/types/hourly-payments";

export interface TeacherAcademicProfile {
  rut: string;
  academicUnit: string;
  academicDegree: AcademicDegree | "";
  certification: TeacherCertification | "";
  joinedOn: string;
  leftOn: string;
}

export default function TeacherProfileFields({
  value,
  onChange,
  fieldClass,
}: {
  value: TeacherAcademicProfile;
  onChange: (value: TeacherAcademicProfile) => void;
  fieldClass: string;
}) {
  const t = useTranslations("HourlyPayments");
  const update = <K extends keyof TeacherAcademicProfile>(
    key: K,
    next: TeacherAcademicProfile[K],
  ) => onChange({ ...value, [key]: next });
  return (
    <>
      <label className="text-sm font-semibold">
        {t("rut")}
        <input
          maxLength={12}
          value={value.rut}
          onChange={(event) => update("rut", event.target.value)}
          className={fieldClass}
        />
      </label>
      <label className="text-sm font-semibold">
        {t("academicUnit")}
        <input
          maxLength={100}
          value={value.academicUnit}
          onChange={(event) => update("academicUnit", event.target.value)}
          className={fieldClass}
        />
      </label>
      <label className="text-sm font-semibold">
        {t("degree")}
        <select
          value={value.academicDegree}
          onChange={(event) =>
            update("academicDegree", event.target.value as AcademicDegree | "")
          }
          className={fieldClass}
        >
          <option value="">{t("notRecorded")}</option>
          {academicDegrees.map((degree) => (
            <option key={degree} value={degree}>
              {t(`degrees.${degree}`)}
            </option>
          ))}
        </select>
      </label>
      <label className="text-sm font-semibold">
        {t("certification")}
        <select
          value={value.certification}
          onChange={(event) =>
            update(
              "certification",
              event.target.value as TeacherCertification | "",
            )
          }
          className={fieldClass}
        >
          <option value="">{t("notRecorded")}</option>
          {teacherCertifications.map((certification) => (
            <option key={certification} value={certification}>
              {t(`certifications.${certification}`)}
            </option>
          ))}
        </select>
      </label>
      <label className="text-sm font-semibold">
        {t("joinedOn")}
        <input
          type="date"
          value={value.joinedOn}
          max={value.leftOn || undefined}
          onChange={(event) => update("joinedOn", event.target.value)}
          className={fieldClass}
        />
      </label>
      <label className="text-sm font-semibold">
        {t("leftOn")}
        <input
          type="date"
          value={value.leftOn}
          min={value.joinedOn || undefined}
          onChange={(event) => update("leftOn", event.target.value)}
          className={fieldClass}
        />
      </label>
    </>
  );
}
