"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  CollaborationService,
  type UserPresence,
  type EditOperation,
  getUserColor,
} from "@/lib/collaboration/service";

interface UseCollaborationProps {
  sessionId: string;
  userId: string;
  userName: string;
  enabled?: boolean;
}

export function useCollaboration({
  sessionId,
  userId,
  userName,
  enabled = true,
}: UseCollaborationProps) {
  const serviceRef = useRef<CollaborationService | null>(null);
  const [presence, setPresence] = useState<UserPresence[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Initialize service
  useEffect(() => {
    if (!enabled) return;

    const service = new CollaborationService(sessionId, userId, userName);
    serviceRef.current = service;

    service
      .connect()
      .then(() => {
        setIsConnected(true);
        
        // Subscribe to presence updates
        service.onPresenceUpdate((presence) => {
          setPresence(presence);
        });
      })
      .catch((err) => {
        console.error("[v0] Failed to connect collaboration service:", err);
        setError(err);
      });

    return () => {
      service.disconnect();
      serviceRef.current = null;
      setIsConnected(false);
    };
  }, [sessionId, userId, userName, enabled]);

  const updateCursor = useCallback(
    (position: { line: number; column: number }) => {
      serviceRef.current?.updateCursor(position);
    },
    []
  );

  const sendEditOperation = useCallback(
    (operation: Omit<EditOperation, "id" | "userId" | "timestamp">) => {
      serviceRef.current?.sendEditOperation(operation);
    },
    []
  );

  const sendComment = useCallback(
    (content: string, position?: { line: number; column: number }) => {
      serviceRef.current?.sendComment(content, position);
    },
    []
  );

  const onEdit = useCallback(
    (callback: (operation: EditOperation) => void) => {
      return serviceRef.current?.onEdit(callback) || (() => {});
    },
    []
  );

  const onPresence = useCallback(
    (callback: (presence: UserPresence[]) => void) => {
      return serviceRef.current?.onPresenceUpdate(callback) || (() => {});
    },
    []
  );

  return {
    presence,
    isConnected,
    error,
    updateCursor,
    sendEditOperation,
    sendComment,
    onEdit,
    onPresence,
  };
}

/**
 * Hook for displaying user cursors
 */
export function useUserCursors(presence: UserPresence[], currentUserId: string) {
  return presence
    .filter((p) => p.userId !== currentUserId && p.cursorPosition && p.isActive)
    .map((p) => ({
      userId: p.userId,
      userName: p.userName,
      position: p.cursorPosition!,
      color: p.color,
    }));
}

/**
 * Hook for getting active collaborators
 */
export function useActiveCollaborators(presence: UserPresence[]) {
  return presence.filter((p) => p.isActive);
}
