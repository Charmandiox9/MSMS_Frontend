import { fireEvent, render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import EmailInput from "./EmailInput";

it("normalizes email on blur and keeps native email semantics", () => {
  const values: string[] = [];
  const blur = vi.fn();
  render(
    <EmailInput
      aria-label="Email"
      defaultValue="ANA@EXAMPLE.CL"
      onChange={(event) => values.push(event.target.value)}
      onBlur={blur}
    />,
  );
  const input = screen.getByRole("textbox");
  fireEvent.blur(input);
  expect(values).toEqual(["ana@example.cl"]);
  expect(input.getAttribute("type")).toBe("email");
  expect(blur).toHaveBeenCalledOnce();
});
