#!/usr/bin/env node
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const POST_FILE_RE = /content\/posts\/.+\.mdx$/;

function findEslintConfigDir(startDir) {
  let dir = startDir;
  while (dir !== path.parse(dir).root) {
    const hasConfig =
      fs.existsSync(path.join(dir, 'eslint.config.js')) ||
      fs.existsSync(path.join(dir, 'eslint.config.mjs')) ||
      fs.existsSync(path.join(dir, 'eslint.config.cjs'));
    if (hasConfig) return dir;
    dir = path.dirname(dir);
  }
  return null;
}

async function main() {
  let input = '';
  for await (const chunk of process.stdin) input += chunk;

  let data;
  try {
    data = JSON.parse(input);
  } catch {
    return;
  }

  const filePath = data.tool_input?.file_path;
  if (!filePath || !fs.existsSync(filePath)) return;

  const projectDir =
    process.env.CLAUDE_PROJECT_DIR ||
    (() => {
      try {
        return execSync('git rev-parse --show-toplevel', { cwd: path.dirname(filePath) })
          .toString()
          .trim();
      } catch {
        return null;
      }
    })();

  try {
    execSync(`pnpm prettier --write "${filePath}"`, {
      cwd: projectDir || path.dirname(filePath),
      stdio: 'ignore',
    });
  } catch {}

  if (POST_FILE_RE.test(filePath) && projectDir) {
    try {
      execSync(`npx tsx scripts/format-post.ts "${filePath}"`, {
        cwd: projectDir,
        stdio: 'ignore',
      });
    } catch {}
  }

  const eslintDir = findEslintConfigDir(path.dirname(filePath));
  if (eslintDir) {
    try {
      execSync(`pnpm eslint --fix "${filePath}"`, { cwd: eslintDir, stdio: 'ignore' });
    } catch {}
  }
}

main();
