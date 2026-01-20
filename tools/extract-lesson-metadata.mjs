/**
 * Extract frontmatter from MDX lesson files to JSON
 * This enables proper code splitting by separating metadata from components
 */
import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

function extractFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return null;

  const yaml = match[1];
  const frontmatter = {};

  // Parse YAML-like frontmatter
  const lines = yaml.split('\n');
  for (const line of lines) {
    const colonIndex = line.indexOf(':');
    if (colonIndex === -1) continue;

    const key = line.slice(0, colonIndex).trim();
    let value = line.slice(colonIndex + 1).trim();

    // Handle string values (with quotes)
    if (value.startsWith("'") && value.endsWith("'")) {
      frontmatter[key] = value.slice(1, -1);
    }
    // Handle arrays
    else if (value.startsWith('[')) {
      const arrayContent = value.slice(1, -1);
      frontmatter[key] = arrayContent
        .split(',')
        .map((item) => item.trim().replace(/^['"]|['"]$/g, ''))
        .filter((item) => item.length > 0);
    }
    // Handle numbers
    else if (/^\d+$/.test(value)) {
      frontmatter[key] = parseInt(value, 10);
    }
    // Handle plain strings
    else {
      frontmatter[key] = value;
    }
  }

  return frontmatter;
}

function main() {
  const lessonsDir = join(__dirname, '../src/content/lessons');
  const outputPath = join(lessonsDir, 'metadata.json');

  const files = readdirSync(lessonsDir).filter((f) => f.endsWith('.mdx'));
  const metadata = [];

  for (const file of files) {
    const filePath = join(lessonsDir, file);
    const content = readFileSync(filePath, 'utf-8');
    const frontmatter = extractFrontmatter(content);

    if (frontmatter) {
      metadata.push({
        ...frontmatter,
        path: `/src/content/lessons/${file}`,
      });
    } else {
      console.warn(`Warning: Could not extract frontmatter from ${file}`);
    }
  }

  // Sort by difficulty and then by title
  const difficultyOrder = { beginner: 0, intermediate: 1, advanced: 2 };
  metadata.sort((a, b) => {
    const diffDiff = difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty];
    if (diffDiff !== 0) return diffDiff;
    return a.title.localeCompare(b.title, 'ja');
  });

  writeFileSync(outputPath, JSON.stringify(metadata, null, 2), 'utf-8');
  console.log(`Extracted metadata from ${metadata.length} lessons to ${outputPath}`);
}

main();
