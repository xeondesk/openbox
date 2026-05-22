"use client";

import type { CodeReviewResult } from "@open-agents/agent/tools/code-review";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertCircle,
  CheckCircle,
  AlertTriangle,
  Code2,
  Zap,
  Shield,
  TrendingUp,
} from "lucide-react";
import { useState } from "react";

interface CodeReviewPanelProps {
  result: CodeReviewResult;
  code?: string;
  onDismiss?: () => void;
}

export function CodeReviewPanel({
  result,
  code,
  onDismiss,
}: CodeReviewPanelProps) {
  const [expandedIssue, setExpandedIssue] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<"issues" | "safety" | "performance">(
    "issues"
  );

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-red-100 text-red-800";
      case "high":
        return "bg-orange-100 text-orange-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "low":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "critical":
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      case "high":
        return <AlertTriangle className="h-5 w-5 text-orange-600" />;
      default:
        return <Code2 className="h-5 w-5 text-blue-600" />;
    }
  };

  return (
    <Card className="w-full border-l-4 border-l-blue-500">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <Code2 className="h-5 w-5 text-blue-600" />
              <CardTitle>Code Review Analysis</CardTitle>
            </div>
            <p className="text-sm text-muted-foreground">
              {result.summary}
            </p>
          </div>
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="text-muted-foreground hover:text-foreground"
            >
              ×
            </button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Score Overview */}
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg bg-muted p-3 text-center">
            <div className={`text-3xl font-bold ${getScoreColor(result.overallScore)}`}>
              {result.overallScore}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Overall Score</p>
          </div>

          <div className="rounded-lg bg-muted p-3 text-center">
            <div className="text-3xl font-bold text-blue-600">
              {result.safetyCheck.securityScore}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Security</p>
          </div>

          <div className="rounded-lg bg-muted p-3 text-center">
            <div className="text-3xl font-bold text-green-600">
              {result.performanceAnalysis.performanceScore}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Performance</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b">
          {["issues", "safety", "performance"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as "issues" | "safety" | "performance")}
              className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
              {tab === "issues" && ` (${result.issueCount})`}
            </button>
          ))}
        </div>

        {/* Issues Tab */}
        {activeTab === "issues" && (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {result.issues.length === 0 ? (
              <div className="flex items-center gap-2 text-green-600 p-3 bg-green-50 rounded">
                <CheckCircle className="h-5 w-5" />
                <span>No issues found!</span>
              </div>
            ) : (
              result.issues.map((issue, idx) => (
                <div
                  key={idx}
                  className="rounded-lg border p-3 hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() =>
                    setExpandedIssue(expandedIssue === idx ? null : idx)
                  }
                >
                  <div className="flex items-start gap-3">
                    {getSeverityIcon(issue.severity)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm truncate">
                          {issue.message}
                        </span>
                        <Badge className={`${getSeverityColor(issue.severity)} text-xs`}>
                          {issue.severity}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground mb-2">
                        Category: {issue.category}
                      </div>

                      {expandedIssue === idx && (
                        <div className="mt-3 pt-3 border-t space-y-2 text-sm">
                          <div>
                            <p className="font-medium text-xs text-muted-foreground">Code:</p>
                            <code className="bg-muted p-2 rounded block text-xs overflow-x-auto">
                              {issue.code}
                            </code>
                          </div>
                          <div>
                            <p className="font-medium text-xs text-muted-foreground">Fix:</p>
                            <p className="text-xs">{issue.suggestion}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Safety Tab */}
        {activeTab === "safety" && (
          <div className="space-y-3">
            <div className="rounded-lg bg-muted p-3">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="h-5 w-5 text-blue-600" />
                <span className="font-medium">Security Score: {result.safetyCheck.securityScore}/100</span>
              </div>
              <div className="grid gap-2 text-sm">
                <div className="flex items-center justify-between">
                  <span>SQL Injection Risk:</span>
                  <Badge
                    variant={result.safetyCheck.hasSQLInjection ? "destructive" : "outline"}
                  >
                    {result.safetyCheck.hasSQLInjection ? "YES" : "NO"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>XSS Vulnerability:</span>
                  <Badge
                    variant={result.safetyCheck.hasXSSVulnerability ? "destructive" : "outline"}
                  >
                    {result.safetyCheck.hasXSSVulnerability ? "YES" : "NO"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Hardcoded Secrets:</span>
                  <Badge
                    variant={result.safetyCheck.hasHardcodedSecrets ? "destructive" : "outline"}
                  >
                    {result.safetyCheck.hasHardcodedSecrets ? "YES" : "NO"}
                  </Badge>
                </div>
              </div>
            </div>

            {result.safetyCheck.issues.length > 0 && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                <p className="font-medium text-sm text-red-800 mb-2">Security Issues:</p>
                <ul className="space-y-1">
                  {result.safetyCheck.issues.map((issue, idx) => (
                    <li key={idx} className="text-xs text-red-700">
                      • {issue}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Performance Tab */}
        {activeTab === "performance" && (
          <div className="space-y-3">
            <div className="rounded-lg bg-muted p-3">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="h-5 w-5 text-amber-600" />
                <span className="font-medium">Performance Score: {result.performanceAnalysis.performanceScore}/100</span>
              </div>
              <div className="grid gap-2 text-sm">
                <div className="flex items-center justify-between">
                  <span>N+1 Query Pattern:</span>
                  <Badge variant={result.performanceAnalysis.hasNPlusOneQueries ? "destructive" : "outline"}>
                    {result.performanceAnalysis.hasNPlusOneQueries ? "FOUND" : "OK"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Missing Indexes:</span>
                  <Badge variant={result.performanceAnalysis.hasMissingIndexes ? "destructive" : "outline"}>
                    {result.performanceAnalysis.hasMissingIndexes ? "FOUND" : "OK"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Memory Leaks:</span>
                  <Badge variant={result.performanceAnalysis.hasMemoryLeaks ? "destructive" : "outline"}>
                    {result.performanceAnalysis.hasMemoryLeaks ? "FOUND" : "OK"}
                  </Badge>
                </div>
              </div>
            </div>

            {result.performanceAnalysis.suggestions.length > 0 && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                <p className="font-medium text-sm text-amber-800 mb-2">Suggestions:</p>
                <ul className="space-y-1">
                  {result.performanceAnalysis.suggestions.map((suggestion, idx) => (
                    <li key={idx} className="text-xs text-amber-700">
                      • {suggestion}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Suggestions */}
        {result.suggestions.length > 0 && (
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 mt-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-blue-600" />
              <p className="font-medium text-sm text-blue-800">Improvement Suggestions</p>
            </div>
            <ul className="space-y-1">
              {result.suggestions.slice(0, 3).map((suggestion, idx) => (
                <li key={idx} className="text-xs text-blue-700">
                  • <span className="font-medium">{suggestion.type}:</span> {suggestion.description}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
