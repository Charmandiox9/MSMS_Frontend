"use client";

import { useTranslations } from "next-intl";
import Modal, { type ModalProps } from "@/components/ui/Modal";

export default function FormModal(props: ModalProps) {
  const t = useTranslations("FormModal");

  return (
    <Modal
      {...props}
      unsavedChanges={{
        title: t("unsavedTitle"),
        description: t("unsavedDescription"),
        continueEditing: t("continueEditing"),
        discard: t("discardChanges"),
      }}
    />
  );
}
