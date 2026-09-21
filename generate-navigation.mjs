#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";

/* ===================== Base configuration ===================== */

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
const DEFAULT_GROUP_SLUG = "__default__";
const EMPTY_MAP = new Map();

/**
 * ⭐ Page title mapping (used to update the title in English MDX files)
 * key = Chinese title
 * value = English title
 */
const PAGE_TITLE_MAPPING = {
  // Agent Middleware
  "智能体中间件": "Agent Middleware",
  "内置中间件": "Built-in Middleware",
  "自定义中间件": "Custom Middleware",
  
  // Digital Expert
  "对话日志": "Conversation Logs",
  "开发接口": "Development API",
  "数字专家": "Digital Expert",
  "嵌入网页": "Embed Webpage",
  "增强功能": "Enhanced Features",
  "环境变量": "Environment Variables",
  "专家配置": "Expert Configuration",
  "人机协同": "Human-AI Collaboration",
  "长期记忆": "Long-term Memory",
  "监测仪表盘": "Monitoring Dashboard",
  "多智能体架构": "Multi-Agent Architecture",
  "发布版本": "Release Version",
  "监督型架构": "Supervised Architecture",
  "蜂群型架构": "Swarm Architecture",
  
  // AI Assistant
  "AI 助手": "AI Assistant",
  "命令": "Commands",
  "配置 AI 提供商": "Configure AI Provider",
  "角色": "Role",
  
  // Conversation
  "对话": "Conversation",
  "项目": "Projects",
  
  // Knowledge Base
  "知识库": "Knowledge Base",
  "API": "API",
  "连接外部知识库": "Connect External Knowledge Base",
  "知识库功能": "Knowledge Base Features",
  "维护文档": "Maintain Documents",
  "召回测试": "Recall Test",
  "知识库使用方式": "Ways to Use Knowledge Base",
  "通过流水线创建知识库": "Create Knowledge Base Via Pipeline",
  
  // Plugin Development
  "插件开发": "Plugin Development",
  "核心概念": "Core Concepts",
  "开发步骤": "Development Steps",
  "概述": "Overview",
  "权限设计指南": "Permission Design Guide",
  "发布和使用": "Publish and Use",
  "Schema UI 扩展": "Schema UI Extension",
  "飞书文档示例": "Feishu Document Example",
  
  // Toolset
  "工具集": "Toolset",
  "内置工具集": "Built-in Toolset",
  "自定义工具集": "Custom Toolset",
  "飞书": "Feishu",
  "规划任务": "Planning Tasks",
  "定时任务": "Scheduled Tasks",
  "BI 工具集": "BI Toolset",
  "ChatBI 工具集": "ChatBI Toolset",
  "MCP 工具": "MCP Tools",
  "虚拟环境": "Virtual Environment",
  
  // Troubleshooting
  "故障排查": "Troubleshooting",
  "错误": "Errors",
  
  // Tutorial
  "教程": "Tutorial",
  
  // Workflow
  "工作流": "Workflow",
};

/**
 * ⭐ Multilingual display name overrides (core)
 * loaded from JSON config file
 */
const DISPLAY_NAME_OVERRIDES_FILE = new URL(
  "./display-name-overrides.json",
  import.meta.url
);
let DISPLAY_NAME_OVERRIDES = {};

/**
 * ⭐ Navigation order tree configuration (core)
 * loaded from JSON config file
 *
 * Schema:
 * products[].slug
 * products[].tabs[].slug
 * products[].tabs[].groups[].slug (use "__default__" for tab root pages)
 * products[].tabs[].groups[].pages[] (tab-relative path without extension)
 */
const NAVIGATION_ORDER_TREE_FILE = new URL(
  "./navigation-order-tree.json",
  import.meta.url
);
let NAVIGATION_ORDER_INDEXES = {
  productOrderMap: EMPTY_MAP,
  tabOrderMapByProduct: EMPTY_MAP,
  groupOrderMapByProductTab: EMPTY_MAP,
  pageOrderMapByProductTabGroup: EMPTY_MAP,
};

/* ===================== Navbar multilingual mapping ===================== */

