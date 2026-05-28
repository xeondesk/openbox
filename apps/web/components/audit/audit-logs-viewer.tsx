"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Download, Filter } from "lucide-react";
import { useState } from "react";

interface AuditLog {
  eventType: string;
  userId: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  sessionId?: string;
}

interface AuditLogsViewerProps {
  logs: AuditLog[];
}

export function AuditLogsViewer({ logs }: AuditLogsViewerProps) {
  const [selectedEventType, setSelectedEventType] = useState<string | null>(
    null,
  );
  const [selectedUser, setSelectedUser] = useState<string | null>(null);

  // Get unique event types and users
  const eventTypes = Array.from(new Set(logs.map((log) => log.eventType)));
  const users = Array.from(new Set(logs.map((log) => log.userId)));

  // Filter logs
  const filteredLogs = logs.filter((log) => {
    if (selectedEventType && log.eventType !== selectedEventType) return false;
    if (selectedUser && log.userId !== selectedUser) return false;
    return true;
  });

  const getEventBadgeColor = (eventType: string) => {
    if (eventType.includes("LOGIN") || eventType.includes("CREATED"))
      return "bg-green-100 text-green-800";
    if (eventType.includes("FAILED") || eventType.includes("ERROR"))
      return "bg-red-100 text-red-800";
    if (eventType.includes("DELETE")) return "bg-orange-100 text-orange-800";
    if (eventType.includes("CHANGE") || eventType.includes("MODIFIED"))
      return "bg-blue-100 text-blue-800";
    return "bg-gray-100 text-gray-800";
  };

  const formatEventName = (eventType: string) => {
    return eventType
      .replace(/_/g, " ")
      .split(" ")
      .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
      .join(" ");
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Audit Logs</CardTitle>
            <CardDescription>
              View all user actions and system events for compliance and
              security
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const json = JSON.stringify(logs, null, 2);
              const blob = new Blob([json], { type: "application/json" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `audit-logs-${new Date().toISOString().split("T")[0]}.json`;
              a.click();
              URL.revokeObjectURL(url);
            }}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label htmlFor="event-type" className="text-sm font-medium">
              Event Type
            </label>
            <Select
              value={selectedEventType || ""}
              onValueChange={(v) => setSelectedEventType(v || null)}
            >
              <SelectTrigger id="event-type">
                <SelectValue placeholder="All events" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All events</SelectItem>
                {eventTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {formatEventName(type)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1">
            <label htmlFor="user-id" className="text-sm font-medium">
              User ID
            </label>
            <Select
              value={selectedUser || ""}
              onValueChange={(v) => setSelectedUser(v || null)}
            >
              <SelectTrigger id="user-id">
                <SelectValue placeholder="All users" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All users</SelectItem>
                {users.map((user) => (
                  <SelectItem key={user} value={user}>
                    {user}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSelectedEventType(null);
              setSelectedUser(null);
            }}
            className="gap-2"
          >
            <Filter className="h-4 w-4" />
            Clear Filters
          </Button>
        </div>

        {/* Logs Table */}
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted">
                <TableHead>Event</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Session</TableHead>
                <TableHead>Timestamp</TableHead>
                <TableHead>IP Address</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.length > 0 ? (
                filteredLogs.map((log, idx) => (
                  <TableRow key={idx} className="hover:bg-muted/50">
                    <TableCell>
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${getEventBadgeColor(log.eventType)}`}
                      >
                        {formatEventName(log.eventType)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <code className="text-xs">
                        {log.userId.slice(0, 8)}...
                      </code>
                    </TableCell>
                    <TableCell>
                      {log.sessionId ? (
                        <code className="text-xs">
                          {log.sessionId.slice(0, 8)}...
                        </code>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">
                      {log.timestamp.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-xs">
                      {log.ipAddress || "—"}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="h-24 text-center text-muted-foreground"
                  >
                    No audit logs found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <p className="text-sm text-muted-foreground">
          Showing {filteredLogs.length} of {logs.length} total logs
        </p>
      </CardContent>
    </Card>
  );
}
