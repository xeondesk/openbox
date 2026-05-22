"use client";

import type { SkillMetadata } from "@/lib/skills/marketplace";
import {
  categoryColors,
  categoryDescriptions,
  type SkillCategory,
} from "@/lib/skills/marketplace";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Star,
  Download,
  Search,
  Filter,
  Grid,
  List,
  Eye,
  Plus,
  ExternalLink,
} from "lucide-react";
import { useState } from "react";
import Image from "next/image";

interface SkillsMarketplaceProps {
  skills: SkillMetadata[];
  installedSkills?: string[];
  onInstall?: (skillId: string) => void;
  onUninstall?: (skillId: string) => void;
  onView?: (skillId: string) => void;
  isLoading?: boolean;
}

export function SkillsMarketplace({
  skills,
  installedSkills = [],
  onInstall,
  onUninstall,
  onView,
  isLoading,
}: SkillsMarketplaceProps) {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<SkillCategory | "all">("all");
  const [sortBy, setSortBy] = useState<"rating" | "downloads" | "recent">(
    "rating"
  );

  const categories: (SkillCategory | "all")[] = [
    "all",
    "automation",
    "analysis",
    "integration",
    "content",
    "development",
    "other",
  ];

  const filteredSkills = skills.filter((skill) => {
    const matchesSearch =
      skill.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      skill.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      skill.tags.some((t) =>
        t.toLowerCase().includes(searchQuery.toLowerCase())
      );

    const matchesCategory =
      selectedCategory === "all" || skill.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const sortedSkills = [...filteredSkills].sort((a, b) => {
    if (sortBy === "rating") {
      return b.stats.rating - a.stats.rating;
    } else if (sortBy === "downloads") {
      return b.stats.downloads - a.stats.downloads;
    } else {
      return b.updatedAt.getTime() - a.updatedAt.getTime();
    }
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold mb-2">Skills Marketplace</h2>
        <p className="text-muted-foreground">
          Discover and install community-created skills for your workflows
        </p>
      </div>

      {/* Search and Filter */}
      <div className="space-y-4">
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search skills..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-input bg-background"
            />
          </div>

          <select
            value={sortBy}
            onChange={(e) =>
              setSortBy(e.target.value as "rating" | "downloads" | "recent")
            }
            className="px-3 py-2 rounded-lg border border-input bg-background text-sm"
          >
            <option value="rating">Top Rated</option>
            <option value="downloads">Most Downloaded</option>
            <option value="recent">Recent</option>
          </select>

          <div className="flex gap-1 border border-input rounded-lg p-1">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 rounded ${
                viewMode === "grid"
                  ? "bg-blue-600 text-white"
                  : "hover:bg-muted"
              }`}
            >
              <Grid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 rounded ${
                viewMode === "list"
                  ? "bg-blue-600 text-white"
                  : "hover:bg-muted"
              }`}
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                selectedCategory === cat
                  ? "bg-blue-600 text-white"
                  : "bg-muted hover:bg-muted/80"
              }`}
            >
              {cat === "all" ? "All" : cat.charAt(0).toUpperCase() + cat.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin mb-2">⟳</div>
            <p className="text-muted-foreground">Loading skills...</p>
          </div>
        </div>
      ) : sortedSkills.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Search className="h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-muted-foreground text-center">
              No skills found matching your criteria
            </p>
          </CardContent>
        </Card>
      ) : (
        <div
          className={
            viewMode === "grid"
              ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
              : "space-y-3"
          }
        >
          {sortedSkills.map((skill) => (
            <SkillCard
              key={skill.id}
              skill={skill}
              isInstalled={installedSkills.includes(skill.id)}
              onInstall={() => onInstall?.(skill.id)}
              onUninstall={() => onUninstall?.(skill.id)}
              onView={() => onView?.(skill.id)}
              compact={viewMode === "list"}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface SkillCardProps {
  skill: SkillMetadata;
  isInstalled: boolean;
  onInstall: () => void;
  onUninstall: () => void;
  onView: () => void;
  compact?: boolean;
}

function SkillCard({
  skill,
  isInstalled,
  onInstall,
  onUninstall,
  onView,
  compact,
}: SkillCardProps) {
  if (compact) {
    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            {skill.icon && (
              <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                <span className="text-lg">{skill.icon}</span>
              </div>
            )}

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-1">
                <div>
                  <h3 className="font-semibold truncate">{skill.name}</h3>
                  <p className="text-xs text-muted-foreground">
                    by {skill.author.name}
                  </p>
                </div>
                <Badge className={categoryColors[skill.category]}>
                  {skill.category}
                </Badge>
              </div>

              <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                {skill.description}
              </p>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                    {skill.stats.rating.toFixed(1)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Download className="h-3 w-3" />
                    {skill.stats.downloads.toLocaleString()}
                  </span>
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={onView}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  {isInstalled ? (
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={onUninstall}
                    >
                      Uninstall
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700"
                      onClick={onInstall}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Install
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2 mb-2">
          {skill.icon && (
            <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-lg flex-shrink-0">
              {skill.icon}
            </div>
          )}
          <Badge className={categoryColors[skill.category]}>
            {skill.category}
          </Badge>
        </div>

        <h3 className="font-semibold line-clamp-2">{skill.name}</h3>
        <p className="text-xs text-muted-foreground">by {skill.author.name}</p>
      </CardHeader>

      <CardContent className="flex-1 space-y-3">
        <p className="text-sm text-muted-foreground line-clamp-3">
          {skill.description}
        </p>

        {skill.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {skill.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
              {skill.stats.rating.toFixed(1)}
              <span className="text-muted-foreground">
                ({skill.stats.reviews})
              </span>
            </span>
            <span className="flex items-center gap-1">
              <Download className="h-3 w-3" />
              {(skill.stats.downloads / 1000).toFixed(0)}k
            </span>
          </div>
        </div>
      </CardContent>

      <div className="p-4 border-t flex gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={onView}
          className="flex-1"
        >
          <Eye className="h-4 w-4 mr-1" />
          View
        </Button>
        {isInstalled ? (
          <Button
            size="sm"
            variant="destructive"
            onClick={onUninstall}
            className="flex-1"
          >
            Uninstall
          </Button>
        ) : (
          <Button
            size="sm"
            className="flex-1 bg-blue-600 hover:bg-blue-700"
            onClick={onInstall}
          >
            <Plus className="h-4 w-4 mr-1" />
            Install
          </Button>
        )}
      </div>
    </Card>
  );
}