const NAVBAR_BY_LANGUAGE = {
  en: {
    links: [
      { label: "GitHub", href: "https://github.com/xpert-ai/xpert" },
      { label: "Ontology", href: "https://data.xpertai.cn/" },
      { label: "Support", href: "mailto:service@xpertai.cn" },
    ],
    primary: {
      type: "button",
      label: "Try XpertAI",
      href: "https://app.xpertai.cn/",
    },
  },
  "zh-Hans": {
    links: [
      { label: "GitHub", href: "https://github.com/xpert-ai/xpert" },
      { label: "进入本体", href: "https://data.xpertai.cn/" },
      { label: "支持", href: "mailto:service@xpertai.cn" },
    ],
    primary: {
      type: "button",
      label: "试用 XpertAI",
      href: "https://app.xpertai.cn/",
    },
  },
};



/* ===================== Utility functions ===================== */

function parseArgs(argv) {
  const args = {
    docs: "docs.json",
    contentRoot: ".",
    languages: null,
    dryRun: false,
    updateTitles: false,
  };

  for (let i = 0; i < argv.length; i++) {
    const t = argv[i];
    if (t === "--dry-run") {
      args.dryRun = true;
      continue;
    }
    if (t === "--update-titles") {
      args.updateTitles = true;
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
 * Check if text contains Chinese characters
 */
function containsChinese(text) {
  return /[\u4e00-\u9fa5]/.test(text);
}

/**
 * Parse title from frontmatter
 */
function parseFrontmatterTitle(content) {
  if (!content.startsWith("---")) {
    return null;
  }

  const endIndex = content.indexOf("---", 3);
  if (endIndex === -1) {
    return null;
  }

  const frontmatterText = content.slice(3, endIndex).trim();
  const titleMatch = frontmatterText.match(/^title:\s*(.+)$/m);
  return titleMatch ? titleMatch[1].trim().replace(/^["']|["']$/g, "") : null;
}

/**
 * Parse sidebar_position from frontmatter
 */
function parseFrontmatterSidebarPosition(content) {
  if (!content.startsWith("---")) {
    return null;
  }

  const endIndex = content.indexOf("---", 3);
  if (endIndex === -1) {
    return null;
  }

  const frontmatterText = content.slice(3, endIndex).trim();
  const positionMatch = frontmatterText.match(/^sidebar_position:\s*(.+)$/m);
  if (positionMatch) {
    const value = positionMatch[1].trim();
    const num = parseInt(value, 10);
    return isNaN(num) ? null : num;
  }
  return null;
}

function parseFrontmatterSidebarHidden(content) {
  if (!content.startsWith("---")) {
    return false;
  }

  const endIndex = content.indexOf("---", 3);
  if (endIndex === -1) {
    return false;
  }

  const frontmatterText = content.slice(3, endIndex).trim();
  const hiddenMatch = frontmatterText.match(/^sidebar_hidden:\s*(.+)$/m);
  return hiddenMatch ? hiddenMatch[1].trim().toLowerCase() === "true" : false;
}

/**
 * Generate an English title from filename
 */
function generateEnglishTitleFromFilename(filePath) {
  const basename = path.basename(filePath, path.extname(filePath));
  return basename
    .split(/[-_]/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Update title in frontmatter
 */
function updateFrontmatterTitle(content, newTitle) {
  if (!content.startsWith("---")) {
    return `---\ntitle: ${newTitle}\n---\n\n${content}`;
  }

  const endIndex = content.indexOf("---", 3);
  if (endIndex === -1) {
    return content;
  }

  const frontmatterText = content.slice(3, endIndex).trim();
  const body = content.slice(endIndex + 3).trimStart();

  const updatedFrontmatter = frontmatterText.replace(
    /^title:\s*.+$/m,
    `title: ${newTitle}`
  );

  return `---\n${updatedFrontmatter}\n---\n${body}`;
}

/**
 * Update English MDX file title if it contains Chinese
 */
async function updateEnglishPageTitle(filePath, updateTitles) {
  if (!updateTitles || !filePath.includes("/en/")) {
    return { updated: false };
  }

  try {
    const content = await fs.readFile(filePath, "utf8");
    const currentTitle = parseFrontmatterTitle(content);

    if (!currentTitle || !containsChinese(currentTitle)) {
      return { updated: false };
    }

    // lookup mapping
    let newTitle = PAGE_TITLE_MAPPING[currentTitle];

    // fallback: generate from filename if not in mapping
    if (!newTitle) {
      newTitle = generateEnglishTitleFromFilename(filePath);
    }

    const updatedContent = updateFrontmatterTitle(content, newTitle);
    await fs.writeFile(filePath, updatedContent, "utf8");

    return { updated: true, oldTitle: currentTitle, newTitle };
  } catch (error) {
    console.warn(`⚠️ Failed to update file title: ${filePath}`, error.message);
    return { updated: false, error: error.message };
  }
}

/**
 * ⭐ Language-aware display name
 */
function toDisplayName(slug, language) {
  if (!slug) return slug;

  const override = DISPLAY_NAME_OVERRIDES?.[language]?.[slug];
  if (override) return override;

  // fallback: Title Case from slug
  return slug
    .split(/[-_]+/g)
    .filter(Boolean)
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(" ");
}

function normalizeStringArray(value) {
  if (!Array.isArray(value)) return [];
  return value.filter((item) => typeof item === "string" && item.length > 0);
}

function findNamedItem(items, key, value) {
  if (!Array.isArray(items) || typeof value !== "string" || !value) {
    return null;
  }

  return items.find((item) => item?.[key] === value) ?? null;
}

function mergeGroupsWithExistingConfig(generatedGroups, existingGroups) {
  const mergedGroups = [];
  const usedGroupNames = new Set();

  for (const generatedGroup of generatedGroups) {
    const existingGroup = findNamedItem(
      existingGroups,
      "group",
      generatedGroup?.group
    );

    if (existingGroup?.group) {
      usedGroupNames.add(existingGroup.group);
      mergedGroups.push({
        ...existingGroup,
        ...generatedGroup,
      });
      continue;
    }

    mergedGroups.push(generatedGroup);
  }

  for (const existingGroup of existingGroups ?? []) {
    const groupName = existingGroup?.group;
    if (typeof groupName !== "string" || !groupName) continue;
    if (usedGroupNames.has(groupName)) continue;
    mergedGroups.push(existingGroup);
  }

  return mergedGroups;
}

function mergeTabsWithExistingConfig(generatedTabs, existingTabs) {
  const mergedTabs = [];
  const usedTabNames = new Set();

  for (const generatedTab of generatedTabs) {
    const existingTab = findNamedItem(existingTabs, "tab", generatedTab?.tab);
    const mergedGroups = mergeGroupsWithExistingConfig(
      generatedTab?.groups ?? [],
      existingTab?.groups ?? []
    );

    if (existingTab?.tab) {
      usedTabNames.add(existingTab.tab);
      mergedTabs.push({
        ...existingTab,
        ...generatedTab,
        groups: mergedGroups,
      });
      continue;
    }

    mergedTabs.push({
      ...generatedTab,
      groups: mergedGroups,
    });
  }

  for (const existingTab of existingTabs ?? []) {
    const tabName = existingTab?.tab;
    if (typeof tabName !== "string" || !tabName) continue;
    if (usedTabNames.has(tabName)) continue;
    mergedTabs.push(existingTab);
  }

  return mergedTabs;
}

function mergeProductsWithExistingConfig(generatedProducts, existingProducts) {
  const mergedProducts = [];
  const usedProductNames = new Set();

  for (const generatedProduct of generatedProducts) {
    const existingProduct = findNamedItem(
      existingProducts,
      "product",
      generatedProduct?.product
    );
    const mergedTabs = mergeTabsWithExistingConfig(
      generatedProduct?.tabs ?? [],
      existingProduct?.tabs ?? []
    );

    if (existingProduct?.product) {
      usedProductNames.add(existingProduct.product);
      mergedProducts.push({
        ...existingProduct,
        ...generatedProduct,
        tabs: mergedTabs,
      });
      continue;
    }

    mergedProducts.push({
      ...generatedProduct,
      tabs: mergedTabs,
    });
  }

  for (const existingProduct of existingProducts ?? []) {
    const productName = existingProduct?.product;
    if (typeof productName !== "string" || !productName) continue;
    if (usedProductNames.has(productName)) continue;
    mergedProducts.push(existingProduct);
  }

  return mergedProducts;
}

function buildNavigationOrderIndexes(orderTree) {
  const products = Array.isArray(orderTree?.products)
    ? orderTree.products
    : [];

  const productOrderMap = new Map();
  const tabOrderMapByProduct = new Map();
  const groupOrderMapByProductTab = new Map();
  const pageOrderMapByProductTabGroup = new Map();

  products.forEach((productNode, productIndex) => {
    const productSlug = productNode?.slug;
    if (typeof productSlug !== "string" || !productSlug) return;

    if (!productOrderMap.has(productSlug)) {
      productOrderMap.set(productSlug, productIndex);
    }

    const tabs = Array.isArray(productNode.tabs) ? productNode.tabs : [];
    const tabOrderMap = new Map();
    const groupOrderMapByTab = new Map();
    const pageOrderMapByTabGroup = new Map();

    tabs.forEach((tabNode, tabIndex) => {
      const tabSlug = tabNode?.slug;
      if (typeof tabSlug !== "string" || !tabSlug) return;

      if (!tabOrderMap.has(tabSlug)) {
        tabOrderMap.set(tabSlug, tabIndex);
      }

      const groups = Array.isArray(tabNode.groups) ? tabNode.groups : [];
      const groupOrderMap = new Map();
      const pageOrderMapByGroup = new Map();

      groups.forEach((groupNode, groupIndex) => {
        const groupSlug = groupNode?.slug;
        if (typeof groupSlug !== "string" || !groupSlug) return;

        if (!groupOrderMap.has(groupSlug)) {
          groupOrderMap.set(groupSlug, groupIndex);
        }

        const pages = normalizeStringArray(groupNode.pages);
        const pageOrderMap = new Map();
        pages.forEach((pageSlug, pageIndex) => {
          if (!pageOrderMap.has(pageSlug)) {
            pageOrderMap.set(pageSlug, pageIndex);
          }

          // Support group-relative page slugs (e.g. "schedule-trigger")
          // in addition to tab-relative slugs (e.g. "trigger/schedule-trigger").
          // This makes pages[] under a group intuitive while keeping backward compatibility.
          if (
            groupSlug !== DEFAULT_GROUP_SLUG &&
            !pageSlug.startsWith(`${groupSlug}/`)
          ) {
            const tabRelativePageSlug = `${groupSlug}/${pageSlug}`;
            if (!pageOrderMap.has(tabRelativePageSlug)) {
              pageOrderMap.set(tabRelativePageSlug, pageIndex);
            }
          }
        });

        pageOrderMapByGroup.set(groupSlug, pageOrderMap);
      });

      groupOrderMapByTab.set(tabSlug, groupOrderMap);
      pageOrderMapByTabGroup.set(tabSlug, pageOrderMapByGroup);
    });

    tabOrderMapByProduct.set(productSlug, tabOrderMap);
    groupOrderMapByProductTab.set(productSlug, groupOrderMapByTab);
    pageOrderMapByProductTabGroup.set(productSlug, pageOrderMapByTabGroup);
  });

  return {
    productOrderMap,
    tabOrderMapByProduct,
    groupOrderMapByProductTab,
    pageOrderMapByProductTabGroup,
  };
}

function getTabOrderMap(productSlug) {
  return (
    NAVIGATION_ORDER_INDEXES.tabOrderMapByProduct.get(productSlug) ?? EMPTY_MAP
  );
}

function getGroupOrderMap(productSlug, tabSlug) {
  const byTab =
    NAVIGATION_ORDER_INDEXES.groupOrderMapByProductTab.get(productSlug) ??
    EMPTY_MAP;
  return byTab.get(tabSlug) ?? EMPTY_MAP;
}

function getPageOrderMap(productSlug, tabSlug, groupSlug) {
  const byTab =
    NAVIGATION_ORDER_INDEXES.pageOrderMapByProductTabGroup.get(productSlug) ??
    EMPTY_MAP;
  const byGroup = byTab.get(tabSlug) ?? EMPTY_MAP;
  return byGroup.get(groupSlug) ?? EMPTY_MAP;
}

function sortByConfiguredOrder(
  items,
  getOrderKey,
  orderMap,
  fallbackCompare = null
) {
  return [...items].sort((a, b) => {
    const orderA = orderMap.get(getOrderKey(a));
    const orderB = orderMap.get(getOrderKey(b));

    if (orderA !== undefined && orderB !== undefined) return orderA - orderB;
    if (orderA !== undefined) return -1;
    if (orderB !== undefined) return 1;

    return fallbackCompare ? fallbackCompare(a, b) : 0;
  });
}

function toTabRelativePagePath(pagePath, language, productSlug, tabSlug) {
  const prefix = `${language}/${productSlug}/${tabSlug}/`;
  if (!pagePath.startsWith(prefix)) return pagePath;
  return pagePath.slice(prefix.length);
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

/**
 * ⭐ Page sorting function
 * Sorting rules (priority high -> low):
 * 1. index files first
 * 2. files with sidebar_position sorted by number (smaller first)
 * 3. others sorted alphabetically by path
 */
async function sortPages(pages, contentRootAbs) {
  const isIndex = (p) => p.endsWith("/index");
  
  // read sidebar_position for each page
  const pagePositions = new Map();
  for (const pagePath of pages) {
    const filePath = path.join(contentRootAbs, pagePath + ".mdx");
    let altPath = path.join(contentRootAbs, pagePath + ".md");
    
    // try .mdx or .md
    let content = null;
    try {
      content = await fs.readFile(filePath, "utf8");
    } catch {
      try {
        content = await fs.readFile(altPath, "utf8");
      } catch {
        // file not found, skip
      }
    }
    
    if (content) {
      const position = parseFrontmatterSidebarPosition(content);
      if (position !== null) {
        pagePositions.set(pagePath, position);
      }
    }
  }
  
  return [...pages].sort((a, b) => {
    // 1. index files first
    if (isIndex(a) && !isIndex(b)) return -1;
    if (!isIndex(a) && isIndex(b)) return 1;
    
    // 2. sidebar_position numeric order
    const posA = pagePositions.get(a);
    const posB = pagePositions.get(b);
    
    if (posA !== undefined && posB !== undefined) {
      return posA - posB;
    }
    if (posA !== undefined) return -1; // A has position -> earlier
    if (posB !== undefined) return 1;  // B has position -> earlier
    
    // 3. alphabetic fallback
    return a.localeCompare(b);
  });
}

async function collectPagesRecursively(dirAbs, contentRootAbs, updateTitles = false) {
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
        const content = await fs.readFile(full, "utf8");
        if (parseFrontmatterSidebarHidden(content)) continue;

        const pagePath = pagePathFromFile(contentRootAbs, full);
        pages.push(pagePath);
        
        // If updateTitles enabled, update English page title
        if (updateTitles) {
          await updateEnglishPageTitle(full, updateTitles);
        }
      }
    }
  }

  return sortPages(pages, contentRootAbs);
}

/* ===================== Core logic ===================== */

async function buildNavigationForLanguage(language, docs, contentRootAbs, updateTitles = false) {
  const langAbs = path.join(contentRootAbs, language);
  const products = [];
  const existingLanguageConfig =
    docs.navigation?.languages?.find((l) => l.language === language) ?? {};
  const existingProducts = Array.isArray(existingLanguageConfig.products)
    ? existingLanguageConfig.products
    : [];

  const productDirs = (await listDir(langAbs)).filter((e) => e.isDirectory());
  const productOrderMap = NAVIGATION_ORDER_INDEXES.productOrderMap;
  productDirs.sort((a, b) => {
    const orderA = productOrderMap.get(a.name);
    const orderB = productOrderMap.get(b.name);

    if (orderA !== undefined && orderB !== undefined) return orderA - orderB;
    if (orderA !== undefined) return -1;
    if (orderB !== undefined) return 1;
    return a.name.localeCompare(b.name);
  });

  for (const productDir of productDirs) {
    const productSlug = productDir.name;
    const productAbs = path.join(langAbs, productSlug);

    const productName = toDisplayName(productSlug, language);
    const tabOrderMap = getTabOrderMap(productSlug);
    const tabs = [];

    const tabDirs = (await listDir(productAbs)).filter((e) =>
      e.isDirectory()
    );

    for (const tabDir of tabDirs) {
      const tabSlug = tabDir.name;
      const tabAbs = path.join(productAbs, tabSlug);

      const tabName = toDisplayName(tabSlug, language);
      const groupOrderMap = getGroupOrderMap(productSlug, tabSlug);
      const toPageOrderKey = (pagePath) =>
        toTabRelativePagePath(pagePath, language, productSlug, tabSlug);
      const groups = [];
      const defaultPages = [];

      const children = await listDir(tabAbs);

      for (const child of children) {
        const childAbs = path.join(tabAbs, child.name);

        if (child.isDirectory()) {
          const groupSlug = child.name;
          const groupName = toDisplayName(groupSlug, language);
          const pages = await collectPagesRecursively(
            childAbs,
            contentRootAbs,
            updateTitles
          );
          if (pages.length) {
            const orderedPages = sortByConfiguredOrder(
              pages,
              toPageOrderKey,
              getPageOrderMap(productSlug, tabSlug, groupSlug)
            );
            groups.push({
              group: groupName,
              groupSlug,
              pages: orderedPages,
            });
          }
        } else if (
          child.isFile() &&
          MARKDOWN_EXTS.has(path.extname(child.name).toLowerCase())
        ) {
          const content = await fs.readFile(childAbs, "utf8");
          if (parseFrontmatterSidebarHidden(content)) continue;

          const filePath = pagePathFromFile(contentRootAbs, childAbs);
          defaultPages.push(filePath);
          
          // If updateTitles enabled, update English page title
          if (updateTitles) {
            await updateEnglishPageTitle(childAbs, updateTitles);
          }
        }
      }

      if (!groups.length && !defaultPages.length) continue;

      const tabNode = { tab: tabName, tabSlug: tabSlug, groups: [] };

      if (defaultPages.length) {
        const sortedDefaultPages = await sortPages(defaultPages, contentRootAbs);
        const orderedDefaultPages = sortByConfiguredOrder(
          sortedDefaultPages,
          toPageOrderKey,
          getPageOrderMap(productSlug, tabSlug, DEFAULT_GROUP_SLUG)
        );
        tabNode.groups.push({
          groupSlug: DEFAULT_GROUP_SLUG,
          group:
            DEFAULT_GROUP_NAME_BY_LANGUAGE[language] ?? "Default",
          pages: orderedDefaultPages,
        });
      }

      const sortedNonDefaultGroups = sortByConfiguredOrder(
        groups.sort((a, b) => a.group.localeCompare(b.group)),
        (group) => group.groupSlug,
        groupOrderMap
      );
      tabNode.groups.push(...sortedNonDefaultGroups);

      // Keep default group first unless __default__ is explicitly configured.
      if (groupOrderMap.has(DEFAULT_GROUP_SLUG)) {
        tabNode.groups = sortByConfiguredOrder(
          tabNode.groups,
          (group) => group.groupSlug,
          groupOrderMap
        );
      }

      tabs.push(tabNode);
    }

    // ⭐ Sort tabs according to configuration
    if (tabs.length) {
      tabs.sort((a, b) => {
        const orderA = tabOrderMap.get(a.tabSlug);
        const orderB = tabOrderMap.get(b.tabSlug);
        
        // if both configured, sort by configured order
        if (orderA !== undefined && orderB !== undefined) {
          return orderA - orderB;
        }
        // if only A configured, A first
        if (orderA !== undefined) {
          return -1;
        }
        // if only B configured, B first
        if (orderB !== undefined) {
          return 1;
        }
        // otherwise alphabetic by slug
        return a.tabSlug.localeCompare(b.tabSlug);
      });
      
      // After sorting, remove internal slugs and keep display names for output
      tabs.forEach((tab) => {
        delete tab.tabSlug;
        tab.groups.forEach((group) => {
          delete group.groupSlug;
        });
      });

      products.push({
        product: productName,
        tabs,
      });
    }
  }

  // Get existing config (if any), but exclude products and navbar which are generated by the script
  const mergedProducts = mergeProductsWithExistingConfig(products, existingProducts);
  const existingConfig = existingLanguageConfig;
  const { products: _, navbar: __, ...restConfig } = existingConfig;
  
  return {
    ...restConfig, // keep other config (e.g., default)
    language,
    // add per-language navbar (object format required by Mintlify schema)
    navbar: NAVBAR_BY_LANGUAGE[language] ?? NAVBAR_BY_LANGUAGE.en,
    products: mergedProducts, // generated pages + preserved manual navigation config
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

  DISPLAY_NAME_OVERRIDES = JSON.parse(
    await fs.readFile(DISPLAY_NAME_OVERRIDES_FILE, "utf8")
  );
  NAVIGATION_ORDER_INDEXES = buildNavigationOrderIndexes(
    JSON.parse(await fs.readFile(NAVIGATION_ORDER_TREE_FILE, "utf8"))
  );
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
      await buildNavigationForLanguage(lang, docs, contentRootAbs, args.updateTitles)
    );
  }

  docs.navigation ??= {};
  docs.navigation.languages = languageNodes;

  // Note: navbar is configured per-language; if Mintlify doesn't support it,
  // fall back to global navbar (default language).
  const defaultLang =
    languageNodes.find((l) => l.default)?.language ??
    languageNodes[0]?.language ??
    "en";
  docs.navbar = NAVBAR_BY_LANGUAGE[defaultLang] ?? NAVBAR_BY_LANGUAGE.en;

  // ⭐ Site custom CSS entry (for fonts/sidebar emphasis etc)
  // If docs.json already configures css, do not override
  if (!docs.css) {
    // Note: this project's static assets path is /public/xxx (e.g., /public/styles.css)
    docs.css = "/public/styles.css";
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
  
  if (args.updateTitles) {
    console.log(`✅ English page titles updated`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
