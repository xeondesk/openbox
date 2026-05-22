# Open Agents: Features Quick Guide

## Using the New Features

### 1. Error Tracking with Sentry

#### Recording Errors Manually
```typescript
import { recordError } from "@/lib/monitoring/metrics";

try {
  // Your code
} catch (error) {
  recordError(error, { context: "workflow_execution" });
}
```

#### Recording Metrics
```typescript
import { 
  recordMetric, 
  recordWorkflowMetric,
  recordChatMetric,
  recordSandboxMetric 
} from "@/lib/monitoring/metrics";

// Generic metric
recordMetric({
  name: "custom_metric",
  value: 123,
  unit: "ms",
  tags: { feature: "chat" }
});

// Workflow metrics
recordWorkflowMetric({
  workflowId: "wf_123",
  executionTime: 2500,
  status: "success",
  stepsCompleted: 5,
  totalSteps: 5
});
```

#### Tracking API Responses
```typescript
import { withMetrics } from "@/lib/monitoring/api-middleware";

export const POST = withMetrics(async (request) => {
  // Automatically tracks response time and status
  return Response.json({ success: true });
});
```

---

### 2. Analytics Dashboard

**Access:** Settings → Analytics

The dashboard displays real-time metrics including:
- **Overview Cards:** Total workflows, success rate, execution time, costs, active users
- **Workflow Charts:** Success/failure trends and execution time trends
- **API Performance:** Response times, P95/P99 latency, error rates
- **Cost Analysis:** Daily costs with min/max/average calculations
- **Model Usage:** Distribution of models used
- **Execution Distribution:** Histogram of execution times
- **User Activity:** New users, active users, churn rate, session duration
- **Sandbox Stats:** Creation time, utilization, concurrent count
- **Error Tracking:** Top recent errors with frequency

---

### 3. Audit Logging

#### Logging Events
```typescript
import { 
  logAuthEvent,
  logSessionEvent,
  logRepositoryEvent,
  logWorkflowEvent,
  logAdminEvent 
} from "@/lib/monitoring/audit-logger";

// Log authentication
await logAuthEvent("LOGIN", userId, ipAddress, userAgent);

// Log session event
await logSessionEvent("SESSION_CREATED", userId, sessionId, {
  repo: "owner/repo"
});

// Log workflow
await logWorkflowEvent("WORKFLOW_STARTED", userId, sessionId, {
  workflowId: "wf_123",
  executionTime: 2500
});

// Log admin action
await logAdminEvent("USER_ROLE_CHANGED", adminUserId, targetUserId, {
  oldRole: "user",
  newRole: "admin"
});
```

#### Viewing Audit Logs
**Access:** Settings → Admin → Audit Logs

Features:
- Filter by event type or user ID
- View event statistics
- Export logs to JSON for compliance
- Timestamp and IP address tracking

---

### 4. Real-Time Collaboration

#### Using Collaboration in Components
```typescript
import { useCollaboration } from "@/hooks/use-collaboration";
import { LiveCursors, PresenceIndicator, CollaborationStatus } from "@/components/collaboration/live-cursors";

export function SessionComponent({ sessionId, userId, userName }) {
  const {
    presence,
    isConnected,
    error,
    updateCursor,
    sendEditOperation,
    sendComment,
    onEdit,
    onPresence
  } = useCollaboration({
    sessionId,
    userId,
    userName,
    enabled: true
  });

  // Subscribe to presence updates
  useEffect(() => {
    return onPresence((presence) => {
      console.log("Active collaborators:", presence);
    });
  }, []);

  // Subscribe to edit operations
  useEffect(() => {
    return onEdit((operation) => {
      console.log("Edit operation:", operation);
      // Apply operation to editor
    });
  }, []);

  // Update cursor position when editor cursor moves
  const handleCursorMove = (line: number, column: number) => {
    updateCursor({ line, column });
  };

  // Send an edit operation
  const handleEdit = (content: string) => {
    sendEditOperation({
      type: "insert",
      position: { line: 10, column: 5 },
      content
    });
  };

  return (
    <div>
      <CollaborationStatus 
        isConnected={isConnected} 
        presence={presence}
        currentUserId={userId}
      />
      <PresenceIndicator 
        presence={presence}
        currentUserId={userId}
      />
      <LiveCursors 
        presence={presence}
        currentUserId={userId}
      />
      {/* Editor content */}
    </div>
  );
}
```

