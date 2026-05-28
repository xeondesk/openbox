/**
 * Real-time collaboration service for multi-user editing and presence
 * 
 * Handles presence tracking, cursor synchronization, and collaborative editing
 * for sessions with multiple users.
 */

import { io, type Socket } from "socket.io-client";

export interface UserPresence {
  userId: string;
  userName: string;
  cursorPosition?: { line: number; column: number };
  color: string;
  lastSeen: Date;
  isActive: boolean;
}

export interface CollaborationEvent {
  type: "cursor" | "selection" | "edit" | "file-change" | "comment";
  userId: string;
  timestamp: Date;
  data: Record<string, unknown>;
}

export interface EditOperation {
  id: string;
  type: "insert" | "delete";
  userId: string;
  position: { line: number; column: number };
  content: string;
  timestamp: Date;
}

const PRESENCE_UPDATE_INTERVAL = 5000; // 5 seconds
const PRESENCE_TIMEOUT = 30000; // 30 seconds

export class CollaborationService {
  private socket: Socket | null = null;
  private sessionId: string;
  private userId: string;
  private userName: string;
  private presenceMap = new Map<string, UserPresence>();
  private operationHistory: EditOperation[] = [];
  private onPresenceChange: ((presence: UserPresence[]) => void) | null = null;
  private onEditOperation: ((operation: EditOperation) => void) | null = null;
  private presenceInterval: ReturnType<typeof setInterval> | null = null;

  constructor(sessionId: string, userId: string, userName: string) {
    this.sessionId = sessionId;
    this.userId = userId;
    this.userName = userName;
  }

  /**
   * Connect to collaboration server
   */
  async connect(serverUrl: string = ""): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.socket = io(serverUrl || window.location.origin, {
          path: "/api/collaboration",
          reconnection: true,
          reconnectionDelay: 1000,
          reconnectionDelayMax: 5000,
          reconnectionAttempts: 5,
        });

        this.socket.on("connect", () => {
          console.log("[v0] Collaboration socket connected");
          
          // Join session
          this.socket!.emit("join-session", {
            sessionId: this.sessionId,
            userId: this.userId,
            userName: this.userName,
          });
          
          // Start presence updates
          this.startPresenceUpdates();
          resolve();
        });

        this.socket.on("disconnect", () => {
          console.log("[v0] Collaboration socket disconnected");
          this.stopPresenceUpdates();
        });

        this.socket.on("presence-update", (presence: UserPresence[]) => {
          this.updatePresenceMap(presence);
          this.onPresenceChange?.(this.getActivePresence());
        });

        this.socket.on("edit-operation", (operation: EditOperation) => {
          this.operationHistory.push(operation);
          this.onEditOperation?.(operation);
        });

        this.socket.on("error", (error) => {
          console.error("[v0] Collaboration socket error:", error);
          reject(error);
        });

        // Connection timeout
        const timeout = setTimeout(
          () => reject(new Error("Collaboration connection timeout")),
          10000
        );

        const originalOn = this.socket.on.bind(this.socket);
        this.socket.on = function (event, ...args) {
          if (event === "connect") {
            clearTimeout(timeout);
          }
          return originalOn(event, ...args);
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Disconnect from collaboration server
   */
  disconnect(): void {
    this.stopPresenceUpdates();
    this.socket?.disconnect();
    this.socket = null;
  }

  /**
   * Update user cursor position
   */
  updateCursor(position: { line: number; column: number }): void {
    if (!this.socket) return;

    this.socket.emit("cursor-update", {
      userId: this.userId,
      position,
      timestamp: new Date(),
    });
  }

  /**
   * Send an edit operation
   */
  sendEditOperation(operation: Omit<EditOperation, "id" | "userId" | "timestamp">): void {
    if (!this.socket) return;

    const op: EditOperation = {
      ...operation,
      id: `${this.userId}-${Date.now()}`,
      userId: this.userId,
      timestamp: new Date(),
    };

    this.operationHistory.push(op);
    this.socket.emit("edit-operation", op);
  }

  /**
   * Send a comment or annotation
   */
  sendComment(
    content: string,
    position?: { line: number; column: number }
  ): void {
    if (!this.socket) return;

    this.socket.emit("comment", {
      userId: this.userId,
      userName: this.userName,
      content,
      position,
      timestamp: new Date(),
    });
  }

  /**
   * Get all active presence data
   */
  getActivePresence(): UserPresence[] {
    const now = new Date();
    const active: UserPresence[] = [];

    this.presenceMap.forEach((presence) => {
      if (
        now.getTime() - presence.lastSeen.getTime() < PRESENCE_TIMEOUT &&
        presence.isActive
      ) {
        active.push(presence);
      }
    });

    return active;
  }

  /**
   * Subscribe to presence changes
   */
  onPresenceUpdate(callback: (presence: UserPresence[]) => void): () => void {
    this.onPresenceChange = callback;
    return () => {
      this.onPresenceChange = null;
    };
  }

  /**
   * Subscribe to edit operations
   */
  onEdit(callback: (operation: EditOperation) => void): () => void {
    this.onEditOperation = callback;
    return () => {
      this.onEditOperation = null;
    };
  }

  /**
   * Get operation history
   */
  getOperationHistory(limit: number = 100): EditOperation[] {
    return this.operationHistory.slice(-limit);
  }

  /**
   * Start sending presence updates
   */
  private startPresenceUpdates(): void {
    this.presenceInterval = setInterval(() => {
      if (this.socket) {
        this.socket.emit("presence-ping", {
          userId: this.userId,
          timestamp: new Date(),
        });
      }
    }, PRESENCE_UPDATE_INTERVAL);
  }

  /**
   * Stop sending presence updates
   */
  private stopPresenceUpdates(): void {
    if (this.presenceInterval) {
      clearInterval(this.presenceInterval);
      this.presenceInterval = null;
    }
  }

  /**
   * Update local presence map
   */
  private updatePresenceMap(presence: UserPresence[]): void {
    presence.forEach((p) => {
      this.presenceMap.set(p.userId, {
        ...p,
        lastSeen: new Date(p.lastSeen),
      });
    });
  }

  /**
   * Check if collaboration is active
   */
  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }
}

/**
 * Create a color for a user based on their ID (for cursor highlighting)
 */
export function getUserColor(userId: string): string {
  const colors = [
    "#FF6B6B", // Red
    "#4ECDC4", // Teal
    "#45B7D1", // Blue
    "#FFA07A", // Light Salmon
    "#98D8C8", // Mint
    "#F7DC6F", // Yellow
    "#BB8FCE", // Purple
    "#85C1E2", // Light Blue
  ];

  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }

  const colorIndex = Math.abs(hash) % colors.length;
  return colors[colorIndex];
}
