/**
 * AI-Powered Code Review Tool
 * 
 * Leverages Claude/GPT models to provide intelligent code analysis
 * including security checks, performance optimization, and style improvements.
 */

import { tool } from "ai";
import { z } from "zod";

export interface CodeReviewResult {
  overallScore: number;
  issueCount: number;
  issues: CodeIssue[];
  suggestions: ReviewSuggestion[];
  summary: string;
  safetyCheck: SafetyCheck;
  performanceAnalysis: PerformanceAnalysis;
}

export interface CodeIssue {
  severity: "critical" | "high" | "medium" | "low";
  category: "security" | "performance" | "style" | "best-practice" | "bug";
  line?: number;
  message: string;
  code: string;
  suggestion: string;
}

export interface ReviewSuggestion {
  type: "optimization" | "refactoring" | "documentation" | "testing";
  priority: "high" | "medium" | "low";
  description: string;
  benefit: string;
}

export interface SafetyCheck {
  hasSQLInjection: boolean;
  hasXSSVulnerability: boolean;
  hasHardcodedSecrets: boolean;
  securityScore: number;
  issues: string[];
}

export interface PerformanceAnalysis {
  hasNPlusOneQueries: boolean;
  hasMissingIndexes: boolean;
  hasMemoryLeaks: boolean;
  hasDuplicateCode: boolean;
  performanceScore: number;
  suggestions: string[];
}

export const codeReviewTool = tool({
  description:
    "Review code for quality, security, performance, and best practices using AI analysis",
  inputSchema: z.object({
    code: z
      .string()
      .describe("The code to review"),
    language: z
      .enum(["javascript", "typescript", "python", "sql", "html", "css", "json"])
      .describe("Programming language of the code"),
    context: z
      .object({
        fileName: z.string().optional(),
        projectType: z.string().optional(),
        framework: z.string().optional(),
      })
      .optional()
      .describe("Additional context about the code"),
    reviewType: z
      .enum(["full", "security", "performance", "style"])
      .default("full")
      .describe("Type of review to perform"),
  }),
  execute: async ({
    code,
    language,
    context,
    reviewType,
  }): Promise<CodeReviewResult> => {
    // This would be called with the AI model
    // For now, returning mock implementation
    return performCodeReview(code, language, reviewType, context);
  },
});

/**
 * Perform code review using AI analysis
 */
async function performCodeReview(
  code: string,
  language: string,
  reviewType: string,
  context?: {
    fileName?: string;
    projectType?: string;
    framework?: string;
  }
): Promise<CodeReviewResult> {
  const issues: CodeIssue[] = [];
  const suggestions: ReviewSuggestion[] = [];

  // Security analysis
  if (reviewType === "full" || reviewType === "security") {
    const securityAnalysis = analyzeSecurityIssues(code, language);
    issues.push(...securityAnalysis.issues);
    suggestions.push(...securityAnalysis.suggestions);
  }

  // Performance analysis
  if (reviewType === "full" || reviewType === "performance") {
    const perfAnalysis = analyzePerformance(code, language);
    issues.push(...perfAnalysis.issues);
    suggestions.push(...perfAnalysis.suggestions);
  }

  // Style and best practices
  if (reviewType === "full" || reviewType === "style") {
    const styleAnalysis = analyzeStyle(code, language);
    issues.push(...styleAnalysis.issues);
    suggestions.push(...styleAnalysis.suggestions);
  }

  // Calculate overall score
  const criticalCount = issues.filter((i) => i.severity === "critical").length;
  const highCount = issues.filter((i) => i.severity === "high").length;
  const mediumCount = issues.filter((i) => i.severity === "medium").length;
  const overallScore = Math.max(
    0,
    100 - criticalCount * 20 - highCount * 10 - mediumCount * 5
  );

  const safetyCheck = analyzeSafety(code);
  const performanceAnalysis = analyzePerformanceMetrics(code, language);

  return {
    overallScore,
    issueCount: issues.length,
    issues,
    suggestions,
    summary: generateSummary(issues, overallScore),
    safetyCheck,
    performanceAnalysis,
  };
}

/**
 * Analyze security issues in code
 */
