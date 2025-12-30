#!/usr/bin/env node
/**
 * 将 en/bi/widget 目录下的所有中文内容翻译成英文
 * 
 * 功能：
 * 1. 递归遍历 en/bi/widget 目录下的所有 MDX 文件
 * 2. 识别并提取中文内容（保留 frontmatter 中的 title，但会翻译 body）
 * 3. 使用翻译 API 将中文翻译成英文
 * 4. 替换原文件中的中文内容
 * 
 * 使用方法：
 *   node scripts/translate-widget-files.mjs --dry-run
 *   node scripts/translate-widget-files.mjs --write
 * 
 * 配置：
 *   需要设置翻译 API 的配置（见脚本中的配置部分）
 *   支持的翻译服务：Google Translate API、DeepL API、OpenAI API
 */

import fs from "node:fs/promises";
import path from "node:path";

const argv = process.argv.slice(2);
const isDryRun = argv.includes("--dry-run") || !argv.includes("--write");
const TARGET_DIR = "en/bi/widget";

// 支持的 Markdown 文件扩展名
const MARKDOWN_EXTS = new Set([".md", ".mdx"]);

/**
 * 判断文件是否需要处理
 */
function shouldProcessFile(filePath, content) {
  const ext = path.extname(filePath).toLowerCase();
  if (MARKDOWN_EXTS.has(ext)) return true;
  // 处理无扩展名但有 frontmatter 的文件
  if (!ext && content.startsWith("---")) return true;
  return false;
}

/**
 * 检测文本中是否包含中文
 */
function containsChinese(text) {
  return /[\u4e00-\u9fa5]/.test(text);
}

/**
 * 解析 frontmatter 和 body
 */
function parseFrontmatter(content) {
  if (!content.startsWith("---")) {
    return { frontmatter: null, body: content };
  }
  
  const endIndex = content.indexOf("---", 3);
  if (endIndex === -1) {
    return { frontmatter: null, body: content };
  }
  
  const frontmatter = content.slice(0, endIndex + 3);
  const body = content.slice(endIndex + 3).trimStart();
  
  return { frontmatter, body };
}

/**
 * 提取 frontmatter 中的 title
 */
