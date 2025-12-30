#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";

/* ===================== 基础配置 ===================== */

const MARKDOWN_EXTS = new Set([".md", ".mdx"]);
const IGNORE_DIR_NAMES = new Set([
  ".git",
  ".github",
  "node_modules",
  "__MACOSX",
]);
const IGNORE_FILE_NAMES = new Set([".ds_store"]);

const DEFAULT_GROUP_NAME_BY_LANGUAGE = {
  en: "Default",
  "zh-Hans": "默认",
};

/**
 * ⭐ 多语言展示名映射（核心）
 * key = 目录名（slug）
 * value = 在对应语言下的展示名
 */
const DISPLAY_NAME_OVERRIDES = {
  en: {
    ai: "AI",
    "agent-middleware": "Agent Middleware",
    "ai-assistant": "AI Assistant",
    conversation: "Conversation",
    "digital-expert": "Digital Expert",
    "knowledge-base": "Knowledge Base",
    "plugin-development": "Plugin Development",
    toolset: "Toolset",
    troubleshooting: "Troubleshooting",
    tutorial: "Tutorial",
    workflow: "Workflow",
  },

  "zh-Hans": {
    ai: "AI",
    "agent-middleware": "智能体中间件",
    "ai-assistant": "AI 助手",
    conversation: "对话",
    "digital-expert": "数字专家",
    "knowledge-base": "知识库",
    "plugin-development": "插件开发",
    toolset: "工具集",
    troubleshooting: "故障排查",
    tutorial: "教程",
    workflow: "工作流",
  },
};

/* ===================== Navbar 多语言映射 ===================== */

// 语言节点内的 navbar（数组格式）
const NAVBAR_ARRAY_BY_LANGUAGE = {
  en: [
    { label: "GitHub", href: "https://github.com/zhezhiming/Mintlify" },
    { label: "Support", href: "mailto:hi@mintlify.com" },
    { label: "Try Chat-Kit", href: "https://xpertai.cn/docs/ai/" },
  ],
  "zh-Hans": [
    { label: "GitHub", href: "https://github.com/zhezhiming/Mintlify" },
    { label: "支持", href: "mailto:hi@mintlify.com" },
    { label: "试用 Chat-Kit", href: "https://xpertai.cn/zh-Hans/docs/ai/" },
  ],
};

// 全局 navbar（对象格式，包含 links 和 primary）
const NAVBAR_BY_LANGUAGE = {
  en: {
    links: [
      { label: "GitHub", href: "https://github.com/zhezhiming/Mintlify" },
      { label: "Support", href: "mailto:hi@mintlify.com" },
    ],
    primary: {
      type: "button",
      label: "Try Chat-Kit",
      href: "https://xpertai.cn/docs/ai/",
    },
  },
  "zh-Hans": {
    links: [
      { label: "GitHub", href: "https://github.com/zhezhiming/Mintlify" },
      { label: "支持", href: "mailto:hi@mintlify.com" },
    ],
    primary: {
      type: "button",
      label: "试用 Chat-Kit",
      href: "https://xpertai.cn/zh-Hans/docs/ai/",
    },
  },
};


/* ===================== 工具函数 ===================== */

function parseArgs(argv) {
  const args = {
    docs: "docs.json",
    contentRoot: ".",
    languages: null,
    dryRun: false,
  };

  for (let i = 0; i < argv.length; i++) {
    const t = argv[i];
    if (t === "--dry-run") {
      args.dryRun = true;
      continue;
    }
    const next = argv[i + 1];
    if (!next) throw new Error(`Missing value for ${t}`);
    if (t === "--docs") args.docs = next;
    else if (t === "--content-root") args.contentRoot = next;
    else if (t === "--languages") args.languages = next;
    i++;
  }
  return args;
}

function toPosix(p) {
  return p.split(path.sep).join("/");
}

function pagePathFromFile(contentRootAbs, fileAbs) {
  const rel = path.relative(contentRootAbs, fileAbs);
  return toPosix(rel.slice(0, -path.extname(rel).length));
}

/**
 * ⭐ 语言感知展示名
 */
function toDisplayName(slug, language) {
  if (!slug) return slug;

  const override = DISPLAY_NAME_OVERRIDES?.[language]?.[slug];
  if (override) return override;

  // fallback：英文自动 Title Case
  return slug
    .split(/[-_]+/g)
    .filter(Boolean)
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(" ");
}

async function listDir(dirAbs) {
  const entries = await fs.readdir(dirAbs, { withFileTypes: true });
  return entries.filter((e) => {
    if (e.name.startsWith(".")) return false;
    if (e.isDirectory()) return !IGNORE_DIR_NAMES.has(e.name);
    if (e.isFile())
      return !IGNORE_FILE_NAMES.has(e.name.toLowerCase());
    return false;
  });
}

function sortPages(pages) {
  const isIndex = (p) => p.endsWith("/index");
  return [...pages].sort((a, b) => {
    if (isIndex(a) && !isIndex(b)) return -1;
    if (!isIndex(a) && isIndex(b)) return 1;
    return a.localeCompare(b);
  });
}

