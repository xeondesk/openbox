# Open Agents: System Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Web Client (Next.js 16)                  │
├─────────────────────────────────────────────────────────────────┤
│  - React Components                                             │
│  - Sentry Client SDK                                            │
│  - Socket.io Client (Collaboration)                             │
│  - SWR (Data Fetching)                                          │
└──────────────────────┬────────────────────────────────────────┬─┘
                       │ HTTP/WebSocket                         │
       ┌───────────────┼──────────────────┬────────────────────┘
       │               │                  │
   ┌───▼───┐    ┌──────▼──────┐   ┌──────▼───────┐
   │ Sentry│    │ API Routes  │   │ WebSocket    │
   │       │    │ (Next.js)   │   │ Server       │
   │ Error │    │             │   │              │
   │Track. │    │ - Metrics   │   │ - Presence   │
   │       │    │ - Chat API  │   │ - Cursors    │
   │       │    │ - Sessions  │   │ - Edits      │
   │       │    │ - Analytics │   │ - Comments   │
   └─────┬─┘    └──────┬──────┘   └──────┬───────┘
         │             │                  │
         │      ┌──────▼──────────────────▼─────┐
         │      │     Database (Neon)           │
         │      │                               │
         │      │ - Sessions                    │
         │      │ - Workflows                   │
         │      │ - Users                       │
         │      │ - Audit Logs (optional)       │
         │      │ - Metrics (optional)          │
         │      └─────────────────────────────┬─┘
         │                                    │
         └────────────────────────┬───────────┘
                                  │
                    ┌─────────────▼────────────┐
                    │   Vercel Workflows       │
                    │   (Agent Runtime)        │
                    └──────────────────────────┘
```

---

## Module Architecture

### 1. Monitoring & Observability Layer

```
┌──────────────────────────────────────────────┐
│      Monitoring & Observability              │
├──────────────────────────────────────────────┤
│                                              │
│  ┌────────────────┐  ┌─────────────────┐   │
│  │  Sentry Config │  │  Error Tracking │   │
│  │ - DSN Setup    │  │ - Exceptions    │   │
│  │ - Environment  │  │ - Stack Traces  │   │
│  │ - Sampling     │  │ - User Context  │   │
│  └────────────────┘  └─────────────────┘   │
│                                              │
│  ┌────────────────┐  ┌─────────────────┐   │
│  │  Metrics Sys.  │  │  API Middleware │   │
│  │ - Collection   │  │ - Auto-tracking │   │
│  │ - Aggregation  │  │ - Span tracing  │   │
│  │ - Reporting    │  │ - Error capture │   │
│  └────────────────┘  └─────────────────┘   │
│                                              │
│  ┌──────────────────────────────────────┐   │
│  │  Audit Logging                       │   │
│  │  - Event tracking                    │   │
│  │  - IP/User agent tracking            │   │
│  │  - In-memory storage + Sentry        │   │
│  │  - Export capabilities               │   │
│  └──────────────────────────────────────┘   │
│                                              │
└──────────────────────────────────────────────┘
```

### 2. Analytics Layer

```
┌──────────────────────────────────────────────┐
│           Analytics Dashboard                │
├──────────────────────────────────────────────┤
│                                              │
│  ┌─────────────────────────────────────┐   │
│  │  KPI Overview                       │   │
│  │  - Total Workflows / Success Rate   │   │
│  │  - Execution Time / Costs           │   │
│  │  - Active Users / Response Time     │   │
│  └─────────────────────────────────────┘   │
│                                              │
│  ┌─────────────────────────────────────┐   │
│  │  Performance Charts                 │   │
│  │  - Workflow Trends (Bar/Line)       │   │
│  │  - API Metrics (Response Times)     │   │
│  │  - Cost Analysis (Area Chart)       │   │
│  │  - Model Usage (Pie Chart)          │   │
│  └─────────────────────────────────────┘   │
│                                              │
│  ┌─────────────────────────────────────┐   │
│  │  Analytics Service                  │   │
│  │  - Data Aggregation                 │   │
│  │  - Time Series Data                 │   │
│  │  - Statistical Calculations         │   │
│  └─────────────────────────────────────┘   │
│                                              │
└──────────────────────────────────────────────┘
```

### 3. Collaboration Layer

```
┌──────────────────────────────────────────────┐
│        Real-Time Collaboration               │
├──────────────────────────────────────────────┤
│                                              │
│  ┌─────────────────────────────────────┐   │
│  │  WebSocket Transport                │   │
│  │  - Socket.io Server                 │   │
│  │  - Presence Service                 │   │
│  │  - Event Broadcasting               │   │
│  └─────────────────────────────────────┘   │
│                                              │
│  ┌─────────────────────────────────────┐   │
│  │  Collaboration Service              │   │
│  │  - Presence Tracking                │   │
│  │  - Cursor Sync                      │   │
│  │  - Edit Operations                  │   │
│  │  - Comment Support                  │   │
│  │  - Reconnection Logic               │   │
│  └─────────────────────────────────────┘   │
│                                              │
│  ┌─────────────────────────────────────┐   │
│  │  UI Components                      │   │
│  │  - Live Cursors                     │   │
│  │  - Presence Indicator               │   │
│  │  - Connection Status                │   │
│  │  - User Color Assignment            │   │
│  └─────────────────────────────────────┘   │
│                                              │
└──────────────────────────────────────────────┘
```

---

## Data Flow Diagrams

### Workflow Execution Monitoring

```
User Action (Workflow Start)
        │
        ▼
