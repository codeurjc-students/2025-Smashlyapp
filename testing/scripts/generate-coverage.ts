import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

interface CoverageData {
  total: {
    lines: { total: number; covered: number; skipped: number; pct: number };
    statements: { total: number; covered: number; skipped: number; pct: number };
    functions: { total: number; covered: number; skipped: number; pct: number };
    branches: { total: number; covered: number; skipped: number; pct: number };
  };
}

async function loadCoverage(filePath: string): Promise<CoverageData | null> {
  try {
    if (!fs.existsSync(filePath)) {
      console.warn(`Coverage file not found: ${filePath}`);
      return null;
    }
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.error(`Error loading coverage from ${filePath}:`, error);
    return null;
  }
}

function mergeCoverage(data1: CoverageData | null, data2: CoverageData | null): CoverageData {
  const empty: CoverageData = {
    total: {
      lines: { total: 0, covered: 0, skipped: 0, pct: 0 },
      statements: { total: 0, covered: 0, skipped: 0, pct: 0 },
      functions: { total: 0, covered: 0, skipped: 0, pct: 0 },
      branches: { total: 0, covered: 0, skipped: 0, pct: 0 },
    },
  };

  if (!data1 && !data2) return empty;
  if (!data1) return data2!;
  if (!data2) return data1;

  const mergeMetric = (
    m1: typeof empty.total.lines,
    m2: typeof empty.total.lines
  ) => ({
    total: m1.total + m2.total,
    covered: m1.covered + m2.covered,
    skipped: m1.skipped + m2.skipped,
    pct: (m1.covered + m2.covered) / (m1.total + m2.total) * 100 || 0,
  });

  return {
    total: {
      lines: mergeMetric(data1.total.lines, data2.total.lines),
      statements: mergeMetric(data1.total.statements, data2.total.statements),
      functions: mergeMetric(data1.total.functions, data2.total.functions),
      branches: mergeMetric(data1.total.branches, data2.total.branches),
    },
  };
}

function calculateWeightedAverage(coverages: { data: CoverageData; weight: number }[]): CoverageData {
  const validCoverages = coverages.filter(c => c.data !== null);
  
  if (validCoverages.length === 0) {
    return {
      total: {
        lines: { total: 0, covered: 0, skipped: 0, pct: 0 },
        statements: { total: 0, covered: 0, skipped: 0, pct: 0 },
        functions: { total: 0, covered: 0, skipped: 0, pct: 0 },
        branches: { total: 0, covered: 0, skipped: 0, pct: 0 },
      },
    };
  }

  const totalWeight = validCoverages.reduce((sum, c) => sum + c.weight, 0);
  
  const mergeMetric = (
    metrics: { data: CoverageData; weight: number }[],
    key: keyof CoverageData['total']
  ) => {
    let total = 0;
    let covered = 0;
    let skipped = 0;
    
    for (const { data, weight } of metrics) {
      if (data && data.total[key]) {
        total += data.total[key].total * (weight / totalWeight);
        covered += data.total[key].covered * (weight / totalWeight);
        skipped += data.total[key].skipped * (weight / totalWeight);
      }
    }
    
    return {
      total: Math.round(total),
      covered: Math.round(covered),
      skipped: Math.round(skipped),
      pct: total > 0 ? (covered / total) * 100 : 0,
    };
  };

  return {
    total: {
      lines: mergeMetric(validCoverages, 'lines'),
      statements: mergeMetric(validCoverages, 'statements'),
      functions: mergeMetric(validCoverages, 'functions'),
      branches: mergeMetric(validCoverages, 'branches'),
    },
  };
}

async function generateUnifiedCoverage() {
  console.log('Generating unified coverage report...\n');

  const frontendCoveragePath = path.join(rootDir, 'frontend', 'coverage', 'coverage-final.json');
  const backendCoveragePath = path.join(rootDir, 'backend', 'api', 'coverage', 'coverage-final.json');

  const frontendCoverage = await loadCoverage(frontendCoveragePath);
  const backendCoverage = await loadCoverage(backendCoveragePath);

  console.log('Frontend coverage:', frontendCoverage ? 'Found' : 'Not found');
  console.log('Backend coverage:', backendCoverage ? 'Found' : 'Not found');

  const coverages: { data: CoverageData | null; weight: number }[] = [
    { data: frontendCoverage, weight: 50 },
    { data: backendCoverage, weight: 50 },
  ];

  const unified = calculateWeightedAverage(coverages);

  const outputDir = path.join(rootDir, 'testing', 'coverage');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputPath = path.join(outputDir, 'unified-coverage.json');
  fs.writeFileSync(outputPath, JSON.stringify(unified, null, 2));

  console.log('\n=== Unified Coverage Report ===');
  console.log(`Lines: ${unified.total.lines.pct.toFixed(2)}%`);
  console.log(`Statements: ${unified.total.statements.pct.toFixed(2)}%`);
  console.log(`Functions: ${unified.total.functions.pct.toFixed(2)}%`);
  console.log(`Branches: ${unified.total.branches.pct.toFixed(2)}%`);
  console.log(`\nReport saved to: ${outputPath}`);
}

generateUnifiedCoverage().catch(console.error);
