# SkillUp Socket.io Implementation Guide

## Table of Contents
1. [Framework Overview](#framework-overview)
2. [Architecture & Components](#architecture--components)
3. [Backend Implementation](#backend-implementation)
4. [Frontend Implementation](#frontend-implementation)
5. [Data Flow & Communication](#data-flow--communication)
6. [Code Analysis](#code-analysis)
7. [Integration Points](#integration-points)
8. [Real-time Communication Flow](#real-time-communication-flow)

---

## Framework Overview

### What is Socket.io?
Socket.io is a library that enables real-time bidirectional event-based communication between web clients and servers. It's built on top of the WebSocket protocol but provides additional features like automatic reconnection, connection fallbacks, and room-based messaging.

### Key Features Used in SkillUp:
- **Real-time messaging**: Instant communication between client and server
- **Room management**: Clients can join specific sessions for isolated communication
- **Event-based architecture**: Custom events for different types of messages
- **Automatic reconnection**: Handles network interruptions gracefully
- **Transport fallbacks**: Falls back to HTTP long-polling if WebSocket fails

### Version Information:
- **Backend**: `socket.io ^4.7.4`
- **Frontend**: `socket.io-client ^4.7.4`

---

## Architecture & Components

### System Architecture
```
┌─────────────────┐    WebSocket/HTTP    ┌─────────────────┐
│   Frontend      │ ◄─────────────────► │   Backend       │
│   (Next.js)     │                     │   (Express.js)  │
│                 │                     │                 │
│ ┌─────────────┐ │                     │ ┌─────────────┐ │
│ │ WebSocket   │ │                     │ │ Socket.IO   │ │
│ │ Service     │ │                     │ │ Server      │ │
│ └─────────────┘ │                     │ └─────────────┘ │
│                 │                     │                 │
│ ┌─────────────┐ │                     │ ┌─────────────┐ │
│ │ React Hook  │ │                     │ │ Course Gen  │ │
│ │ Integration │ │                     │ │ Agent       │ │
│ └─────────────┘ │                     │ └─────────────┘ │
└─────────────────┘                     └─────────────────┘
```

### Core Components:

#### Backend Components:
1. **Socket.IO Server** (`backend/index.ts`)
2. **Course Generation Route** (`backend/src/route/course-generation.route.ts`)
3. **Streaming Course Builder Agent** (`backend/src/course_agent/course-builder-stream.ts`)
4. **WebSocket Event Handlers** (`setupCourseGenerationWebSocket`)

#### Frontend Components:
1. **WebSocket Service** (`skillup-front/src/lib/services/websocket.service.ts`)
2. **Course Generation Hook** (`skillup-front/src/hooks/use-course-generation.ts`)
3. **Course Generator Component** (`skillup-front/src/components/course/course-generator.tsx`)
4. **Course Generation Service** (`skillup-front/src/lib/services/course-generation.service.ts`)

---

## Backend Implementation

### 1. Socket.IO Server Setup (`backend/index.ts`)

```typescript
import { Server as SocketIOServer } from 'socket.io';
import { createServer } from 'http';

const app = express();
const server = createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: function (origin: string | undefined, callback) {
      // Dynamic CORS validation
      if (!origin) return callback(null, true);
      if (origin === envConfig.corsOrigin || origin === envConfig.frontendUrl) {
        return callback(null, true);
      }
      if (envConfig.nodeEnv === 'development' && 
          (origin.includes('localhost') || origin.includes('127.0.0.1'))) {
        return callback(null, true);
      }
      if (origin.includes('vercel.app')) {
        return callback(null, true);
      }
      callback(new Error('Not allowed by CORS'));
    },
    credentials: true
  }
});
```

**Key Implementation Details:**
- Creates HTTP server wrapping Express app
- Initializes Socket.IO server with CORS configuration
- Supports multiple environments (development, production, Vercel)
- Enables credentials for secure communication

### 2. Middleware Integration

```typescript
// Make Socket.IO instance available to routes
app.use((req: any, res, next) => {
  req.io = io;
  next();
});
```

**Purpose:**
- Makes Socket.IO instance accessible in Express route handlers
- Allows routes to emit events to connected clients
- Enables real-time communication from API endpoints

### 3. WebSocket Event Handlers (`setupCourseGenerationWebSocket`)

```typescript
export const setupCourseGenerationWebSocket = (io: SocketIOServer) => {
  io.on('connection', (socket) => {
    console.log(`🔌 Client connected: ${socket.id}`);

    // Join session room
    socket.on('join_session', (sessionId: string) => {
      socket.join(sessionId);
      console.log(`📡 Client ${socket.id} joined session: ${sessionId}`);
      
      // Send session status if it exists
      const session = activeSessions.get(sessionId);
      if (session) {
        socket.emit('session_status', {
          sessionId,
          status: session.status
        });
      }
    });

    // Leave session room
    socket.on('leave_session', (sessionId: string) => {
      socket.leave(sessionId);
      console.log(`📡 Client ${socket.id} left session: ${sessionId}`);
    });

    socket.on('disconnect', () => {
      console.log(`🔌 Client disconnected: ${socket.id}`);
    });
  });
};
```

**Events Handled:**
- `connection`: New client connects
- `join_session`: Client joins a specific generation session
- `leave_session`: Client leaves a session
- `disconnect`: Client disconnects

**Events Emitted:**
- `session_status`: Current status of a generation session
- `course_generation_update`: Real-time progress updates
- `course_generation_complete`: Final completion notification

### 4. Session Management

```typescript
const activeSessions = new Map<string, { 
  agent: StreamingCourseBuilderAgent; 
  status: 'running' | 'completed' | 'failed' 
}>();
```

**Features:**
- Tracks active course generation sessions
- Stores session state and associated agent instance
- Provides session cleanup with periodic garbage collection
- Enables status queries for existing sessions

### 5. Course Generation Route Integration

```typescript
router.post('/generate', async (req: Request, res: Response) => {
  // Get Socket.IO instance from app
  const io: SocketIOServer = (req as any).io;
  
  // Create streaming agent with WebSocket emit callback
  const agent = new StreamingCourseBuilderAgent((message: StreamMessage) => {
    io.to(sessionId).emit('course_generation_update', message);
  });

  // Send immediate response with session ID
  res.json({
    success: true,
    sessionId,
    message: 'Course generation started. Connect to WebSocket for real-time updates.'
  });

  // Start course generation asynchronously
  const courseId = await agent.generateCourse(activation);
  
  // Emit completion event
  io.to(sessionId).emit('course_generation_complete', {
    success: true,
    courseId,
    sessionId
  });
});
```

**Flow:**
1. HTTP POST starts course generation
2. Returns session ID immediately
3. Course generation runs asynchronously
4. Progress updates sent via WebSocket
5. Completion notification sent via WebSocket

---

## Frontend Implementation

### 1. WebSocket Service (`websocket.service.ts`)

```typescript
export class WebSocketService {
  private socket: Socket | null = null;
  private callbacks: WebSocketCallbacks = {};

  connect(backendUrl: string, sessionId: string, callbacks: WebSocketCallbacks): void {
    if (this.socket) {
      this.disconnect();
    }

    this.callbacks = callbacks;
    this.socket = io(backendUrl, {
      transports: ['websocket', 'polling']
    });

    this.setupEventListeners(sessionId);
  }

  private setupEventListeners(sessionId: string): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('Connected to WebSocket');
      this.socket?.emit('join_session', sessionId);
      this.callbacks.onConnect?.();
    });

    this.socket.on('course_generation_update', (message: StreamMessage) => {
      this.callbacks.onUpdate?.(message);
    });

    this.socket.on('course_generation_complete', (result: unknown) => {
      this.callbacks.onComplete?.(result);
    });

    this.socket.on('session_status', (status: unknown) => {
      console.log('Session status:', status);
      this.callbacks.onStatusChange?.(status);
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from WebSocket');
      this.callbacks.onDisconnect?.();
    });
  }
}
```

**Key Features:**
- Manages single WebSocket connection per service instance
- Automatic session joining upon connection
- Callback-based event handling for React integration
- Connection state management
- Transport fallback support

### 2. React Hook Integration (`use-course-generation.ts`)

```typescript
export function useCourseGeneration({ 
  userId, 
  onCourseGenerated 
}: UseCourseGenerationProps): UseCourseGenerationReturn {
  const [isGenerating, setIsGenerating] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [logs, setLogs] = useState<StreamMessage[]>([]);
  
  const webSocketService = useRef<WebSocketService>(new WebSocketService());

  // WebSocket callbacks
  const webSocketCallbacks: WebSocketCallbacks = useMemo(() => ({
    onConnect: () => {
      console.log('WebSocket connected');
    },
    onDisconnect: () => {
      console.log('WebSocket disconnected');
    },
    onUpdate: (message: StreamMessage) => {
      setLogs(prev => [...prev, message]);
    },
    onComplete: (result: unknown) => {
      setIsGenerating(false);
      // Handle completion logic
    }
  }), [onCourseGenerated]);

  // Connect to WebSocket when sessionId changes
  useEffect(() => {
    if (sessionId) {
      const backendUrl = CourseGenerationService.getBackendUrl();
      const wsService = webSocketService.current;
      wsService.connect(backendUrl, sessionId, webSocketCallbacks);
    }

    return () => {
      webSocketService.current.disconnect();
    };
  }, [sessionId, webSocketCallbacks]);
}
```

**React Integration Features:**
- State management for generation status and logs
- Automatic WebSocket connection management
- Effect-based lifecycle handling
- Memoized callbacks to prevent unnecessary re-renders
- Cleanup on component unmount

### 3. UI Component Integration (`course-generator.tsx`)

```typescript
export function CourseGenerator({ userId, onCourseGenerated }: CourseGeneratorProps) {
  const {
    isGenerating,
    sessionId,
    logs,
    startGeneration,
    stopGeneration,
    clearLogs
  } = useCourseGeneration({
    userId,
    onCourseGenerated
  });

  // Auto-scroll to bottom of logs
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  return (
    <div className="w-full max-w-4xl mx-auto p-6 space-y-6">
      {/* Form and Controls */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        {/* Course topic input, web search checkbox, buttons */}
      </div>

      {/* Real-time Console Output */}
      {logs.length > 0 && (
        <div className="bg-gray-900 rounded-lg p-4">
          <div className="bg-black rounded p-3 h-96 overflow-y-auto font-mono text-sm">
            {logs.map((log, index) => (
              <div key={index} className="mb-1">
                <span className="text-gray-500 text-xs">
                  {new Date(log.timestamp).toLocaleTimeString()}
                </span>
                <span className={`ml-2 ${getMessageColor(log.type)}`}>
                  {log.message}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
```

**UI Features:**
- Real-time log display with auto-scrolling
- Color-coded message types
- Session status indicators
- Live connection status
- Interactive controls for generation management

---

## Data Flow & Communication

### 1. Message Types and Structure

```typescript
interface StreamMessage {
  type: 'log' | 'progress' | 'success' | 'error' | 'course_generated';
  message: string;
  data?: any;
  timestamp: string;
}
```

**Message Types:**
- `log`: General information and debug messages
- `progress`: Step completion and workflow progress
- `success`: Successful operations
- `error`: Error messages and failures
- `course_generated`: Final course data with metadata

### 2. Communication Flow

```
Frontend                    Backend
   │                          │
   │ 1. POST /generate         │
   ├─────────────────────────► │
   │                          │
   │ 2. Session ID Response    │
   ◄─────────────────────────┤ │
   │                          │
   │ 3. WebSocket Connect      │
   ├─────────────────────────► │
   │                          │
   │ 4. join_session           │
   ├─────────────────────────► │
   │                          │
   │ 5. course_generation_update (multiple)
   ◄─────────────────────────┤ │
   │                          │
   │ 6. course_generation_complete
   ◄─────────────────────────┤ │
   │                          │
```

### 3. Session Lifecycle

1. **Initiation**: HTTP POST creates session and returns session ID
2. **Connection**: Frontend establishes WebSocket connection
3. **Registration**: Client joins session room using session ID
4. **Streaming**: Backend sends real-time updates to session room
5. **Completion**: Final result sent and session marked as completed
6. **Cleanup**: Periodic cleanup removes old sessions

---

## Code Analysis

### 1. Streaming Course Builder Agent

```typescript
export class StreamingCourseBuilderAgent {
  private workflow: CourseBuilderWorkflow;
  private emitCallback?: (message: StreamMessage) => void;

  constructor(emitCallback?: (message: StreamMessage) => void) {
    this.workflow = new CourseBuilderWorkflow();
    this.emitCallback = emitCallback;
  }

  private emit(type: StreamMessage['type'], message: string, data?: any): void {
    if (this.emitCallback) {
      this.emitCallback({
        type,
        message,
        data,
        timestamp: new Date().toISOString()
      });
    }
  }

  private setupConsoleCapture(): () => void {
    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;

    console.log = (...args: any[]) => {
      const message = args.join(' ');
      this.emit('log', message);
      originalLog.apply(console, args);
    };
    // ... similar for error and warn
  }
}
```

**Key Design Patterns:**
- **Callback Pattern**: Uses callback function for real-time messaging
- **Console Capture**: Intercepts console output for streaming
- **Decorator Pattern**: Wraps original console methods
- **Factory Pattern**: Creates agents with pre-configured callbacks

### 2. Error Handling and Resilience

```typescript
// Backend error handling
try {
  const courseId = await agent.generateCourse(activation);
  if (courseId) {
    io.to(sessionId).emit('course_generation_complete', {
      success: true,
      courseId,
      sessionId
    });
  } else {
    io.to(sessionId).emit('course_generation_complete', {
      success: false,
      error: 'Course generation failed',
      sessionId
    });
  }
} catch (error) {
  io.to(sessionId).emit('course_generation_complete', {
    success: false,
    error: error instanceof Error ? error.message : 'Unknown error',
    sessionId
  });
}
```

**Error Handling Features:**
- Try-catch blocks around async operations
- Graceful degradation on failures
- Error message propagation to frontend
- Session state tracking for failure cases

### 3. Memory Management and Cleanup

```typescript
// Cleanup old sessions periodically
setInterval(() => {
  const now = Date.now();
  for (const [sessionId, session] of activeSessions.entries()) {
    // Remove sessions older than 1 hour
    const sessionTime = parseInt(sessionId.split('_')[1]);
    if (now - sessionTime > 3600000) { // 1 hour
      activeSessions.delete(sessionId);
      console.log(`🧹 Cleaned up old session: ${sessionId}`);
    }
  }
}, 300000); // Check every 5 minutes
```

**Memory Management:**
- Periodic cleanup of expired sessions
- Time-based session expiration
- Automatic memory deallocation
- Prevents memory leaks in long-running processes

---

## Integration Points

### 1. Express.js Integration
- Socket.IO server shares HTTP server with Express
- Socket.IO instance made available to routes via middleware
- Routes can emit events to specific clients or rooms

### 2. React Integration
- Custom hooks encapsulate WebSocket logic
- State management integrated with React lifecycle
- Component re-renders triggered by WebSocket events

### 3. TypeScript Integration
- Strong typing for message interfaces
- Type-safe event handling
- Compile-time validation of message structures

### 4. Database Integration
- Course generation results saved to Supabase
- Real-time progress doesn't require database persistence
- Final course data includes database-generated IDs

---

## Real-time Communication Flow

### 1. Course Generation Sequence

```
User                 Frontend Hook           WebSocket Service       Backend Route          Course Agent
 │                       │                        │                      │                     │
 │ Click Generate         │                        │                      │                     │
 ├─────────────────────► │                        │                      │                     │
 │                       │ POST /generate          │                      │                     │
 │                       ├────────────────────────┼─────────────────────► │                     │
 │                       │                        │                      │ new Agent(callback) │
 │                       │                        │                      ├────────────────────► │
 │                       │ {sessionId}            │                      │                     │
 │                       ◄────────────────────────┼─────────────────────┤ │                     │
 │                       │ ws.connect(sessionId)   │                      │                     │
 │                       ├─────────────────────── ► │                      │                     │
 │                       │                        │ join_session          │                     │
 │                       │                        ├─────────────────────► │                     │
 │                       │                        │                      │ agent.generateCourse │
 │                       │                        │                      ├────────────────────► │
 │                       │                        │                      │                     │ console.log(...)
 │                       │                        │ course_generation_update              ◄─────┤
 │                       │                        ◄─────────────────────┤ │                     │
 │                       │ onUpdate(message)       │                      │                     │
 │                       ◄───────────────────────┤ │                      │                     │ (continues...)
 │ UI Update             │                        │                      │                     │
 ◄─────────────────────┤ │                        │                      │                     │
 │                       │                        │                      │                     │ workflow complete
 │                       │                        │                      │                     ├─ return courseId
 │                       │                        │                      │ course_generation_complete    ◄─────┤
 │                       │                        │ ◄─────────────────────┤ │                     │
 │                       │ onComplete(result)      │                      │                     │
 │                       ◄───────────────────────┤ │                      │                     │
 │ Generation Complete   │                        │                      │                     │
 ◄─────────────────────┤ │                        │                      │                     │
```

### 2. Message Broadcasting Strategy

- **Room-based messaging**: Each session gets its own room
- **Targeted delivery**: Messages sent only to clients in specific session
- **Session isolation**: Prevents cross-session message leakage
- **Scalable architecture**: Can handle multiple concurrent generations

### 3. Performance Considerations

**Backend Optimizations:**
- Asynchronous course generation prevents blocking
- Session-based isolation reduces memory overhead
- Periodic cleanup prevents memory leaks
- Efficient message serialization

**Frontend Optimizations:**
- Memoized callbacks prevent unnecessary re-renders
- Efficient state updates using functional updates
- Auto-scrolling only when new messages arrive
- Connection management with proper cleanup

---

## Technical Benefits

### 1. Real-time User Experience
- Immediate feedback during long-running operations
- Progress visualization keeps users engaged
- Live status updates reduce uncertainty
- Interactive controls allow user intervention

### 2. Scalable Architecture
- Stateless HTTP API for horizontal scaling
- Session-based isolation for concurrent users
- Efficient resource management
- Clean separation of concerns

### 3. Robust Error Handling
- Graceful failure handling at all levels
- Automatic reconnection capabilities
- Comprehensive error propagation
- User-friendly error messages

### 4. Developer Experience
- Type-safe implementation
- Clear separation of concerns
- Reusable service components
- Comprehensive logging and debugging

---

## Conclusion

The Socket.io implementation in SkillUp provides a robust, scalable solution for real-time communication during course generation. The architecture successfully separates concerns between HTTP API operations and real-time messaging, while maintaining strong typing and error handling throughout the stack. The combination of Express.js backend services and React frontend hooks creates a seamless user experience for long-running AI operations.

**Key Achievements:**
- ✅ Real-time progress updates during course generation
- ✅ Session-based isolation for concurrent users
- ✅ Robust error handling and recovery
- ✅ Type-safe implementation across the stack
- ✅ Scalable architecture for production deployment
- ✅ Clean integration with existing React and Express patterns
``` 