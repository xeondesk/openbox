import { Metadata } from "next";
import { AuditLogsViewer } from "@/components/audit/audit-logs-viewer";
import { getAuditLogs } from "@/lib/monitoring/audit-logger";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, CheckCircle, Clock, Users } from "lucide-react";

export const metadata: Metadata = {
  title: "Audit Logs",
  description: "View and manage audit logs for compliance and security",
};

export default async function AuditLogsPage() {
  // Fetch audit logs (last 100)
  const auditLogs = getAuditLogs({ limit: 100 });

  // Calculate statistics
  const totalEvents = auditLogs.length;
  const eventsByType = new Map<string, number>();
  const userEvents = new Map<string, number>();

  auditLogs.forEach((log) => {
    eventsByType.set(log.eventType, (eventsByType.get(log.eventType) || 0) + 1);
    userEvents.set(log.userId, (userEvents.get(log.userId) || 0) + 1);
  });

  const uniqueUsers = userEvents.size;
  const criticalEvents = auditLogs.filter(
    (log) =>
      log.eventType.includes("DELETED") ||
      log.eventType.includes("FAILED") ||
      log.eventType.includes("CHANGED"),
  ).length;

  const convertedLogs = auditLogs.map((log) => ({
    ...log,
    timestamp: new Date(log.timestamp),
  }));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Audit Logs</h1>
        <p className="mt-2 text-muted-foreground">
          Monitor all user actions and system events for compliance and security
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Events</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalEvents}</div>
            <p className="text-xs text-muted-foreground">in last 24 hours</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unique Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{uniqueUsers}</div>
            <p className="text-xs text-muted-foreground">active users</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Critical Events
            </CardTitle>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {criticalEvents}
            </div>
            <p className="text-xs text-muted-foreground">require attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Event Types</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{eventsByType.size}</div>
            <p className="text-xs text-muted-foreground">different types</p>
          </CardContent>
        </Card>
      </div>

      {/* Event Type Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Event Type Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from(eventsByType.entries())
              .sort((a, b) => b[1] - a[1])
              .slice(0, 10)
              .map(([type, count]) => (
                <div key={type} className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium">{type}</p>
                  </div>
                  <div className="ml-4 flex items-center gap-2">
                    <div className="h-2 w-32 bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500"
                        style={{
                          width: `${(count / totalEvents) * 100}%`,
                        }}
                      />
                    </div>
                    <span className="text-sm font-semibold text-muted-foreground">
                      {count}
                    </span>
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>

      {/* Audit Logs Viewer */}
      <AuditLogsViewer logs={convertedLogs} />
    </div>
  );
}
