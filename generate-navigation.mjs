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
 * ⭐ 页面标题映射（用于更新英文版本的 MDX 文件中的 title）
 * key = 中文标题
 * value = 英文标题
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
    // Bi 产品
    bi: "Bi",
    "indicator-management": "Indicator Management",
    "semantic-model": "Semantic Model",
    "story-dashboard": "Story Dashboard",
    "website-features": "Website Features",
    widget: "Widget",
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
    // Bi 产品
    bi: "Bi",
    "indicator-management": "指标管理",
    "semantic-model": "语义模型",
    "story-dashboard": "故事看板",
    "website-features": "网站功能",
    widget: "微件",
    // Group 名称映射（目录名）
    "create-knowledge-base-via-pipeline": "通过流水线创建知识库",
    "bi-toolset": "BI 工具集",
    "chatbi-toolset": "ChatBI 工具集",
    "mcp-tools": "MCP 工具",
    "virtual-environment": "虚拟环境",
    "feishu-document-example": "飞书文档示例",
    errors: "错误",
    "analysis-card": "分析卡片",
    "analysis-table": "分析表格",
    "filter-bar": "筛选栏",
    "input-controller": "输入控制器",
    "dimension-designer": "维度设计器",
    "multidimensional-dataset-designer": "多维数据集设计器",
  },
};

/**
 * ⭐ Tab 顺序配置（核心）
 * key = 产品目录名（slug）
 * value = tab 目录名（slug）数组，按显示顺序排列
 * 
 * 如果某个 tab 不在配置中，会按字母顺序排在最后
 * 新增 tab 时，只需在此配置中添加即可控制顺序
 */
const TAB_ORDER_BY_PRODUCT = {
  ai: [
    "conversation",
    "digital-expert",
    "knowledge-base",
    "toolset",
    "workflow",
    "ai-assistant",
    "agent-middleware",
    "troubleshooting",
    "plugin-development",
    "tutorial",
  ],
  bi: [
    "semantic-model",
    "indicator-management",
    "story-dashboard",
    "widget",
    "website-features",
  ],
};

/* ===================== Navbar 多语言映射 ===================== */

// 语言节点内的 navbar（数组格式）
const NAVBAR_ARRAY_BY_LANGUAGE = {
  en: [
    { label: "GitHub", href: "https://github.com/xpert-ai/xpert" },
    { label: "Support", href: "mailto:service@xpertai.cn" },
    { label: "Try Chat-Kit", href: "https://xpertai.cn/docs/ai/" },
  ],
  "zh-Hans": [
    { label: "GitHub", href: "https://github.com/xpert-ai/xpert" },
    { label: "支持", href: "mailto:service@xpertai.cn" },
    { label: "试用 Chat-Kit", href: "https://xpertai.cn/zh-Hans/docs/ai/" },
  ],
};

