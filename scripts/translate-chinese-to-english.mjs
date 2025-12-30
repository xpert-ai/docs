#!/usr/bin/env node
/**
 * 将 en 目录下所有文档中的中文内容翻译成英文
 * 
 * 功能：
 * 1. 递归遍历 en 目录下的所有文档文件
 * 2. 识别并提取中文内容
 * 3. 使用翻译 API 将中文翻译成英文
 * 4. 替换原文件中的中文内容
 * 
 * 使用方法：
 *   node scripts/translate-chinese-to-english.mjs --dry-run
 *   node scripts/translate-chinese-to-english.mjs --write
 * 
 * 配置：
 *   需要设置翻译 API 的配置（见脚本中的配置部分）
 */

import fs from "node:fs/promises";
import path from "node:path";

const argv = process.argv.slice(2);
const isDryRun = argv.includes("--dry-run") || !argv.includes("--write");
const TARGET_DIR = "en";

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
 * 提取文本中的中文片段
 */
function extractChineseTexts(text) {
  // 匹配中文字符（包括中文标点）
  const chineseRe = /[\u4e00-\u9fa5\u3000-\u303f\uff00-\uffef]+[^\u4e00-\u9fa5\u3000-\u303f\uff00-\uffef]*[\u4e00-\u9fa5\u3000-\u303f\uff00-\uffef]*/g;
  const matches = [];
  let match;
  
  while ((match = chineseRe.exec(text)) !== null) {
    matches.push({
      text: match[0],
      index: match.index,
      length: match[0].length
    });
  }
  
  return matches;
}

/**
 * 翻译中文文本为英文
 * 
 * 注意：这里需要配置实际的翻译 API
 * 可以使用：
 * - Google Translate API
 * - DeepL API
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
  
  // 临时返回：提示需要配置翻译 API
  throw new Error("请配置翻译 API。脚本中需要实现 translateToEnglish 函数。");
}

/**
 * 处理文件内容，翻译其中的中文
 */
async function translateFileContent(content) {
  if (!containsChinese(content)) {
    return { content, changed: false };
  }
  
  // 提取所有中文片段
  const chineseTexts = extractChineseTexts(content);
  if (chineseTexts.length === 0) {
    return { content, changed: false };
  }
  
  // 翻译每个中文片段
  const translations = new Map();
  for (const item of chineseTexts) {
    try {
      const translated = await translateToEnglish(item.text);
      translations.set(item.text, translated);
    } catch (error) {
      console.error(`翻译失败: "${item.text}"`, error.message);
      // 如果翻译失败，保留原文
      translations.set(item.text, item.text);
    }
  }
  
  // 替换原文中的中文
  let result = content;
  for (const [chinese, english] of translations) {
    result = result.replace(chinese, english);
  }
  
  return { content: result, changed: translations.size > 0 };
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
    } else if (entry.isFile()) {
      files.push(fullPath);
    }
  }
  
  return files;
}

/**
 * 主函数
 */
async function main() {
  const targetDir = path.resolve(process.cwd(), TARGET_DIR);
  
  console.log(`📁 扫描目录: ${targetDir}`);
  console.log(`模式: ${isDryRun ? "预览模式（不会修改文件）" : "写入模式（将修改文件）"}`);
  
  // 检查目录是否存在
  try {
    await fs.access(targetDir);
  } catch (error) {
    console.error(`❌ 目录不存在: ${targetDir}`);
    process.exit(1);
  }
  
  // 收集所有文件
  const allFiles = await collectFiles(targetDir);
  console.log(`📄 找到 ${allFiles.length} 个文件`);
  
  let processedFiles = 0;
  let filesWithChinese = 0;
  let totalTranslations = 0;
  
  // 处理每个文件
  for (const filePath of allFiles) {
    try {
      const content = await fs.readFile(filePath, "utf8");
      
      // 检查是否需要处理
      if (!shouldProcessFile(filePath, content)) {
        continue;
      }
      
      // 检查是否包含中文
      if (!containsChinese(content)) {
        continue;
      }
      
      filesWithChinese++;
      console.log(`\n🔄 处理文件: ${filePath}`);
      
      // 翻译文件内容
      const { content: translatedContent, changed } = await translateFileContent(content);
      
      if (changed) {
        totalTranslations++;
        if (!isDryRun) {
          await fs.writeFile(filePath, translatedContent, "utf8");
          console.log(`✅ 已翻译并更新: ${filePath}`);
        } else {
          console.log(`📝 预览: 将翻译此文件`);
        }
        processedFiles++;
      }
    } catch (error) {
      console.error(`❌ 处理文件失败 ${filePath}:`, error.message);
    }
  }
  
  console.log(`\n✨ 完成！`);
  console.log(`   - 扫描了 ${allFiles.length} 个文件`);
  console.log(`   - 发现 ${filesWithChinese} 个包含中文的文件`);
  console.log(`   - ${isDryRun ? "预览" : "已处理"} ${processedFiles} 个文件`);
  console.log(`   - 翻译了 ${totalTranslations} 个文件`);
  
  if (isDryRun) {
    console.log(`\nℹ️  运行脚本时添加 --write 参数来实际修改文件`);
  }
}

// 运行脚本
main().catch((error) => {
  console.error("❌ 脚本执行失败:", error);
  process.exit(1);
});

