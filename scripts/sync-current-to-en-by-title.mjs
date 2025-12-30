#!/usr/bin/env node
/**
 * Sync docs content from `current/` (source) into `en/` (target) by matching frontmatter `title`.
 *
 * Initial scope:
 * - Start with a couple of folder pairs, then expand to all pairs.
 *
 * Behavior:
 * - Match files by frontmatter `title`
 * - Replace ONLY the target body (content after frontmatter) with source body
 * - Keep target frontmatter unchanged
 *
 * Usage:
 *   node scripts/sync-current-to-en-by-title.mjs               # dry-run (default)
 *   node scripts/sync-current-to-en-by-title.mjs --dry-run
 *   node scripts/sync-current-to-en-by-title.mjs --write
 *
 * Optional:
 *   --pairs all                    # default: all
 *   --pairs knowledge,middleware   # run a subset
 *   --report .sync-report.json    # write a JSON report (useful for review)
 */

import fs from "node:fs/promises";
import path from "node:path";

const MARKDOWN_EXTS = new Set([".md", ".mdx"]);

const PAIRS = {
  // ===== AI =====
  middleware: { srcRel: "current/ai/middleware", dstRel: "en/ai/agent-middleware" },
  assistant: { srcRel: "current/ai/copilot", dstRel: "en/ai/ai-assistant" },
  conversation: { srcRel: "current/ai/chat", dstRel: "en/ai/conversation" },
  digitalExpert: { srcRel: "current/ai/xpert", dstRel: "en/ai/digital-expert" },
  knowledge: { srcRel: "current/ai/knowledge", dstRel: "en/ai/knowledge-base" },
  toolset: { srcRel: "current/ai/tool", dstRel: "en/ai/toolset" },
  troubleshooting: { srcRel: "current/ai/troubleshooting", dstRel: "en/ai/troubleshooting" },
  workflow: { srcRel: "current/ai/workflow", dstRel: "en/ai/workflow" },
  pluginDev: { srcRel: "current/plugin", dstRel: "en/ai/plugin-development" },
  tutorial: { srcRel: "current/tutorials", dstRel: "en/ai/tutorial" },

  // ===== BI =====
  biIndicators: { srcRel: "current/indicators", dstRel: "en/bi/indicator-management" },
  biSemantic: { srcRel: "current/models", dstRel: "en/bi/semantic-model" },
  biStories: { srcRel: "current/stories", dstRel: "en/bi/story-dashboard" },
  biWidgets: { srcRel: "current/widgets", dstRel: "en/bi/widget" },

  // ===== BI / Website Features =====
  biDataSource: { srcRel: "current/server/datasources", dstRel: "en/bi/website-features/data-source" },
  biEnterpriseOrg: { srcRel: "current/server/organization", dstRel: "en/bi/website-features/enterprise-organization" },
  biEnterpriseTenant: { srcRel: "current/server/tenant", dstRel: "en/bi/website-features/enterprise-tenant" },
  biSSO: { srcRel: "current/server/sso", dstRel: "en/bi/website-features/single-sign-on" },
  biProxy: { srcRel: "current/server/local-agent", dstRel: "en/bi/website-features/proxy" },
};

/**
 * Title aliases to make matching robust when target (`en/`) titles are still Chinese.
 * NOTE: this is intentionally small-scope for the first rollout (knowledge + middleware).
 * Add more mappings when you expand to other folders.
 */
const TITLE_ALIASES_ZH_TO_EN = {
  // knowledge-base
  "维护文档": "Maintaining Documents",
  "连接外部知识库": "Connecting to external knowledge bases",
  "知识库功能介绍": "Knowledge Base Features",
  "召回测试": "Retrieval Test",
  "使用知识库的方式": "Using knowledge bases",
  "步骤一：创建知识流水线": "Step 1: Create Pipeline",
  "步骤二：知识流水线编排": "Step 2: Pipeline Orchestration",
  "步骤三：发布知识流水线": "Step 3: Publish Pipeline",
  "步骤四：上传文件": "Step 4: Upload Files",
  "步骤五：管理和使用知识库": "Step 5: Manage and Use Knowledge Base",
  "数据源授权": "Data Source Authorization",

  // agent-middleware
  "智能体中间件": "Agent Middleware",
  "内置中间件": "Built-in Middleware",
  "自定义中间件": "Custom Middleware",

  // ai-assistant (copilot)
  "命令": "Command",
  "角色": "Roles",
  "设置": "Settings",
  "AI 智能助理": "AI Assistant",

  // conversation
  "项目": "Project",
  "对话": "Chat",

  // bi / widgets (a few common ones; expand as you go)
  "文档": "Document",
  "图片": "Image",
  "文本": "Text",
  "视频": "Video",
};

