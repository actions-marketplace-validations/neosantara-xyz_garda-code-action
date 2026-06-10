import { describe, expect, it } from "vitest";
import {
  formatDuration,
  buildActionBar,
  composeFinalComment,
  buildFindingsSummary,
} from "../src/github/comment-format.js";
import type { NeoContext } from "../src/github/context.js";
import type { BranchFinalization } from "../src/github/branch-cleanup.js";
import type { InlineComment } from "../src/tools/types.js";

const ctx = {
  actor: "alice",
  runUrl: "https://github.com/o/r/actions/runs/1",
} as unknown as NeoContext;

function comment(
  severity: "low" | "medium" | "high" | undefined,
  confirmed = true,
): InlineComment {
  return {
    path: "a.ts",
    line: 1,
    body: "x",
    confirmed,
    classification: severity ? { keep: true, severity } : undefined,
  };
}

describe("buildFindingsSummary", () => {
  it("reports no issues when there are no kept comments", () => {
    expect(buildFindingsSummary([])).toBe("✅ No issues found");
  });

  it("ignores comments rejected by the classifier", () => {
    expect(buildFindingsSummary([comment("high", false)])).toBe(
      "✅ No issues found",
    );
  });

  it("groups kept comments by severity, highest first", () => {
    const out = buildFindingsSummary([
      comment("high"),
      comment("high"),
      comment("medium"),
      comment("low"),
      comment("low"),
      comment("low"),
    ]);
    expect(out).toBe("🔴 2 high · 🟡 1 medium · 🔵 3 low");
  });

  it("defaults missing severity to low", () => {
    expect(buildFindingsSummary([comment(undefined)])).toBe("🔵 1 low");
  });
});

describe("formatDuration", () => {
  it("formats seconds only", () => {
    expect(formatDuration(5000)).toBe("5s");
  });
  it("formats minutes and seconds", () => {
    expect(formatDuration(125000)).toBe("2m 5s");
  });
});

describe("buildActionBar", () => {
  it("includes only the workflow run link when no branch", () => {
    const bar = buildActionBar(ctx, {
      hasChanges: false,
      deleted: false,
    } as BranchFinalization);
    expect(bar).toContain("[View workflow run]");
    expect(bar).not.toContain("Create PR");
  });

  it("includes branch and Create PR links when changes exist", () => {
    const bar = buildActionBar(ctx, {
      branchName: "garda/issue-1",
      branchUrl: "https://github.com/o/r/tree/garda/issue-1",
      createPrUrl: "https://github.com/o/r/compare/main...garda/issue-1",
      hasChanges: true,
      deleted: false,
    });
    expect(bar).toContain("[`garda/issue-1`]");
    expect(bar).toContain("[Create PR ➔]");
    expect(bar).toContain(" • ");
  });
});

describe("composeFinalComment", () => {
  it("renders a glanceable success header with @user and duration", () => {
    const out = composeFinalComment({
      context: ctx,
      actor: "alice",
      durationMs: 65000,
      branch: { hasChanges: false, deleted: false },
      resultText: "All good.",
      details: "<details>x</details>",
    });
    expect(out).toContain("**Garda finished @alice's task in 1m 5s**");
    expect(out).toContain("All good.");
    expect(out).toContain("[View workflow run]");
  });

  it("renders an error header with duration and error block", () => {
    const out = composeFinalComment({
      context: ctx,
      actor: "alice",
      durationMs: 3000,
      branch: { hasChanges: false, deleted: false },
      resultText: "",
      details: "",
      failed: true,
      errorDetails: "boom",
    });
    expect(out).toContain("**Garda encountered an error after 3s**");
    expect(out).toContain("boom");
  });

  it("notes deleted empty branch", () => {
    const out = composeFinalComment({
      context: ctx,
      actor: "alice",
      durationMs: 1000,
      branch: { branchName: "garda/issue-2", hasChanges: false, deleted: true },
      resultText: "done",
      details: "",
    });
    expect(out).toContain("was deleted because no changes were committed");
  });

  it("includes the workflow run link exactly once (no duplicate)", () => {
    const out = composeFinalComment({
      context: ctx,
      actor: "alice",
      durationMs: 1000,
      branch: { hasChanges: false, deleted: false },
      resultText: "done",
      details: "<details>x</details>",
    });
    const occurrences = out.split("[View workflow run]").length - 1;
    expect(occurrences).toBe(1);
  });

  it("renders a glanceable findings summary when provided", () => {
    const out = composeFinalComment({
      context: ctx,
      actor: "alice",
      durationMs: 1000,
      branch: { hasChanges: false, deleted: false },
      resultText: "done",
      details: "",
      findingsSummary: "🔴 1 high · 🔵 2 low",
    });
    expect(out).toContain("**Findings:** 🔴 1 high · 🔵 2 low");
  });

  it("omits the findings summary on failed runs", () => {
    const out = composeFinalComment({
      context: ctx,
      actor: "alice",
      durationMs: 1000,
      branch: { hasChanges: false, deleted: false },
      resultText: "",
      details: "",
      findingsSummary: "✅ No issues found",
      failed: true,
      errorDetails: "boom",
    });
    expect(out).not.toContain("**Findings:**");
  });
});