function extractTitle(frontmatter) {
  if (!frontmatter) return null;
  const match = frontmatter.match(/^title:\s*(.+)$/m);
  return match ? match[1].trim().replace(/^["']|["']$/g, "") : null;
}

/**
 * 更新 frontmatter 中的 title
 */
function updateTitle(frontmatter, newTitle) {
  if (!frontmatter) return null;
  return frontmatter.replace(/^title:\s*.+$/m, `title: ${newTitle}`);
}

/**
 * 翻译中文文本为英文
 * 
 * 注意：这里需要配置实际的翻译 API
 * 可以使用：
 * - Google Translate API
 * - DeepL API
 * - OpenAI API
 * - 或其他翻译服务
 */
async function translateToEnglish(chineseText) {
  // TODO: 实现实际的翻译逻辑
  // 这里是一个占位符，你需要根据选择的翻译服务来实现
  
  // 示例：使用 Google Translate API
  // const { Translate } = require('@google-cloud/translate').v2;
  // const translate = new Translate({ key: 'YOUR_API_KEY' });
  // const [translation] = await translate.translate(chineseText, 'en');
  // return translation;
  
  // 示例：使用 DeepL API
  // const deepl = require('deepl-node');
  // const translator = new deepl.Translator('YOUR_API_KEY');
  // const result = await translator.translateText(chineseText, 'zh', 'en-US');
  // return result.text;
  
  // 示例：使用 OpenAI API
  // const OpenAI = require('openai');
  // const openai = new OpenAI({ apiKey: 'YOUR_API_KEY' });
  // const response = await openai.chat.completions.create({
  //   model: 'gpt-4',
  //   messages: [
  //     { role: 'system', content: 'You are a professional translator. Translate Chinese to English.' },
  //     { role: 'user', content: chineseText }
  //   ]
  // });
  // return response.choices[0].message.content;
  
  // 临时返回：提示需要配置翻译 API
  throw new Error("请配置翻译 API。脚本中需要实现 translateToEnglish 函数。");
}

/**
 * 处理文件内容，翻译其中的中文
 */
async function translateFileContent(content) {
  const { frontmatter, body } = parseFrontmatter(content);
  
  // 检查是否有中文
  const hasChineseInBody = containsChinese(body);
  const title = extractTitle(frontmatter);
  const hasChineseInTitle = title && containsChinese(title);
  
  if (!hasChineseInBody && !hasChineseInTitle) {
    return { content, changed: false };
  }
  
  let newFrontmatter = frontmatter;
  let newBody = body;
  
  // 翻译 title（如果包含中文）
  if (hasChineseInTitle && title) {
    try {
      const translatedTitle = await translateToEnglish(title);
      newFrontmatter = updateTitle(frontmatter, translatedTitle);
    } catch (error) {
      console.warn(`⚠️  翻译标题失败: "${title}"`, error.message);
    }
  }
  
  // 翻译 body（如果包含中文）
  if (hasChineseInBody) {
    try {
      // 分段翻译，避免一次性翻译过长文本
      const paragraphs = body.split(/\n\n+/);
      const translatedParagraphs = [];
      
      for (const para of paragraphs) {
        if (containsChinese(para)) {
          const translated = await translateToEnglish(para);
          translatedParagraphs.push(translated);
        } else {
          translatedParagraphs.push(para);
        }
      }
      
      newBody = translatedParagraphs.join("\n\n");
    } catch (error) {
      console.error(`⚠️  翻译正文失败`, error.message);
      return { content, changed: false };
    }
  }
  
  const result = newFrontmatter 
    ? `${newFrontmatter}\n${newBody}`
    : newBody;
  
  return { content: result, changed: true };
}

/**
 * 递归遍历目录，收集所有需要处理的文件
 */
async function collectFiles(dirPath) {
  const files = [];
  const entries = await fs.readdir(dirPath, { withFileTypes: true });
  
  for (const entry of entries) {
    if (entry.name.startsWith(".")) continue;
    
    const fullPath = path.join(dirPath, entry.name);
    
    if (entry.isDirectory()) {
      files.push(...(await collectFiles(fullPath)));
    } else {
      const content = await fs.readFile(fullPath, "utf8").catch(() => null);
      if (content && shouldProcessFile(fullPath, content)) {
        files.push(fullPath);
      }
    }
  }
  
  return files;
}

/**
 * 主函数
 */
async function main() {
  const targetDir = path.resolve(TARGET_DIR);
  console.log(`📁 扫描目录: ${targetDir}`);

  const files = await collectFiles(targetDir);
  console.log(`📄 找到 ${files.length} 个文件\n`);

  const results = [];
  for (const file of files) {
    try {
      const content = await fs.readFile(file, "utf8");
      const { content: translatedContent, changed } = await translateFileContent(content);
      
      const relPath = path.relative(process.cwd(), file);
      
      if (changed) {
        results.push({ file, relPath, translatedContent });
        console.log(`✅ ${relPath}`);
      } else {
        console.log(`⏭️  ${relPath} (无需翻译)`);
      }
    } catch (error) {
      console.error(`❌ 处理文件失败: ${file}`, error.message);
    }
  }

  console.log(`\n📊 统计:`);
  console.log(`   总文件数: ${files.length}`);
  console.log(`   需要翻译: ${results.length}`);
  console.log(`   无需翻译: ${files.length - results.length}`);

  if (isDryRun) {
    console.log(`\n🔍 这是预览模式，使用 --write 来实际更新文件`);
  } else if (results.length > 0) {
    console.log(`\n💾 正在更新文件...`);
    for (const result of results) {
      await fs.writeFile(result.file, result.translatedContent, "utf8");
    }
    console.log(`✅ 已更新 ${results.length} 个文件`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