function analyzeSecurityIssues(
  code: string,
  language: string
): { issues: CodeIssue[]; suggestions: ReviewSuggestion[] } {
  const issues: CodeIssue[] = [];
  const suggestions: ReviewSuggestion[] = [];

  // SQL Injection detection
  if (language === "sql" || code.includes("SELECT") || code.includes("INSERT")) {
    if (code.includes("'") && code.includes("+") && code.includes("var")) {
      issues.push({
        severity: "critical",
        category: "security",
        message: "Potential SQL injection vulnerability detected",
        code: "String concatenation in SQL query",
        suggestion: "Use parameterized queries or prepared statements",
      });
    }
  }

  // Hardcoded secrets detection
  if (
    code.includes("password") ||
    code.includes("api_key") ||
    code.includes("secret")
  ) {
    if (code.match(/['\"].*['\"]/) && code.match(/password|secret|key/i)) {
      issues.push({
        severity: "critical",
        category: "security",
        message: "Potential hardcoded secret detected",
        code: "Hardcoded credentials in code",
        suggestion:
          "Move secrets to environment variables or secure secret management",
      });
    }
  }

  // XSS vulnerability detection
  if (
    language === "javascript" ||
    language === "typescript" ||
    code.includes("innerHTML")
  ) {
    if (code.includes("innerHTML") && !code.includes("DOMPurify")) {
      issues.push({
        severity: "high",
        category: "security",
        message: "Potential XSS vulnerability with innerHTML",
        code: "Using innerHTML with unsanitized data",
        suggestion:
          "Use textContent instead or sanitize input with DOMPurify",
      });
    }
  }

  suggestions.push({
    type: "documentation",
    priority: "high",
    description: "Add security comments for sensitive operations",
    benefit: "Helps other developers understand security considerations",
  });

  return { issues, suggestions };
}

/**
 * Analyze performance issues
 */
function analyzePerformance(
  code: string,
  language: string
): { issues: CodeIssue[]; suggestions: ReviewSuggestion[] } {
  const issues: CodeIssue[] = [];
  const suggestions: ReviewSuggestion[] = [];

  // N+1 query pattern
  if (code.includes("for") && code.includes("query")) {
    issues.push({
      severity: "high",
      category: "performance",
      message: "Potential N+1 query pattern detected",
      code: "Loop with database queries",
      suggestion: "Use JOINs or batch queries instead of looping",
    });
  }

  // Missing indexes
  if (code.includes("WHERE") && code.includes("SELECT")) {
    suggestions.push({
      type: "optimization",
      priority: "medium",
      description: "Consider adding database indexes",
      benefit: "Significantly improves query performance",
    });
  }

  // Inefficient loops
  if (code.match(/for.*\.length/g)) {
    suggestions.push({
      type: "optimization",
      priority: "low",
      description: "Cache array length outside loop",
      benefit: "Minor performance improvement in loops",
    });
  }

  return { issues, suggestions };
}

/**
 * Analyze code style and best practices
 */
function analyzeStyle(
  code: string,
  language: string
): { issues: CodeIssue[]; suggestions: ReviewSuggestion[] } {
  const issues: CodeIssue[] = [];
  const suggestions: ReviewSuggestion[] = [];

  // Naming conventions
  if (code.match(/var [a-z]{1,2}\s*=/)) {
    issues.push({
      severity: "low",
      category: "style",
      message: "Variable name too short or unclear",
      code: "Single letter variable names",
      suggestion: "Use descriptive variable names (e.g., userId instead of u)",
    });
  }

  // Missing documentation
  const functionCount = (code.match(/function|const.*=/g) || []).length;
  const commentCount = (code.match(/\/\/|\/\*|\*\//g) || []).length;

  if (functionCount > 5 && commentCount === 0) {
    suggestions.push({
      type: "documentation",
      priority: "medium",
      description: "Add JSDoc comments to functions",
      benefit: "Improves code maintainability and IDE support",
    });
  }

  // Unused variables
  suggestions.push({
    type: "refactoring",
    priority: "low",
    description: "Consider removing any unused variables",
    benefit: "Keeps codebase clean and easier to maintain",
  });

  return { issues, suggestions };
}

/**
 * Analyze safety metrics
 */
function analyzeSafety(code: string): SafetyCheck {
  const issues: string[] = [];
  let securityScore = 100;

  if (code.includes("eval(")) {
    issues.push("Use of eval() detected - major security risk");
    securityScore -= 30;
  }

  if (code.match(/password|secret|token/i) && code.includes('"')) {
    issues.push("Potential hardcoded secrets detected");
    securityScore -= 25;
  }

  if (code.includes("innerHTML")) {
    issues.push("innerHTML usage without sanitization");
    securityScore -= 20;
  }

  return {
    hasSQLInjection: code.includes("'") && code.includes("+") && code.includes("SELECT"),
    hasXSSVulnerability: code.includes("innerHTML") && !code.includes("DOMPurify"),
    hasHardcodedSecrets:
      code.match(/password|api_key|secret/i) !== null &&
      code.includes('"'),
    securityScore: Math.max(0, securityScore),
    issues,
  };
}

/**
 * Analyze performance metrics
 */
function analyzePerformanceMetrics(
  code: string,
  language: string
): PerformanceAnalysis {
  const suggestions: string[] = [];
  let performanceScore = 100;

  const hasNPlusOne =
    code.includes("for") && code.includes("query");
  if (hasNPlusOne) {
    suggestions.push("Use batch queries instead of loops");
    performanceScore -= 25;
  }

  const hasMissingIndexes =
    code.includes("WHERE") && code.length > 1000;
  if (hasMissingIndexes) {
    suggestions.push("Consider adding database indexes");
    performanceScore -= 15;
  }

  const hasMemoryLeaks =
    code.includes("setInterval") && !code.includes("clearInterval");
  if (hasMemoryLeaks) {
    suggestions.push("Add cleanup for intervals to prevent memory leaks");
    performanceScore -= 20;
  }

  return {
    hasNPlusOneQueries: hasNPlusOne,
    hasMissingIndexes,
    hasMemoryLeaks,
    hasDuplicateCode: false,
    performanceScore: Math.max(0, performanceScore),
    suggestions,
  };
}

/**
 * Generate summary of code review
 */
function generateSummary(issues: CodeIssue[], score: number): string {
  const criticalCount = issues.filter((i) => i.severity === "critical").length;
  const highCount = issues.filter((i) => i.severity === "high").length;

  if (criticalCount > 0) {
    return `Code review found ${criticalCount} critical issue(s) that must be addressed. Score: ${score}/100`;
  }

  if (highCount > 0) {
    return `Code review found ${highCount} high-priority issue(s) to fix. Score: ${score}/100`;
  }

  if (score >= 80) {
    return `Code is well-written with minor improvement opportunities. Score: ${score}/100`;
  }

  return `Code has room for improvement in multiple areas. Score: ${score}/100`;
}

/**
 * Format review result as a readable report
 */
export function formatCodeReviewReport(result: CodeReviewResult): string {
  let report = `CODE REVIEW REPORT\n`;
  report += `${"=".repeat(50)}\n\n`;
  report += `Overall Score: ${result.overallScore}/100\n`;
  report += `Total Issues: ${result.issueCount}\n\n`;

  report += `SUMMARY\n`;
  report += `${"-".repeat(50)}\n`;
  report += `${result.summary}\n\n`;

  if (result.issues.length > 0) {
    report += `ISSUES BY SEVERITY\n`;
    report += `${"-".repeat(50)}\n`;

    ["critical", "high", "medium", "low"].forEach((severity) => {
      const severityIssues = result.issues.filter((i) => i.severity === severity);
      if (severityIssues.length > 0) {
        report += `\n${severity.toUpperCase()} (${severityIssues.length}):\n`;
        severityIssues.forEach((issue) => {
          report += `  • ${issue.message}\n`;
          report += `    Suggestion: ${issue.suggestion}\n`;
        });
      }
    });
  }

  if (result.suggestions.length > 0) {
    report += `\nSUGGESTIONS\n`;
    report += `${"-".repeat(50)}\n`;
    result.suggestions.slice(0, 5).forEach((suggestion) => {
      report += `  • ${suggestion.description}\n`;
      report += `    Benefit: ${suggestion.benefit}\n`;
    });
  }

  report += `\nSAFETY ANALYSIS\n`;
  report += `${"-".repeat(50)}\n`;
  report += `Security Score: ${result.safetyCheck.securityScore}/100\n`;
  report += `SQL Injection Risk: ${result.safetyCheck.hasSQLInjection ? "YES" : "NO"}\n`;
  report += `XSS Vulnerability: ${result.safetyCheck.hasXSSVulnerability ? "YES" : "NO"}\n`;
  report += `Hardcoded Secrets: ${result.safetyCheck.hasHardcodedSecrets ? "YES" : "NO"}\n`;

  return report;
}
