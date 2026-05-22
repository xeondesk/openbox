/**
 * Skills Marketplace Service
 * 
 * Manages community-created skills for agent workflows, including
 * discovery, installation, rating, and version management.
 */

import { z } from "zod";

export type SkillCategory =
  | "automation"
  | "analysis"
  | "integration"
  | "content"
  | "development"
  | "other";

export type SkillStatus = "draft" | "published" | "deprecated" | "archived";

export interface SkillMetadata {
  id: string;
  name: string;
  slug: string;
  author: {
    id: string;
    name: string;
    avatar?: string;
  };
  description: string;
  version: string;
  status: SkillStatus;
  category: SkillCategory;
  tags: string[];
  icon?: string;
  documentation?: string;
  sourceUrl?: string;
  license?: string;
  stats: {
    downloads: number;
    rating: number;
    reviews: number;
    installations: number;
  };
  createdAt: Date;
  updatedAt: Date;
  publishedAt?: Date;
}

export interface SkillConfig {
  id: string;
  name: string;
  description: string;
  parameters: Record<string, ParameterSchema>;
  returns: {
    type: string;
    description: string;
  };
}

export interface ParameterSchema {
  type: "string" | "number" | "boolean" | "object" | "array";
  description: string;
  required: boolean;
  default?: unknown;
  enum?: unknown[];
}

export interface InstalledSkill {
  id: string;
  skillId: string;
  sessionId: string;
  version: string;
  installedAt: Date;
  updatedAt: Date;
  enabled: boolean;
  config: Record<string, unknown>;
}

export interface SkillReview {
  id: string;
  skillId: string;
  authorId: string;
  rating: number; // 1-5
  comment: string;
  helpful: number;
  createdAt: Date;
}

/**
 * Skills Marketplace Manager
 */
export class SkillsMarketplace {
  private skills: Map<string, SkillMetadata> = new Map();
  private installedSkills: Map<string, InstalledSkill> = new Map();
  private reviews: Map<string, SkillReview[]> = new Map();
  private versions: Map<string, Map<string, SkillConfig>> = new Map(); // skillId -> version -> config

  /**
   * Publish a new skill to the marketplace
   */
  async publishSkill(
    skillId: string,
    metadata: Partial<SkillMetadata>,
    config: SkillConfig
  ): Promise<SkillMetadata> {
    const skill: SkillMetadata = {
      id: skillId,
      name: metadata.name || "Untitled Skill",
      slug: this.generateSlug(metadata.name || "untitled"),
      author: metadata.author || { id: "unknown", name: "Unknown" },
      description: metadata.description || "",
      version: metadata.version || "1.0.0",
      status: "published",
      category: metadata.category || "other",
      tags: metadata.tags || [],
      icon: metadata.icon,
      documentation: metadata.documentation,
      sourceUrl: metadata.sourceUrl,
      license: metadata.license,
      stats: {
        downloads: 0,
        rating: 0,
        reviews: 0,
        installations: 0,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
      publishedAt: new Date(),
    };

    this.skills.set(skillId, skill);
    this.reviews.set(skillId, []);

    // Store config
    if (!this.versions.has(skillId)) {
      this.versions.set(skillId, new Map());
    }
    this.versions.get(skillId)!.set(skill.version, config);

    return skill;
  }

  /**
   * Search skills in marketplace
   */
  searchSkills(query: {
    q?: string;
    category?: SkillCategory;
    tags?: string[];
    sortBy?: "downloads" | "rating" | "recent";
    limit?: number;
  }): SkillMetadata[] {
    let results = Array.from(this.skills.values()).filter(
      (s) => s.status === "published"
    );

    // Filter by search query
    if (query.q) {
      const q = query.q.toLowerCase();
      results = results.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.description.toLowerCase().includes(q) ||
          s.tags.some((t) => t.toLowerCase().includes(q))
      );
    }

    // Filter by category
    if (query.category) {
      results = results.filter((s) => s.category === query.category);
    }

    // Filter by tags
    if (query.tags && query.tags.length > 0) {
      results = results.filter((s) =>
        query.tags!.some((t) => s.tags.includes(t))
      );
    }

    // Sort results
    if (query.sortBy === "downloads") {
      results.sort((a, b) => b.stats.downloads - a.stats.downloads);
    } else if (query.sortBy === "rating") {
      results.sort((a, b) => b.stats.rating - a.stats.rating);
    } else if (query.sortBy === "recent") {
      results.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
    }

    return results.slice(0, query.limit || 20);
  }

  /**
   * Get skill details
   */
  getSkill(skillId: string): SkillMetadata | null {
    return this.skills.get(skillId) || null;
  }

  /**
   * Get skill configuration
   */
  getSkillConfig(skillId: string, version?: string): SkillConfig | null {
    const skill = this.skills.get(skillId);
    if (!skill) return null;

    const versionMap = this.versions.get(skillId);
    if (!versionMap) return null;

    const configVersion = version || skill.version;
    return versionMap.get(configVersion) || null;
  }

  /**
   * Install a skill to a session
   */
  async installSkill(
    skillId: string,
    sessionId: string,
    config?: Record<string, unknown>
  ): Promise<InstalledSkill> {
    const skill = this.skills.get(skillId);
    if (!skill) {
      throw new Error(`Skill not found: ${skillId}`);
    }

    const installedSkill: InstalledSkill = {
      id: `install_${Date.now()}`,
      skillId,
      sessionId,
      version: skill.version,
      installedAt: new Date(),
      updatedAt: new Date(),
      enabled: true,
      config: config || {},
    };

    this.installedSkills.set(installedSkill.id, installedSkill);

    // Update stats
    skill.stats.downloads++;
    skill.stats.installations++;
    skill.updatedAt = new Date();

    return installedSkill;
  }

