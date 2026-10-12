// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ConsentCheckListItem } from "./consent-check-list-item";

describe("ConsentCheckListItem", () => {
  it("children を表示する", () => {
    render(<ConsentCheckListItem>テスト項目</ConsentCheckListItem>);
    expect(screen.getByText("テスト項目")).toBeInTheDocument();
  });
});
