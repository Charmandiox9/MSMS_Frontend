"use client";

import { ChevronDown } from "lucide-react";
import { useTranslations } from "next-intl";
import { createPortal } from "react-dom";
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type FocusEvent,
  type KeyboardEvent,
} from "react";
import RoleSelectionList from "@/components/auth/RoleSelectionList";
import type { UserRoleCode } from "@/types/auth";

type RolePickerPosition = Pick<CSSProperties, "top" | "left" | "width" | "maxHeight">;

export default function AccountRolePicker({
  roles,
  activeRole,
  onConfirm,
}: {
  roles: readonly UserRoleCode[];
  activeRole: UserRoleCode | null;
  onConfirm: (role: UserRoleCode) => boolean;
}) {
  const t = useTranslations("DashboardNav");
  const id = useId();
  const pickerId = `${id}-role-options`;
  const triggerRef = useRef<HTMLButtonElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const pickerRef = useRef<HTMLDivElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [pendingRole, setPendingRole] = useState<UserRoleCode | null>(null);
  const [position, setPosition] = useState<RolePickerPosition | null>(null);
  const hasMultipleRoles = roles.length > 1 && activeRole !== null;
  const activeRoleName = activeRole
    ? t(`roles.${activeRole}`)
    : t("noActiveRole");
  const pendingRoleName = pendingRole ? t(`roles.${pendingRole}`) : "";
  const closePicker = useCallback(() => {
    setIsOpen(false);
    setPendingRole(null);
    setPosition(null);
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    function updatePosition() {
      const trigger = triggerRef.current;
      if (!trigger) return;

      const bounds = trigger.getBoundingClientRect();
      const viewportInset = 12;
      const availableAbove = bounds.top - viewportInset;
      const availableBelow = window.innerHeight - bounds.bottom - viewportInset;
      const maxHeight = Math.min(320, window.innerHeight - viewportInset * 2);
      const preferredHeight = Math.min(maxHeight, 48 + roles.length * 48);
      const openBelow =
        availableBelow >= Math.min(preferredHeight, 180) ||
        availableBelow >= availableAbove;
      const availableSpace = openBelow ? availableBelow : availableAbove;
      const anchoredHeight = Math.min(preferredHeight, availableSpace);
      const width = Math.min(bounds.width, window.innerWidth - viewportInset * 2);
      const left = Math.max(
        viewportInset,
        Math.min(bounds.left, window.innerWidth - width - viewportInset),
      );

      setPosition({
        top: openBelow ? bounds.bottom + 4 : bounds.top - anchoredHeight - 4,
        left,
        width,
        maxHeight: availableSpace,
      });
    }

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [isOpen, roles.length]);

  useEffect(() => {
    if (!isOpen || !position) return;

    if (pendingRole) {
      cancelRef.current?.focus();
      return;
    }

    const checkedOption = pickerRef.current?.querySelector<HTMLInputElement>("input:checked");
    const firstAlternative = pickerRef.current?.querySelector<HTMLButtonElement>("button");
    (checkedOption ?? firstAlternative)?.focus();
  }, [isOpen, pendingRole, position]);

  useEffect(() => {
    if (!isOpen) return;

    function dismissOnOutsidePointer(event: globalThis.PointerEvent) {
      if (!(event.target instanceof Node)) return;
      if (
        containerRef.current?.contains(event.target) ||
        pickerRef.current?.contains(event.target)
      ) {
        return;
      }

      closePicker();
    }

    document.addEventListener("pointerdown", dismissOnOutsidePointer);
    return () => document.removeEventListener("pointerdown", dismissOnOutsidePointer);
  }, [closePicker, isOpen]);

  function handleBlur(event: FocusEvent<HTMLDivElement>) {
    const nextTarget = event.relatedTarget;
    if (
      nextTarget instanceof Node &&
      (containerRef.current?.contains(nextTarget) || pickerRef.current?.contains(nextTarget))
    ) {
      return;
    }

    closePicker();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key !== "Escape" || !isOpen) return;

    event.preventDefault();
    event.stopPropagation();

    if (pendingRole) {
      setPendingRole(null);
      return;
    }

    closePicker();
    triggerRef.current?.focus();
  }

  function confirmRoleChange() {
    if (!pendingRole) return;

    const shouldKeepAccountMenuOpen = onConfirm(pendingRole);
    closePicker();
    if (shouldKeepAccountMenuOpen) triggerRef.current?.focus();
  }

  if (!hasMultipleRoles) {
    return (
      <div className="px-2 py-2 text-sm font-medium text-foreground">
        <span className="sr-only">{t("activeRoleLabel")}: </span>
        {activeRoleName}
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative" onBlur={handleBlur} onKeyDown={handleKeyDown}>
      <button
        ref={triggerRef}
        type="button"
        aria-label={t("rolePickerButton", { role: activeRoleName })}
        aria-expanded={isOpen}
        aria-controls={pickerId}
        onClick={() => {
          if (isOpen) closePicker();
          else {
            setPendingRole(null);
            setPosition(null);
            setIsOpen(true);
          }
        }}
        className="flex min-h-11 w-full items-center gap-3 rounded-lg px-2 py-2 text-left text-sm font-medium text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
      >
        <span className="min-w-0 flex-1 break-words">{activeRoleName}</span>
        <ChevronDown
          aria-hidden="true"
          className={`size-4 shrink-0 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && position && typeof document !== "undefined" && createPortal(
        <div
          ref={pickerRef}
          data-account-role-picker="true"
          id={pickerId}
          role="region"
          aria-label={t("availableRolesLabel")}
          style={position}
          className="fixed z-50 overflow-y-auto overscroll-contain rounded-xl border border-border bg-card p-3 text-foreground shadow-lg"
        >
          {pendingRole ? (
            <section aria-labelledby={`${pickerId}-confirmation-title`}>
              <h2 id={`${pickerId}-confirmation-title`} className="text-sm font-semibold">
                {t("roleChangeConfirmationTitle")}
              </h2>
              <p role="status" className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {t("roleChangeConfirmationDescription", {
                  currentRole: activeRoleName,
                  nextRole: pendingRoleName,
                })}
              </p>
              <div className="mt-4 flex justify-end gap-2">
                <button
                  ref={cancelRef}
                  type="button"
                  onClick={() => setPendingRole(null)}
                  className="min-h-11 rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
                >
                  {t("cancelRoleChange")}
                </button>
                <button
                  type="button"
                  onClick={confirmRoleChange}
                  className="min-h-11 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
                >
                  {t("confirmRoleChange")}
                </button>
              </div>
            </section>
          ) : (
            <RoleSelectionList
              roles={roles}
              selectedRole={activeRole}
              onSelect={(role) => {
                if (role !== activeRole) setPendingRole(role);
              }}
              legend={t("activeRoleLabel")}
              roleName={(role) => t(`roles.${role}`)}
              density="compact"
              currentRoleStatus={t("currentRoleStatus")}
            />
          )}
        </div>,
        // Keep the picker in the modal's interactive subtree on mobile.
        containerRef.current?.closest("dialog") ?? document.body,
      )}
    </div>
  );
}