#### Collaboration Service API
```typescript
import { CollaborationService, getUserColor } from "@/lib/collaboration/service";

// Create service instance
const service = new CollaborationService(sessionId, userId, userName);

// Connect
await service.connect();

// Update cursor
service.updateCursor({ line: 10, column: 5 });

// Send edit operation
service.sendEditOperation({
  type: "insert",
  position: { line: 5, column: 0 },
  content: "new code here"
});

// Send comment
service.sendComment("This looks wrong", { line: 10, column: 5 });

// Get active users
const active = service.getActivePresence();

// Subscribe to changes
service.onPresenceUpdate((presence) => {
  console.log("Presence updated:", presence);
});

service.onEdit((operation) => {
  console.log("Edit operation:", operation);
});

// Disconnect
service.disconnect();
```

---

## Integration Checklist

### For Monitoring
- [ ] Configure Sentry DSN in environment variables
- [ ] Add error tracking to critical paths
- [ ] Monitor metrics on analytics dashboard
- [ ] Set up alerts in Sentry for critical errors

### For Analytics
- [ ] Review dashboard weekly for trends
- [ ] Identify performance bottlenecks from API metrics
- [ ] Track cost trends and optimization opportunities
- [ ] Monitor model usage distribution

### For Audit Logging
- [ ] Review audit logs monthly for compliance
- [ ] Export logs for retention as needed
- [ ] Monitor for suspicious activities
- [ ] Archive logs for long-term storage

### For Collaboration
- [ ] Set up WebSocket server at `/api/collaboration`
- [ ] Test presence tracking with multiple users
- [ ] Implement conflict resolution (OT or CRDT)
- [ ] Add collaboration UI to editor components

---

## Troubleshooting

### Sentry Not Recording Errors
1. Check NEXT_PUBLIC_SENTRY_DSN is set correctly
2. Verify Sentry project is active
3. Check browser console for errors
4. Ensure NODE_ENV is not "development" (disable in dev by default)

### Analytics Dashboard Shows No Data
1. Metrics collection is using mock data by default
2. Replace mock data in `/lib/analytics/service.ts` with real database queries
3. Ensure metrics are being recorded via `recordMetric()`
4. Check browser console for errors

### Audit Logs Not Showing
1. Logs are stored in-memory with 1000-entry rotation
2. To persist, implement database storage in `/lib/monitoring/audit-logger.ts`
3. Check that events are being logged: `logAuthEvent()`, etc.
4. Verify admin user has access to admin panel

### Collaboration Not Working
1. WebSocket server endpoint not implemented yet
2. Create API route at `/api/collaboration` 
3. Set up socket.io server with presence tracking
4. Test connection in browser dev tools

---

## Performance Considerations

1. **Sentry:** Uses sampling to reduce overhead (10% in production)
2. **Metrics:** Batched every 60 seconds to reduce network calls
3. **Audit Logs:** In-memory storage rotates after 1000 entries
4. **Collaboration:** Presence updates every 5 seconds, timeout after 30 seconds

---

## Security Notes

1. **Sentry:** Filters sensitive data before sending
2. **Audit Logs:** Includes IP address and user agent for tracing
3. **Collaboration:** Socket.io uses default security settings (should add auth)
4. **Metrics:** No personal data is collected in metrics

---

## Next Features to Add

1. **Code Review Tool** - AI-powered code analysis before commit
2. **Scheduled Runs** - Cron-based agent execution
3. **Skills Marketplace** - Share reusable agent tools
4. **Advanced RBAC** - Fine-grained permission controls

---

## Resources

- [Sentry Documentation](https://docs.sentry.io/)
- [Socket.io Guide](https://socket.io/docs/v4/socket-io-on-the-server/)
- [Recharts API](https://recharts.org/api)
- [Better Auth Documentation](https://www.better-auth.com/)

For questions or issues, file a GitHub issue or contact the team.
