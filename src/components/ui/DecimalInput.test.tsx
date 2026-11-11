import { useState } from "react";
import { fireEvent, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { renderAs } from "@/test/render";
import DecimalInput from "./DecimalInput";

function Form() {
  const [value, setValue] = useState("");
  return <><DecimalInput aria-label="Amount" value={value} onValueChange={setValue} /><output data-testid="raw">{value}</output></>;
}

it("formats on blur while preserving canonical decimals and allowing clearing", () => {
  renderAs(<Form />, ["SYSTEM_ADMIN"]);
  const input = screen.getByRole("textbox");
  fireEvent.focus(input);
  fireEvent.change(input, { target: { value: "1.234,50" } });
  expect(screen.getByTestId("raw").textContent).toBe("1234.50");
  fireEvent.blur(input);
  expect((input as HTMLInputElement).value).toBe("1.234,50");
  fireEvent.focus(input);
  fireEvent.change(input, { target: { value: "" } });
  fireEvent.blur(input);
  expect(screen.getByTestId("raw").textContent).toBe("");
});
