import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ButtonComponent } from "./button.component";

describe("ButtonComponent", () => {
	it("renders children and forwards click handler", async () => {
		const handleClick = vi.fn();
		render(<ButtonComponent onClick={handleClick}>Save</ButtonComponent>);
		const btn = screen.getByRole("button", { name: "Save" });
		expect(btn).toBeTruthy();
		btn.click();
		expect(handleClick).toHaveBeenCalledTimes(1);
	});
});
