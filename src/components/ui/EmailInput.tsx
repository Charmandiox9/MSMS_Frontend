"use client";

import type { ComponentProps } from "react";

/** Normalize on blur so typing and cursor movement remain native. */
export default function EmailInput({
  onChange,
  onBlur,
  ...props
}: Omit<ComponentProps<"input">, "type">) {
  return (
    <input
      {...props}
      type="email"
      autoCapitalize="none"
      autoCorrect="off"
      spellCheck={false}
      onChange={onChange}
      onBlur={(event) => {
        const normalized = event.currentTarget.value.trim().toLowerCase();
        if (normalized !== event.currentTarget.value) {
          event.currentTarget.value = normalized;
          onChange?.(event);
        }
        onBlur?.(event);
      }}
    />
  );
}