┌──────────────────┐
│ Workflow Handler │
└────────┬─────────┘
         │
         ▼
┌──────────────────────────────┐
│ recordWorkflowMetric()        │
│ - executionTime              │
│ - status                     │
│ - stepsCompleted             │
└────────┬─────────────────────┘
         │
         ├─────────┬─────────┬─────────┐
         │         │         │         │
         ▼         ▼         ▼         ▼
      Sentry   Sentry    Local      Analytics
      Gauge    Message   History    Dashboard
        │         │         │         │
        └─────────┴─────────┴─────────┘
              │
              ▼
         User Views
       Analytics Page
```

### User Action Audit Trail

```
User Action (e.g., Login)
        │
        ▼
┌──────────────────────────┐
│ logAuthEvent()           │
│ - eventType: LOGIN       │
│ - userId                 │
│ - ipAddress              │
│ - userAgent              │
└────────┬─────────────────┘
         │
         ├──────────┬──────────┐
         │          │          │
         ▼          ▼          ▼
    In-Memory  Sentry     Console
    Audit Log  Message    Logging
         │          │          │
         │          │          │
    │    └──────┬───────────┘
    │           │
    ▼           ▼
  Rotation    Persistence
  (1000)      (Cloud)
    │           │
    └─────┬─────┘
          │
          ▼
    Admin Views
  Audit Logs Page
```

### Real-Time Collaboration Flow

```
User 1 Moves Cursor
        │
        ▼
┌─────────────────────────┐
│ updateCursor({line, col})
└────────┬────────────────┘
         │
         ▼
┌──────────────────────────┐
│ Socket.io Emit           │
│ 'cursor-update'          │
└────────┬─────────────────┘
         │
         ▼
┌──────────────────────────────┐
│ Socket.io Server             │
│ - Broadcast to Room          │
│ - Add to Presence Map        │
└────────┬─────────────────────┘
         │
         ▼
┌──────────────────────────────┐
│ Other Users Receive          │
│ 'presence-update'            │
└────────┬─────────────────────┘
         │
         ▼
┌──────────────────────────────┐
│ useCollaboration Hook        │
│ - Update presence state      │
│ - Trigger callback           │
└────────┬─────────────────────┘
         │
         ▼
┌──────────────────────────────┐
│ UI Components Render         │
│ - LiveCursors                │
│ - PresenceIndicator          │
│ - CollaborationStatus        │
└──────────────────────────────┘
```

---

## File Organization

```
apps/web/
├── app/
│   ├── layout.tsx (Sentry import)
│   ├── providers.tsx (Sentry initialization)
│   ├── settings/
│   │   ├── layout.tsx (Analytics menu item)
│   │   ├── analytics/
│   │   │   └── page.tsx (Analytics dashboard)
│   │   └── admin/
│   │       └── audit-logs/
│   │           └── page.tsx (Audit logs viewer)
│   └── api/
│       └── collaboration/ (TODO: WebSocket endpoint)
│
├── lib/
│   ├── monitoring/
│   │   ├── sentry-config.ts
│   │   ├── metrics.ts
│   │   ├── api-middleware.ts
│   │   └── audit-logger.ts
│   ├── analytics/
│   │   └── service.ts
│   ├── collaboration/
│   │   └── service.ts
│   └── auth/
│       └── actions.ts (Updated with audit logging)
│
├── components/
│   ├── analytics/
│   │   ├── analytics-overview.tsx
│   │   ├── workflow-metrics-chart.tsx
│   │   ├── api-metrics-chart.tsx
│   │   └── cost-trends-chart.tsx
│   ├── audit/
│   │   └── audit-logs-viewer.tsx
│   └── collaboration/
│       └── live-cursors.tsx
│
├── hooks/
│   └── use-collaboration.ts
│
├── instrumentation.ts (Sentry initialization)
└── next.config.ts (Updated with Sentry)
```

---

## Integration Points

### 1. Session Component Integration
```typescript
// Add to existing session component
import { useCollaboration } from "@/hooks/use-collaboration";
import { LiveCursors, CollaborationStatus } from "@/components/collaboration/live-cursors";

