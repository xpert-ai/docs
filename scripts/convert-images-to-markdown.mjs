#!/usr/bin/env node
/**
 * 将文档中的 HTML 图片引用转换为 Markdown 格式
 * 
 * 转换规则：
 * 1. <img src="/img/..." alt="..."/> → ![alt](/public/img/...)
 * 2. <figure>...<img src="..." alt="..."/>...</figure> → ![alt](/public/img/...)
 * 
 * 使用方法：
 *   node scripts/convert-images-to-markdown.mjs
 */

import fs from "node:fs/promises";
import path from "node:path";

const TARGET_DIR = "en/bi";

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
 * 规范化图片路径为 /public/img/... 格式
 */
function normalizeImagePath(src) {
  if (!src) return null;
  
  // 已经是完整 URL，不处理
  if (src.startsWith("http://") || src.startsWith("https://") || src.startsWith("data:")) {
    return null;
  }
  
  // 已经是 /public/img/ 开头，直接返回
  if (src.startsWith("/public/img/")) {
    return src;
  }
  
  // /img/... → /public/img/...
  if (src.startsWith("/img/")) {
    return "/public" + src;
  }
  
  // img/... → /public/img/...
  if (src.startsWith("img/")) {
    return "/public/" + src;
  }
  
  // public/img/... → /public/img/...
  if (src.startsWith("public/img/")) {
    return "/" + src;
  }
  
  // /public/... 但不在 img 下，保持不变
  if (src.startsWith("/public/")) {
    return src;
  }
  
  // 其他情况，如果看起来是图片路径，添加 /public/img/ 前缀
  const imageExts = [".png", ".jpg", ".jpeg", ".gif", ".svg", ".avif", ".webp"];
  const isImage = imageExts.some(ext => src.toLowerCase().endsWith(ext));
  
  if (isImage) {
    // 如果路径包含 ai/ 或其他目录结构，假设应该在 /public/img/ 下
    if (src.includes("/")) {
      if (src.startsWith("/")) {
        return "/public" + src;
      }
      return "/public/" + src;
    }
  }
  
  return null;
}

/**
 * 从 <img> 标签中提取 src 和 alt
 */
function extractImgAttrs(imgTag) {
  // 提取 src 属性（支持单引号、双引号）
  // 匹配 src="/path" 或 src='/path'
  let srcMatch = imgTag.match(/\ssrc=["']([^"']+)["']/i);
  if (!srcMatch) {
    // 尝试匹配 JSX 格式 src={"/path"}
    srcMatch = imgTag.match(/\ssrc=\{["']([^"']+)["']\}/i);
  }
  const src = srcMatch ? srcMatch[1] : null;
  
  // 提取 alt 属性
  let altMatch = imgTag.match(/\salt=["']([^"']*)["']/i);
  if (!altMatch) {
    // 尝试匹配 JSX 格式 alt={"..."}
    altMatch = imgTag.match(/\salt=\{["']([^"']*)["']\}/i);
  }
  const alt = altMatch ? altMatch[1] : "图片";
  
  return { src, alt };
}

/**
 * 转换 <figure> 块中的图片
 */
function convertFigureBlocks(text) {
  const figureRe = /<figure\b[^>]*>[\s\S]*?<\/figure>/gi;
  let changed = 0;
  
  const result = text.replace(figureRe, (figureBlock) => {
    // 在 figure 块中查找 <img> 标签
    const imgMatch = figureBlock.match(/<img\b[^>]*>/i);
    if (!imgMatch) return figureBlock;
    
    const { src, alt } = extractImgAttrs(imgMatch[0]);
    if (!src) return figureBlock;
    
    const normalizedPath = normalizeImagePath(src);
    if (!normalizedPath) return figureBlock;
    
    changed++;
    return `![${alt}](${normalizedPath})`;
  });
  
  return { text: result, changed };
}

/**
 * 转换独立的 <img> 标签行（不包括在 figure 块中的）
 */
function convertStandaloneImgTags(text) {
  // 先标记所有 figure 块的位置，避免处理其中的 img
  const figureBlocks = [];
  const figureRe = /<figure\b[^>]*>[\s\S]*?<\/figure>/gi;
  let match;
  while ((match = figureRe.exec(text)) !== null) {
    figureBlocks.push({ start: match.index, end: match.index + match[0].length });
  }
  
  // 查找所有 <img> 标签
  const imgRe = /<img\b[^>]*?\/?>/gis;
  const replacements = [];
  
  while ((match = imgRe.exec(text)) !== null) {
    const imgStart = match.index;
    const imgEnd = match.index + match[0].length;
    
    // 检查这个 img 是否在某个 figure 块中
    const inFigure = figureBlocks.some(
      (block) => imgStart >= block.start && imgEnd <= block.end
    );
    
    if (inFigure) continue; // 跳过 figure 块中的 img
    
    const { src, alt } = extractImgAttrs(match[0]);
    if (!src) continue;
    
    const normalizedPath = normalizeImagePath(src);
    if (!normalizedPath) continue;
    
    replacements.push({
      start: imgStart,
      end: imgEnd,
      replacement: `![${alt}](${normalizedPath})`,
    });
  }
  
  // 从后往前替换，避免索引变化
  let result = text;
  for (let i = replacements.length - 1; i >= 0; i--) {
    const { start, end, replacement } = replacements[i];
    result = result.substring(0, start) + replacement + result.substring(end);
  }
  
  return { text: result, changed: replacements.length };
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
  let totalConversions = 0;
  
  // 处理每个文件
  for (const filePath of allFiles) {
    try {
      const content = await fs.readFile(filePath, "utf8");
      
      // 检查是否需要处理
      if (!shouldProcessFile(filePath, content)) {
        continue;
      }
      
      // 先转换 figure 块
      const figureResult = convertFigureBlocks(content);
      
      // 再转换独立的 img 标签
      const imgResult = convertStandaloneImgTags(figureResult.text);
      
      const totalChanged = figureResult.changed + imgResult.changed;
      
      // 如果有变化，写入文件
      if (totalChanged > 0 && imgResult.text !== content) {
        await fs.writeFile(filePath, imgResult.text, "utf8");
        processedFiles++;
        totalConversions += totalChanged;
        console.log(`✅ ${filePath}: 转换了 ${totalChanged} 个图片引用`);
      }
    } catch (error) {
      console.error(`❌ 处理文件失败 ${filePath}:`, error.message);
    }
  }
  
  console.log(`\n✨ 完成！`);
  console.log(`   - 处理了 ${processedFiles} 个文件`);
  console.log(`   - 转换了 ${totalConversions} 个图片引用`);
}

// 运行脚本
main().catch((error) => {
  console.error("❌ 脚本执行失败:", error);
  process.exit(1);
});

