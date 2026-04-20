import { test, expect, describe, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { ToolCallBadge } from "../ToolCallBadge";

afterEach(() => cleanup());

describe("ToolCallBadge - str_replace_editor", () => {
  test("shows 'Creating' for create command", () => {
    render(<ToolCallBadge toolName="str_replace_editor" args={{ command: "create", path: "/App.jsx" }} state="result" />);
    expect(screen.getByText("Creating /App.jsx")).toBeDefined();
  });

  test("shows 'Editing' for str_replace command", () => {
    render(<ToolCallBadge toolName="str_replace_editor" args={{ command: "str_replace", path: "/components/Button.jsx" }} state="result" />);
    expect(screen.getByText("Editing /components/Button.jsx")).toBeDefined();
  });

  test("shows 'Editing' for insert command", () => {
    render(<ToolCallBadge toolName="str_replace_editor" args={{ command: "insert", path: "/App.jsx" }} state="result" />);
    expect(screen.getByText("Editing /App.jsx")).toBeDefined();
  });

  test("shows 'Reading' for view command", () => {
    render(<ToolCallBadge toolName="str_replace_editor" args={{ command: "view", path: "/App.jsx" }} state="result" />);
    expect(screen.getByText("Reading /App.jsx")).toBeDefined();
  });
});

describe("ToolCallBadge - file_manager", () => {
  test("shows 'Renaming' for rename command", () => {
    render(<ToolCallBadge toolName="file_manager" args={{ command: "rename", path: "/old.jsx", new_path: "/new.jsx" }} state="result" />);
    expect(screen.getByText("Renaming /old.jsx → /new.jsx")).toBeDefined();
  });

  test("shows 'Deleting' for delete command", () => {
    render(<ToolCallBadge toolName="file_manager" args={{ command: "delete", path: "/App.jsx" }} state="result" />);
    expect(screen.getByText("Deleting /App.jsx")).toBeDefined();
  });
});

describe("ToolCallBadge - unknown tool", () => {
  test("shows raw toolName for unknown tools", () => {
    render(<ToolCallBadge toolName="some_tool" args={{}} state="result" />);
    expect(screen.getByText("some_tool")).toBeDefined();
  });
});

describe("ToolCallBadge - state indicators", () => {
  test("shows green dot when state is result", () => {
    const { container } = render(<ToolCallBadge toolName="str_replace_editor" args={{ command: "create", path: "/App.jsx" }} state="result" />);
    expect(container.querySelector(".bg-emerald-500")).toBeTruthy();
  });

  test("shows spinner when state is not result", () => {
    const { container } = render(<ToolCallBadge toolName="str_replace_editor" args={{ command: "create", path: "/App.jsx" }} state="call" />);
    expect(container.querySelector(".animate-spin")).toBeTruthy();
  });
});
