#!/usr/bin/env node
/**
 * 将 `故事/` 文件夹中的 MD/MDX 文件提取并重命名
 * 
 * 规则：
 * - 如果文件名为 `index.md` 或 `index.mdx`，重命名为其所在文件夹名
 * - 如果文件名已经是文件夹名（如 `create-story.md`），保持不变
 * - 将文件移动到目标目录（默认：`故事/` 的父目录，或指定 `--output`）
 * 
 * 使用方法：
 *   node scripts/rename-stories-files.mjs --dry-run
 *   node scripts/rename-stories-files.mjs --write
 *   node scripts/rename-stories-files.mjs --write --output ./stories-output
 */

import fs from "node:fs/promises";
import path from "node:path";

const MARKDOWN_EXTS = new Set([".md", ".mdx"]);
const STORIES_DIR = "故事";

function parseArgs(argv) {
  const args = {
    dryRun: !argv.includes("--write"),
    write: argv.includes("--write"),
    output: null,
  };
  const idx = argv.findIndex((a) => a === "--output");
  if (idx >= 0) args.output = argv[idx + 1] ?? null;
  return args;
}

async function collectMarkdownFiles(dirAbs) {
  const files = [];
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
      
      if (e.isDirectory()) {
        stack.push(full);
      } else if (e.isFile()) {
        const ext = path.extname(e.name).toLowerCase();
        if (MARKDOWN_EXTS.has(ext)) {
          files.push(full);
        }
      }
    }
  }
  
  return files;
}

function determineNewName(filePath, storiesDirAbs) {
  const dir = path.dirname(filePath);
  const basename = path.basename(filePath);
  const ext = path.extname(basename);
  
  // 如果是 index.md 或 index.mdx，使用文件夹名
  if (basename === `index${ext}`) {
    const folderName = path.basename(dir);
    // 如果文件夹就是 stories 目录本身，使用文件名（去掉 index）
    if (dir === storiesDirAbs) {
      return `index${ext}`; // 保持原样
    }
    return `${folderName}${ext}`;
  }
  
  // 否则保持原文件名
  return basename;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const repoRoot = process.cwd();
  const storiesDirAbs = path.join(repoRoot, STORIES_DIR);
  
  // 检查目录是否存在
  try {
    const stat = await fs.stat(storiesDirAbs);
    if (!stat.isDirectory()) {
      console.error(`❌ ${STORIES_DIR} 不是一个目录`);
      process.exit(1);
    }
  } catch {
    console.error(`❌ 找不到目录: ${STORIES_DIR}`);
    process.exit(1);
  }
  
  // 确定输出目录
  const outputDirAbs = args.output
    ? (path.isAbsolute(args.output) ? args.output : path.join(repoRoot, args.output))
    : path.join(repoRoot, "stories-output");
  
  console.log(`📁 源目录: ${STORIES_DIR}`);
  console.log(`📁 输出目录: ${path.relative(repoRoot, outputDirAbs)}`);
  console.log(`模式: ${args.dryRun ? "DRY-RUN（预览）" : "WRITE（实际执行）"}\n`);
  
  // 收集所有 MD/MDX 文件
  const files = await collectMarkdownFiles(storiesDirAbs);
  console.log(`找到 ${files.length} 个文件\n`);
  
  const plans = [];
  for (const file of files) {
    const newName = determineNewName(file, storiesDirAbs);
    const relativePath = path.relative(storiesDirAbs, file);
    const relativeDir = path.dirname(relativePath);
    
    // 计算目标路径
    let targetPath;
    if (relativeDir === ".") {
      // 文件直接在 stories 目录下
      targetPath = path.join(outputDirAbs, newName);
    } else {
      // 文件在子目录中，保持目录结构但重命名文件
      targetPath = path.join(outputDirAbs, relativeDir, newName);
    }
    
    plans.push({
      source: file,
      target: targetPath,
      oldName: path.basename(file),
      newName,
      relativePath,
    });
  }
  
  // 显示计划
  console.log("计划重命名的文件：\n");
  for (const p of plans) {
    const relSource = path.relative(repoRoot, p.source);
    const relTarget = path.relative(repoRoot, p.target);
    if (p.oldName !== p.newName) {
      console.log(`  📝 ${relSource}`);
      console.log(`     -> ${relTarget} (重命名: ${p.oldName} -> ${p.newName})`);
    } else {
      console.log(`  📄 ${relSource}`);
      console.log(`     -> ${relTarget} (保持原名)`);
    }
  }
  
  if (args.dryRun) {
    console.log(`\n✅ 预览完成。使用 --write 来实际执行重命名和复制。`);
    return;
  }
  
  // 执行操作
  console.log(`\n开始执行...\n`);
  
  // 创建输出目录
  await fs.mkdir(outputDirAbs, { recursive: true });
  
  let copied = 0;
  let renamed = 0;
  
  for (const p of plans) {
    // 确保目标目录存在
    const targetDir = path.dirname(p.target);
    await fs.mkdir(targetDir, { recursive: true });
    
    // 复制文件
    const content = await fs.readFile(p.source, "utf8");
    await fs.writeFile(p.target, content, "utf8");
    
    if (p.oldName !== p.newName) {
      renamed++;
    }
    copied++;
  }
  
  console.log(`\n✅ 完成！`);
  console.log(`   - 复制文件: ${copied}`);
  console.log(`   - 重命名文件: ${renamed}`);
  console.log(`   - 输出目录: ${path.relative(repoRoot, outputDirAbs)}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