export function SessionChat() {
  const { presence, isConnected } = useCollaboration({
    sessionId: params.sessionId,
    userId: user.id,
    userName: user.name
  });

  return (
    <div>
      <CollaborationStatus isConnected={isConnected} presence={presence} currentUserId={user.id} />
      <LiveCursors presence={presence} currentUserId={user.id} />
      {/* Existing chat UI */}
    </div>
  );
}
```

### 2. API Route Integration
```typescript
// Add to existing API routes
import { withMetrics } from "@/lib/monitoring/api-middleware";
import { recordError } from "@/lib/monitoring/metrics";

export const POST = withMetrics(async (request) => {
  try {
    // Your API logic
    return Response.json({ success: true });
  } catch (error) {
    recordError(error, { endpoint: "/api/chat" });
    return Response.json({ error: "Internal error" }, { status: 500 });
  }
});
```

### 3. Workflow Integration
```typescript
// In workflow handlers
import { recordWorkflowMetric, logWorkflowEvent } from "@/lib/monitoring/metrics";

const startTime = Date.now();
try {
  // Execute workflow
  recordWorkflowMetric({
    workflowId: id,
    executionTime: Date.now() - startTime,
    status: "success",
    stepsCompleted: steps.length,
    totalSteps: steps.length
  });
  
  await logWorkflowEvent("WORKFLOW_COMPLETED", userId, sessionId, {
    workflowId: id,
    executionTime: Date.now() - startTime
  });
} catch (error) {
  recordError(error, { workflowId: id });
}
```

---

## Deployment Checklist

### Phase 1 Deployment
- [ ] Configure Sentry DSN in production environment
- [ ] Set NEXT_PUBLIC_SENTRY_DSN and related auth tokens
- [ ] Deploy instrumentation.ts and Sentry config
- [ ] Verify error tracking in Sentry dashboard
- [ ] Deploy analytics dashboard and test
- [ ] Deploy audit logging and verify events are recorded

### Phase 2 Deployment
- [ ] Create WebSocket server endpoint at `/api/collaboration`
- [ ] Set up Socket.io server with presence tracking
- [ ] Deploy collaboration service and hooks
- [ ] Test presence tracking with multiple users
- [ ] Deploy UI components for cursors and indicators
- [ ] Verify real-time sync in production

---

## Performance Benchmarks

### Expected Metrics
- **Sentry SDK overhead:** < 5% CPU
- **Metrics collection:** ~1ms per operation
- **Analytics page load:** < 2s
- **Audit logs query:** < 500ms for 100 entries
- **Collaboration latency:** < 100ms cursor sync

### Optimization Tips
1. Use Sentry sampling (10% in production)
2. Batch metrics every 60 seconds
3. Cache analytics data for 5 minutes
4. Limit audit logs to 1000 in-memory entries
5. Use Redis for distributed collaboration (optional)

---

## Future Enhancements

### Planned Features
1. **Database-backed Metrics** - Move from mock data to real database
2. **Advanced CRDT** - Implement conflict resolution
3. **Persistence** - Save audit logs to database
4. **Scaling** - Redis for distributed presence
5. **Analytics** - Custom report generation

### Potential Improvements
1. Add webhook support for external integrations
2. Implement role-based audit log access
3. Add real-time notifications for errors
4. Create metrics dashboards for different user roles
5. Support for custom collaboration plugins

---

## Support & Maintenance

### Regular Tasks
- Monthly review of error patterns in Sentry
- Weekly analysis of analytics dashboard
- Quarterly audit log archival
- Quarterly review of collaboration performance

### Monitoring
- Set up Sentry alerts for critical errors
- Monitor WebSocket connection stability
- Track analytics dashboard performance
- Monitor database query times

For questions or issues, refer to:
- [Architecture Documentation](/ARCHITECTURE.md)
- [Features Guide](/FEATURES_GUIDE.md)
- [Implementation Summary](/IMPLEMENTATION_SUMMARY.md)