  /**
   * Uninstall a skill
   */
  async uninstallSkill(installId: string): Promise<void> {
    const installed = this.installedSkills.get(installId);
    if (!installed) {
      throw new Error(`Installed skill not found: ${installId}`);
    }

    this.installedSkills.delete(installId);

    const skill = this.skills.get(installed.skillId);
    if (skill) {
      skill.stats.installations = Math.max(0, skill.stats.installations - 1);
    }
  }

  /**
   * Get installed skills for a session
   */
  getInstalledSkills(sessionId: string): InstalledSkill[] {
    return Array.from(this.installedSkills.values()).filter(
      (s) => s.sessionId === sessionId
    );
  }

  /**
   * Update installed skill configuration
   */
  async updateSkillConfig(
    installId: string,
    config: Record<string, unknown>
  ): Promise<InstalledSkill> {
    const installed = this.installedSkills.get(installId);
    if (!installed) {
      throw new Error(`Installed skill not found: ${installId}`);
    }

    installed.config = config;
    installed.updatedAt = new Date();

    return installed;
  }

  /**
   * Add a review to a skill
   */
  async reviewSkill(
    skillId: string,
    review: {
      authorId: string;
      rating: number;
      comment: string;
    }
  ): Promise<SkillReview> {
    if (review.rating < 1 || review.rating > 5) {
      throw new Error("Rating must be between 1 and 5");
    }

    const skillReview: SkillReview = {
      id: `review_${Date.now()}`,
      skillId,
      authorId: review.authorId,
      rating: review.rating,
      comment: review.comment,
      helpful: 0,
      createdAt: new Date(),
    };

    const reviews = this.reviews.get(skillId) || [];
    reviews.push(skillReview);
    this.reviews.set(skillId, reviews);

    // Update skill stats
    const skill = this.skills.get(skillId);
    if (skill) {
      const allReviews = this.reviews.get(skillId) || [];
      skill.stats.reviews = allReviews.length;
      skill.stats.rating =
        allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
      skill.updatedAt = new Date();
    }

    return skillReview;
  }

  /**
   * Get reviews for a skill
   */
  getSkillReviews(skillId: string, limit: number = 10): SkillReview[] {
    const reviews = this.reviews.get(skillId) || [];
    return reviews.sort((a, b) => b.helpful - a.helpful).slice(0, limit);
  }

  /**
   * Get featured skills
   */
  getFeaturedSkills(limit: number = 6): SkillMetadata[] {
    const published = Array.from(this.skills.values()).filter(
      (s) => s.status === "published"
    );

    return published
      .sort((a, b) => b.stats.rating - a.stats.rating)
      .slice(0, limit);
  }

  /**
   * Get trending skills
   */
  getTrendingSkills(limit: number = 6): SkillMetadata[] {
    const published = Array.from(this.skills.values()).filter(
      (s) => s.status === "published"
    );

    return published
      .sort((a, b) => b.stats.downloads - a.stats.downloads)
      .slice(0, limit);
  }

  /**
   * Get skills by category
   */
  getSkillsByCategory(category: SkillCategory, limit: number = 12): SkillMetadata[] {
    return Array.from(this.skills.values())
      .filter((s) => s.category === category && s.status === "published")
      .sort((a, b) => b.stats.rating - a.stats.rating)
      .slice(0, limit);
  }

  /**
   * Generate URL-friendly slug
   */
  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
  }

  /**
   * Get all skills
   */
  getAllSkills(): SkillMetadata[] {
    return Array.from(this.skills.values());
  }

  /**
   * Update skill metadata
   */
  async updateSkill(
    skillId: string,
    updates: Partial<SkillMetadata>
  ): Promise<SkillMetadata> {
    const skill = this.skills.get(skillId);
    if (!skill) {
      throw new Error(`Skill not found: ${skillId}`);
    }

    Object.assign(skill, updates);
    skill.updatedAt = new Date();

    return skill;
  }

  /**
   * Deprecate a skill
   */
  async deprecateSkill(skillId: string, message: string): Promise<void> {
    const skill = this.skills.get(skillId);
    if (!skill) {
      throw new Error(`Skill not found: ${skillId}`);
    }

    skill.status = "deprecated";
    skill.documentation = `${skill.documentation || ""}\n\nDEPRECATED: ${message}`;
    skill.updatedAt = new Date();
  }
}

// Export singleton instance
export const skillsMarketplace = new SkillsMarketplace();

/**
 * Predefined category colors
 */
export const categoryColors: Record<SkillCategory, string> = {
  automation: "bg-blue-100 text-blue-800",
  analysis: "bg-purple-100 text-purple-800",
  integration: "bg-green-100 text-green-800",
  content: "bg-orange-100 text-orange-800",
  development: "bg-pink-100 text-pink-800",
  other: "bg-gray-100 text-gray-800",
};

/**
 * Category descriptions
 */
export const categoryDescriptions: Record<SkillCategory, string> = {
  automation: "Automate repetitive tasks and workflows",
  analysis: "Analyze data and generate insights",
  integration: "Connect with external services and APIs",
  content: "Create and manage content",
  development: "Development and coding utilities",
  other: "Other useful skills",
};