async function collectPagesRecursively(dirAbs, contentRootAbs) {
  const pages = [];
  const stack = [dirAbs];

  while (stack.length) {
    const cur = stack.pop();
    const entries = await listDir(cur);

    for (const e of entries) {
      const full = path.join(cur, e.name);
      if (e.isDirectory()) stack.push(full);
      else if (
        e.isFile() &&
        MARKDOWN_EXTS.has(path.extname(e.name).toLowerCase())
      ) {
        pages.push(pagePathFromFile(contentRootAbs, full));
      }
    }
  }

  return sortPages(pages);
}

/* ===================== 核心逻辑 ===================== */

async function buildNavigationForLanguage(language, docs, contentRootAbs) {
  const langAbs = path.join(contentRootAbs, language);
  const products = [];

  const productDirs = (await listDir(langAbs)).filter((e) => e.isDirectory());

  for (const productDir of productDirs) {
    const productSlug = productDir.name;
    const productAbs = path.join(langAbs, productSlug);

    const productName = toDisplayName(productSlug, language);
    const tabs = [];

    const tabDirs = (await listDir(productAbs)).filter((e) =>
      e.isDirectory()
    );

    for (const tabDir of tabDirs) {
      const tabSlug = tabDir.name;
      const tabAbs = path.join(productAbs, tabSlug);

      const tabName = toDisplayName(tabSlug, language);
      const groups = [];
      const defaultPages = [];

      const children = await listDir(tabAbs);

      for (const child of children) {
        const childAbs = path.join(tabAbs, child.name);

        if (child.isDirectory()) {
          const groupName = toDisplayName(child.name, language);
          const pages = await collectPagesRecursively(
            childAbs,
            contentRootAbs
          );
          if (pages.length) groups.push({ group: groupName, pages });
        } else if (
          child.isFile() &&
          MARKDOWN_EXTS.has(path.extname(child.name).toLowerCase())
        ) {
          defaultPages.push(pagePathFromFile(contentRootAbs, childAbs));
        }
      }

      if (!groups.length && !defaultPages.length) continue;

      const tabNode = { tab: tabName, groups: [] };

      if (defaultPages.length) {
        tabNode.groups.push({
          group:
            DEFAULT_GROUP_NAME_BY_LANGUAGE[language] ?? "Default",
          pages: sortPages(defaultPages),
        });
      }

      tabNode.groups.push(
        ...groups.sort((a, b) =>
          a.group.localeCompare(b.group)
        )
      );

      tabs.push(tabNode);
    }

    if (tabs.length) {
      products.push({
        product: productName,
        tabs,
      });
    }
  }

  return {
    language,
    ...(docs.navigation?.languages?.find((l) => l.language === language) ??
      {}),
    // 为每个语言添加对应的 navbar（数组格式）
    navbar: NAVBAR_ARRAY_BY_LANGUAGE[language] ?? NAVBAR_ARRAY_BY_LANGUAGE.en,
    products,
  };
}

async function resolveLanguages({ docs, contentRootAbs, languagesArg }) {
  if (languagesArg) {
    return languagesArg.split(",").map((l) => l.trim());
  }

  const fromDocs =
    docs.navigation?.languages?.map((l) => l.language) ?? [];
  if (fromDocs.length) return fromDocs;

  const root = await listDir(contentRootAbs);
  return root.filter((e) => e.isDirectory()).map((e) => e.name);
}

/* ===================== main ===================== */

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const docsAbs = path.resolve(args.docs);
  const contentRootAbs = path.resolve(args.contentRoot);

  const docs = JSON.parse(await fs.readFile(docsAbs, "utf8"));
  const languages = await resolveLanguages({
    docs,
    contentRootAbs,
    languagesArg: args.languages,
  });

  const languageNodes = [];
  for (const lang of languages) {
    const stat = await fs
      .stat(path.join(contentRootAbs, lang))
      .catch(() => null);
    if (!stat?.isDirectory()) continue;

    languageNodes.push(
      await buildNavigationForLanguage(lang, docs, contentRootAbs)
    );
  }

  docs.navigation ??= {};
  docs.navigation.languages = languageNodes;

  // 注意：navbar 已在每个语言节点中配置，如果 Mintlify 不支持，
  // 则使用全局 navbar（默认语言的）
  if (!docs.navbar) {
    const defaultLang =
      languageNodes.find((l) => l.default)?.language ??
      languageNodes[0]?.language ??
      "en";
    docs.navbar = NAVBAR_BY_LANGUAGE[defaultLang] ?? NAVBAR_BY_LANGUAGE.en;
  }

  if (args.dryRun) {
    console.log(JSON.stringify(languageNodes, null, 2));
    return;
  }

  await fs.writeFile(
    docsAbs,
    JSON.stringify(docs, null, 2) + "\n"
  );
  console.log(`✅ docs.json navigation updated`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
