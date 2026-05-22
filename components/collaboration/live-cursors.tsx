"use client";

import { useEffect, useState } from "react";
import { useUserCursors, useActiveCollaborators } from "@/hooks/use-collaboration";
import type { UserPresence } from "@/lib/collaboration/service";

interface LiveCursorsProps {
  presence: UserPresence[];
  currentUserId: string;
}

export function LiveCursors({ presence, currentUserId }: LiveCursorsProps) {
  const userCursors = useUserCursors(presence, currentUserId);

  if (userCursors.length === 0) {
    return null;
  }

  return (
    <div className="pointer-events-none">
      {userCursors.map((cursor) => (
        <Cursor
          key={cursor.userId}
          userName={cursor.userName}
          color={cursor.color}
          position={cursor.position}
        />
      ))}
    </div>
  );
}

interface CursorProps {
  userName: string;
  color: string;
  position: { line: number; column: number };
}

function Cursor({ userName, color, position }: CursorProps) {
  // This component would position cursors based on editor layout
  // For now, it's a placeholder implementation
  
  return (
    <div
      className="fixed flex items-center gap-1"
      style={{
        // Position would be calculated based on editor coordinates
        // This is simplified for demonstration
        left: `${position.column * 8}px`,
        top: `${position.line * 20}px`,
      }}
    >
      <div
        className="h-5 w-0.5"
        style={{
          backgroundColor: color,
          opacity: 0.8,
        }}
      />
      <div
        className="rounded px-2 py-1 text-xs font-medium text-white"
        style={{
          backgroundColor: color,
        }}
      >
        {userName}
      </div>
    </div>
  );
}

/**
 * Presence indicator showing active collaborators
 */
interface PresenceIndicatorProps {
  presence: UserPresence[];
  currentUserId: string;
}

export function PresenceIndicator({
  presence,
  currentUserId,
}: PresenceIndicatorProps) {
  const activeCollaborators = useActiveCollaborators(presence).filter(
    (p) => p.userId !== currentUserId
  );

  if (activeCollaborators.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-medium text-muted-foreground">
        Collaborating with:
      </span>
      <div className="flex gap-1">
        {activeCollaborators.map((collaborator) => (
          <div
            key={collaborator.userId}
            className="flex items-center gap-1 rounded-full px-2 py-1 text-xs"
            style={{
              backgroundColor: collaborator.color,
              opacity: 0.1,
              border: `1px solid ${collaborator.color}`,
            }}
          >
            <div
              className="h-2 w-2 rounded-full"
              style={{
                backgroundColor: collaborator.color,
              }}
            />
            {collaborator.userName}
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Collaboration status badge
 */
interface CollaborationStatusProps {
  isConnected: boolean;
  presence: UserPresence[];
  currentUserId: string;
}

export function CollaborationStatus({
  isConnected,
  presence,
  currentUserId,
}: CollaborationStatusProps) {
  const activeCount = presence.filter(
    (p) => p.userId !== currentUserId && p.isActive
  ).length;

  return (
    <div className="flex items-center gap-2 text-xs">
      <div
        className={`h-2 w-2 rounded-full ${
          isConnected ? "bg-green-500" : "bg-red-500"
        }`}
      />
      <span>
        {isConnected ? "Connected" : "Disconnected"}
        {activeCount > 0 && ` • ${activeCount} other user${activeCount !== 1 ? "s" : ""}`}
      </span>
    </div>
  );
}