// 顶层 navbar（对象格式）——避免 main() 里引用未定义变量导致崩溃
const NAVBAR_BY_LANGUAGE = {
  en: {
    links: [
      { label: "GitHub", href: "https://github.com/xpert-ai/xpert" },
      { label: "Support", href: "mailto:service@xpertai.cn" },
    ],
    primary: {
      type: "button",
      label: "Try Chat-Kit",
      href: "https://xpertai.cn/docs/ai/",
    },
  },
  "zh-Hans": {
    links: [
      { label: "GitHub", href: "https://github.com/xpert-ai/xpert" },
      { label: "支持", href: "mailto:service@xpertai.cn" },
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
 * 检测文本中是否包含中文
 */
function containsChinese(text) {
  return /[\u4e00-\u9fa5]/.test(text);
}

/**
 * 解析 frontmatter 中的 title
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
 * 解析 frontmatter 中的 sidebar_position
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

/**
 * 根据文件名生成英文标题
 */
function generateEnglishTitleFromFilename(filePath) {
  const basename = path.basename(filePath, path.extname(filePath));
  return basename
    .split(/[-_]/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * 更新 frontmatter 中的 title
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
 * 更新英文版本的 MDX 文件中的 title（如果包含中文）
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

    // 查找映射表
    let newTitle = PAGE_TITLE_MAPPING[currentTitle];

    // 如果映射表中没有，根据文件名生成
    if (!newTitle) {
      newTitle = generateEnglishTitleFromFilename(filePath);
    }

    const updatedContent = updateFrontmatterTitle(content, newTitle);
    await fs.writeFile(filePath, updatedContent, "utf8");

    return { updated: true, oldTitle: currentTitle, newTitle };
  } catch (error) {
    console.warn(`⚠️  更新文件标题失败: ${filePath}`, error.message);
    return { updated: false, error: error.message };
  }
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

/**
 * ⭐ 页面排序函数
 * 排序规则（优先级从高到低）：
 * 1. index 文件排在最前面
 * 2. 有 sidebar_position 的按数值排序（数字越小越靠前）
 * 3. 其他按路径字母顺序排序
 */
async function sortPages(pages, contentRootAbs) {
  const isIndex = (p) => p.endsWith("/index");
  
  // 读取每个页面的 sidebar_position
  const pagePositions = new Map();
  for (const pagePath of pages) {
    const filePath = path.join(contentRootAbs, pagePath + ".mdx");
    let altPath = path.join(contentRootAbs, pagePath + ".md");
    
    // 尝试读取 .mdx 或 .md 文件
    let content = null;
    try {
      content = await fs.readFile(filePath, "utf8");
    } catch {
      try {
        content = await fs.readFile(altPath, "utf8");
      } catch {
        // 文件不存在，跳过
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
    // 1. index 文件优先
    if (isIndex(a) && !isIndex(b)) return -1;
    if (!isIndex(a) && isIndex(b)) return 1;
    
    // 2. 有 sidebar_position 的按数值排序
    const posA = pagePositions.get(a);
    const posB = pagePositions.get(b);
    
    if (posA !== undefined && posB !== undefined) {
      return posA - posB;
    }
    if (posA !== undefined) return -1; // A 有 position，排在前面
    if (posB !== undefined) return 1;  // B 有 position，排在前面
    
    // 3. 其他按字母顺序
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
        const pagePath = pagePathFromFile(contentRootAbs, full);
        pages.push(pagePath);
        
        // 如果启用了更新标题功能，更新英文版本的 title
        if (updateTitles) {
          await updateEnglishPageTitle(full, updateTitles);
        }
      }
    }
  }

  return sortPages(pages, contentRootAbs);
}

/* ===================== 核心逻辑 ===================== */

async function buildNavigationForLanguage(language, docs, contentRootAbs, updateTitles = false) {
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
            contentRootAbs,
            updateTitles
          );
          if (pages.length) groups.push({ group: groupName, pages });
        } else if (
          child.isFile() &&
          MARKDOWN_EXTS.has(path.extname(child.name).toLowerCase())
        ) {
          const filePath = pagePathFromFile(contentRootAbs, childAbs);
          defaultPages.push(filePath);
          
          // 如果启用了更新标题功能，更新英文版本的 title
          if (updateTitles) {
            await updateEnglishPageTitle(childAbs, updateTitles);
          }
        }
      }

      if (!groups.length && !defaultPages.length) continue;

      const tabNode = { tab: tabName, tabSlug: tabSlug, groups: [] };

      if (defaultPages.length) {
        tabNode.groups.push({
          group:
            DEFAULT_GROUP_NAME_BY_LANGUAGE[language] ?? "Default",
          pages: await sortPages(defaultPages, contentRootAbs),
        });
      }

      tabNode.groups.push(
        ...groups.sort((a, b) =>
          a.group.localeCompare(b.group)
        )
      );

      tabs.push(tabNode);
    }

    // ⭐ 根据配置对 tabs 进行排序
    if (tabs.length) {
      const tabOrder = TAB_ORDER_BY_PRODUCT[productSlug] || [];
      
      // 创建一个映射，将 tab slug 映射到其配置顺序
      const tabOrderMap = new Map();
      tabOrder.forEach((slug, index) => {
        tabOrderMap.set(slug, index);
      });

      tabs.sort((a, b) => {
        const orderA = tabOrderMap.get(a.tabSlug);
        const orderB = tabOrderMap.get(b.tabSlug);
        
        // 如果两个都在配置中，按配置顺序排序
        if (orderA !== undefined && orderB !== undefined) {
          return orderA - orderB;
        }
        // 如果只有 A 在配置中，A 排在前面
        if (orderA !== undefined) {
          return -1;
        }
        // 如果只有 B 在配置中，B 排在前面
        if (orderB !== undefined) {
          return 1;
        }
        // 如果都不在配置中，按字母顺序排序
        return a.tabSlug.localeCompare(b.tabSlug);
      });
      
      // 排序后移除 tabSlug，只保留 tab（显示名）用于输出
      tabs.forEach(tab => delete tab.tabSlug);

      products.push({
        product: productName,
        tabs,
      });
    }
  }

  // 获取现有配置（如果有），但排除 products 和 navbar，这些由脚本生成
  const existingConfig = docs.navigation?.languages?.find((l) => l.language === language) ?? {};
  const { products: _, navbar: __, ...restConfig } = existingConfig;
  
  return {
    ...restConfig, // 保留其他配置（如 default）
    language,
    // 为每个语言添加对应的 navbar（数组格式）
    navbar: NAVBAR_ARRAY_BY_LANGUAGE[language] ?? NAVBAR_ARRAY_BY_LANGUAGE.en,
    products, // 新生成的 products，确保使用最新的显示名
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
      await buildNavigationForLanguage(lang, docs, contentRootAbs, args.updateTitles)
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

  // ⭐ 站点自定义样式入口（用于字体/侧边栏强调等）
  // 如果 docs.json 已配置 css，则不覆盖
  if (!docs.css) {
    // 注意：本项目静态资源路径是 /public/xxx（例如 /public/styles.css）
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
