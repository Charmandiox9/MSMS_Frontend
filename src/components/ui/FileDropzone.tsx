"use client";

import { useRef, useState, type DragEvent, type ReactNode } from "react";
import { UploadCloud } from "lucide-react";
import { useTranslations } from "next-intl";

interface FileDropzoneProps {
  children: ReactNode;
  disabled?: boolean;
  onFileDrop: (file: File) => void;
}

function isFileTransfer(dataTransfer: DataTransfer): boolean {
  return (
    Array.from(dataTransfer.types ?? []).includes("Files") ||
    dataTransfer.files.length > 0
  );
}

export default function FileDropzone({
  children,
  disabled = false,
  onFileDrop,
}: FileDropzoneProps) {
  const t = useTranslations("FileDropzone");
  const dragDepth = useRef(0);
  const [isDragging, setIsDragging] = useState(false);

  function handleDragEnter(event: DragEvent<HTMLDivElement>) {
    if (!isFileTransfer(event.dataTransfer)) return;
    event.preventDefault();
    if (disabled) return;

    dragDepth.current += 1;
    setIsDragging(true);
  }

  function handleDragOver(event: DragEvent<HTMLDivElement>) {
    if (!isFileTransfer(event.dataTransfer)) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = disabled ? "none" : "copy";
  }

  function handleDragLeave(event: DragEvent<HTMLDivElement>) {
    if (!isFileTransfer(event.dataTransfer)) return;
    event.preventDefault();
    dragDepth.current = Math.max(0, dragDepth.current - 1);
    if (dragDepth.current === 0) setIsDragging(false);
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    if (!isFileTransfer(event.dataTransfer)) return;
    event.preventDefault();
    dragDepth.current = 0;
    setIsDragging(false);

    const file = event.dataTransfer.files[0];
    if (!disabled && file) onFileDrop(file);
  }

  return (
    <div
      role="group"
      aria-label={t("label")}
      aria-disabled={disabled}
      data-drag-active={isDragging}
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`rounded-xl ${
        isDragging
          ? "bg-selection outline outline-2 outline-dashed outline-offset-2 outline-primary"
          : ""
      }`}
    >
      <p
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="mb-2 flex items-center gap-2 text-xs leading-relaxed text-muted-foreground"
      >
        <UploadCloud
          className={`size-4 shrink-0 ${isDragging ? "text-primary" : ""}`}
          aria-hidden="true"
        />
        {isDragging ? t("dropActive") : t("dropInstruction")}
      </p>
      {children}
    </div>
  );
}
