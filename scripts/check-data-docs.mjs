#!/usr/bin/env node

/**
 * CI check for the Chinese Data Xpert documentation tree.
 * It intentionally uses only Node's standard library so it can run in a
 * docs checkout without installing the product monorepo dependencies.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(scriptDir, '..')
const dataRoot = path.join(root, 'zh-Hans', 'data')
const errors = []

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const current = path.join(dir, entry.name)
    if (entry.isDirectory()) return walk(current)
    return entry.isFile() && entry.name.endsWith('.mdx') ? [current] : []
  })
}

function resolveTarget(source, raw) {
  let target = raw.trim()
  if (target.startsWith('<')) target = target.slice(1, target.indexOf('>'))
  else target = target.split(/\s+/)[0]
  if (!target || /^(?:https?:|mailto:|#)/.test(target)) return null

  const decoded = decodeURIComponent(target.split('#')[0])
  const candidate = decoded.startsWith('/')
    ? path.join(root, decoded.slice(1))
    : path.resolve(path.dirname(source), decoded)
  if (path.extname(candidate)) return candidate

  return [candidate, `${candidate}.mdx`, `${candidate}.md`, path.join(candidate, 'index.mdx')]
}

const pages = walk(dataRoot)
for (const source of pages) {
  const text = fs.readFileSync(source, 'utf8')
  const relative = path.relative(root, source)
  if (!text.startsWith('---\n')) errors.push(`${relative}: missing frontmatter`)
  else {
    const frontmatter = text.split('---\n', 3)[1]
    if (!/^title:\s*\S/m.test(frontmatter)) errors.push(`${relative}: missing title`)
    if (!/^description:\s*\S/m.test(frontmatter)) errors.push(`${relative}: missing description`)
  }

  const links = /\]\(([^)]+)\)/g
  for (const match of text.matchAll(links)) {
    const raw = match[1]
    const resolved = resolveTarget(source, raw)
    if (!resolved) continue
    const candidates = Array.isArray(resolved) ? resolved : [resolved]
    if (!candidates.some((candidate) => fs.existsSync(candidate))) {
      errors.push(`${relative}: broken link ${raw.trim()}`)
    }
  }
}

if (errors.length) {
  console.error(errors.join('\n'))
  process.exitCode = 1
} else {
  console.log(`Data docs check passed: ${pages.length} pages, metadata and local links are valid.`)
}
