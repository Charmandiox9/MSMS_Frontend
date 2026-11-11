"use client";

import { useState, type ComponentProps } from "react";
import { useLocale } from "next-intl";
import { formatDecimalInput, parseDecimalInput } from "@/lib/number-input";

type Props = Omit<ComponentProps<"input">, "type" | "value" | "onChange"> & {
  value: string;
  onValueChange: (value: string) => void;
};

export default function DecimalInput({
  value,
  onValueChange,
  onFocus,
  onBlur,
  ...props
}: Props) {
  const locale = useLocale();
  const [focused, setFocused] = useState(false);
  return (
    <input
      {...props}
      type="text"
      inputMode="decimal"
      value={focused ? value : formatDecimalInput(value, locale)}
      onFocus={(event) => {
        setFocused(true);
        onFocus?.(event);
      }}
      onBlur={(event) => {
        const normalized = value === "." ? "" : value.replace(/^\./, "0.").replace(/\.$/, "");
        if (normalized !== value) onValueChange(normalized);
        setFocused(false);
        onBlur?.(event);
      }}
      onChange={(event) => {
        const parsed = parseDecimalInput(event.target.value);
        if (parsed !== null) onValueChange(parsed);
      }}
    />
  );
}