function parseArgs(argv) {
  const args = {
    dryRun: !argv.includes("--write"),
    write: argv.includes("--write"),
    pairs: "all",
    report: null,
  };
  const idx = argv.findIndex((a) => a === "--pairs");
  if (idx >= 0) args.pairs = argv[idx + 1] ?? "";
  const ridx = argv.findIndex((a) => a === "--report");
  if (ridx >= 0) args.report = argv[ridx + 1] ?? null;
  return args;
}

function isProbablyFrontmatter(content) {
  return content.startsWith("---");
}

function splitFrontmatter(content) {
  if (!isProbablyFrontmatter(content)) return { fm: null, body: content };
  const end = content.indexOf("\n---", 3);
  if (end === -1) return { fm: null, body: content };
  const fm = content.slice(0, end + "\n---".length);
  const body = content.slice(end + "\n---".length);
  return { fm, body };
}

function extractTitleFromFrontmatter(frontmatterBlock) {
  if (!frontmatterBlock) return null;
  // match: title: xxx (quoted or not)
  const m = frontmatterBlock.match(/^\s*title:\s*(.+)\s*$/m);
  if (!m) return null;
  return m[1].trim().replace(/^["']|["']$/g, "");
}

function normalizeTitleForMatch(rawTitle, { isTarget }) {
  if (!rawTitle) return null;
  let t = rawTitle.trim();

  // If target title is Chinese, try alias -> English
  if (isTarget && /[\u4e00-\u9fa5]/.test(t)) {
    t = TITLE_ALIASES_ZH_TO_EN[t] ?? t;
  }

  // Strip common leading emoji/symbols (keeps words)
  t = t.replace(/^[^\p{L}\p{N}]+/gu, "").trim();

  // Normalize spaces/case
  t = t.replace(/\s+/g, " ").toLowerCase();
  return t;
}

async function collectMarkdownFiles(dirAbs) {
  const out = [];
  const stack = [dirAbs];
  while (stack.length) {
    const cur = stack.pop();
    let entries;
    try {
      entries = await fs.readdir(cur, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const e of entries) {
      if (e.name.startsWith(".")) continue;
      const full = path.join(cur, e.name);
      if (e.isDirectory()) stack.push(full);
      else if (e.isFile()) {
        const ext = path.extname(e.name).toLowerCase();
        if (MARKDOWN_EXTS.has(ext)) {
          out.push(full);
          continue;
        }
        // Also include extensionless docs files that start with frontmatter
        if (!ext) {
          const content = await fs.readFile(full, "utf8").catch(() => null);
          if (content && content.startsWith("---")) out.push(full);
        }
      }
    }
  }
  return out;
}

async function buildTitleIndex(filesAbs, { isTarget }) {
  /** @type {Map<string, string[]>} matchKey -> [fileAbs...] */
  const index = new Map();
  for (const f of filesAbs) {
    const content = await fs.readFile(f, "utf8").catch(() => null);
    if (!content) continue;
    const { fm } = splitFrontmatter(content);
    const title = extractTitleFromFrontmatter(fm);
    if (!title) continue;
    const key = normalizeTitleForMatch(title, { isTarget });
    if (!key) continue;
    const arr = index.get(key) ?? [];
    arr.push(f);
    index.set(key, arr);
  }
  return index;
}

async function runPair({ srcAbs, dstAbs, dryRun }) {
  const srcFiles = await collectMarkdownFiles(srcAbs);
  const dstFiles = await collectMarkdownFiles(dstAbs);

  const srcIndex = await buildTitleIndex(srcFiles, { isTarget: false });
  const dstIndex = await buildTitleIndex(dstFiles, { isTarget: true });

  const duplicates = [...srcIndex.entries()].filter(([, v]) => v.length > 1);
  if (duplicates.length) {
    console.log(`⚠️  Source has duplicate titles (${duplicates.length}). These titles will be skipped.`);
  }

  const plans = [];
  for (const [title, dstPaths] of dstIndex.entries()) {
    // if target title duplicates, still handle each file
    const srcPaths = srcIndex.get(title);
    if (!srcPaths || srcPaths.length === 0) continue;
    if (srcPaths.length > 1) continue; // ambiguous
    for (const dstFile of dstPaths) {
      plans.push({ title, srcFile: srcPaths[0], dstFile });
    }
  }

  let updated = 0;
  let skippedNoMatch = 0;
  // count dst titles without match (for visibility)
  for (const [title] of dstIndex.entries()) {
    if (!srcIndex.has(title)) skippedNoMatch++;
  }

  for (const p of plans) {
    const srcContent = await fs.readFile(p.srcFile, "utf8");
    const dstContent = await fs.readFile(p.dstFile, "utf8");

    const { body: srcBody } = splitFrontmatter(srcContent);
    const { fm: dstFm } = splitFrontmatter(dstContent);
    if (!dstFm) continue; // don't touch files without frontmatter

    const next = `${dstFm}\n${srcBody.replace(/^\n+/, "")}`;
    if (!dryRun) {
      await fs.writeFile(p.dstFile, next, "utf8");
    }
    updated++;
  }

  return {
    srcCount: srcFiles.length,
    dstCount: dstFiles.length,
    planned: plans,
    updated,
    skippedNoMatch,
    duplicateSourceTitles: duplicates.map(([t, v]) => ({ title: t, files: v })),
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const selected = (() => {
    const raw = args.pairs.trim();
    if (!raw || raw === "all") return Object.keys(PAIRS);
    return raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  })();

  const unknown = selected.filter((k) => !PAIRS[k]);
  if (unknown.length) {
    console.error(`Unknown --pairs: ${unknown.join(", ")}. Allowed: ${Object.keys(PAIRS).join(", ")}`);
    process.exit(1);
  }

  const repoRoot = process.cwd();

  console.log(`Mode: ${args.dryRun ? "DRY-RUN" : "WRITE"}`);
  console.log(`Pairs: ${selected.join(", ")}\n`);

  const report = {
    mode: args.dryRun ? "dry-run" : "write",
    pairs: selected,
    results: [],
    generatedAt: new Date().toISOString(),
  };

  for (const key of selected) {
    const pair = PAIRS[key];
    const srcAbs = path.join(repoRoot, pair.srcRel);
    const dstAbs = path.join(repoRoot, pair.dstRel);

    console.log(`== Pair: ${key} ==`);
    console.log(`SRC: ${pair.srcRel}`);
    console.log(`DST: ${pair.dstRel}`);

    const res = await runPair({ srcAbs, dstAbs, dryRun: args.dryRun });

    console.log(`- Source files: ${res.srcCount}`);
    console.log(`- Target files: ${res.dstCount}`);
    console.log(`- Target titles without match: ${res.skippedNoMatch}`);
    console.log(`- Planned replacements: ${res.planned.length}`);
    console.log(`- ${args.dryRun ? "Would update" : "Updated"}: ${res.updated}\n`);

    report.results.push({
      key,
      srcRel: pair.srcRel,
      dstRel: pair.dstRel,
      srcCount: res.srcCount,
      dstCount: res.dstCount,
      targetTitlesWithoutMatch: res.skippedNoMatch,
      plannedReplacements: res.planned.length,
      updated: res.updated,
      duplicateSourceTitles: res.duplicateSourceTitles,
      sample: res.planned.slice(0, 20).map((p) => ({
        title: p.title,
        src: path.relative(repoRoot, p.srcFile),
        dst: path.relative(repoRoot, p.dstFile),
      })),
    });

    // show a small sample for review
    const sample = res.planned.slice(0, 8);
    if (sample.length) {
      console.log(`Sample (up to ${sample.length}):`);
      for (const p of sample) {
        console.log(`- [${p.title}] ${path.relative(repoRoot, p.srcFile)} -> ${path.relative(repoRoot, p.dstFile)}`);
      }
      console.log("");
    }
  }

  if (args.dryRun) {
    console.log(`Done (dry-run). Re-run with --write to apply changes.`);
  } else {
    console.log(`Done (write).`);
  }

  if (args.report) {
    const reportAbs = path.isAbsolute(args.report)
      ? args.report
      : path.join(repoRoot, args.report);
    await fs.writeFile(reportAbs, JSON.stringify(report, null, 2) + "\n", "utf8");
    console.log(`Report written: ${path.relative(repoRoot, reportAbs)}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});


