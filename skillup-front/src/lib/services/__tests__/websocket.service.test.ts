import { WebSocketService } from '../websocket.service';
import { io, Socket } from 'socket.io-client';

// Mock socket.io-client
jest.mock('socket.io-client');

describe('WebSocketService', () => {
  let webSocketService: WebSocketService;
  let mockSocket: jest.Mocked<Socket>;
  const mockIo = io as jest.MockedFunction<typeof io>;

  beforeEach(() => {
    webSocketService = new WebSocketService();
    
    // Create a mock socket with all necessary methods
    mockSocket = {
      on: jest.fn(),
      emit: jest.fn(),
      disconnect: jest.fn(),
      connected: false,
    } as unknown as jest.Mocked<Socket>;

    mockIo.mockReturnValue(mockSocket);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('connect', () => {
    it('should establish WebSocket connection with correct parameters', () => {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || '';
      const sessionId = 'session-123';
      const callbacks = {
        onConnect: jest.fn(),
        onDisconnect: jest.fn(),
        onUpdate: jest.fn(),
        onComplete: jest.fn(),
      };

      webSocketService.connect(backendUrl, sessionId, callbacks);

      expect(mockIo).toHaveBeenCalledWith(backendUrl, {
        transports: ['websocket', 'polling']
      });

      // Verify event listeners are set up
      expect(mockSocket.on).toHaveBeenCalledWith('connect', expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith('course_generation_update', expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith('course_generation_complete', expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith('session_status', expect.any(Function));
      expect(mockSocket.on).toHaveBeenCalledWith('disconnect', expect.any(Function));
    });

    it('should disconnect existing connection before creating a new one', () => {
      const backendUrl = 'http://localhost:8000';
      const sessionId = 'session-123';
      const callbacks = {};

      // First connection
      webSocketService.connect(backendUrl, sessionId, callbacks);
      const firstSocket = mockSocket;

      // Second connection
      mockIo.mockReturnValue(mockSocket);
      webSocketService.connect(backendUrl, sessionId, callbacks);

      expect(firstSocket.disconnect).toHaveBeenCalled();
    });

    it('should call onConnect callback when socket connects', () => {
      const backendUrl = 'http://localhost:8000';
      const sessionId = 'session-123';
      const onConnect = jest.fn();
      const callbacks = { onConnect };

      webSocketService.connect(backendUrl, sessionId, callbacks);

      // Simulate connect event
      const connectHandler = mockSocket.on.mock.calls.find(call => call[0] === 'connect')?.[1];
      if (connectHandler) {
        connectHandler();
      }

      expect(mockSocket.emit).toHaveBeenCalledWith('join_session', sessionId);
      expect(onConnect).toHaveBeenCalled();
    });

    it('should call onUpdate callback when receiving course generation updates', () => {
      const backendUrl = 'http://localhost:8000';
      const sessionId = 'session-123';
      const onUpdate = jest.fn();
      const callbacks = { onUpdate };

      webSocketService.connect(backendUrl, sessionId, callbacks);

      const updateMessage = {
        type: 'progress',
        message: 'Generating course content...',
        timestamp: new Date().toISOString()
      };

      // Simulate course_generation_update event
      const updateHandler = mockSocket.on.mock.calls.find(call => call[0] === 'course_generation_update')?.[1];
      if (updateHandler) {
        updateHandler(updateMessage);
      }

      expect(onUpdate).toHaveBeenCalledWith(updateMessage);
    });

    it('should call onComplete callback when course generation completes', () => {
      const backendUrl = 'http://localhost:8000';
      const sessionId = 'session-123';
      const onComplete = jest.fn();
      const callbacks = { onComplete };

      webSocketService.connect(backendUrl, sessionId, callbacks);

      const result = { courseId: 'course-123', success: true };

      // Simulate course_generation_complete event
      const completeHandler = mockSocket.on.mock.calls.find(call => call[0] === 'course_generation_complete')?.[1];
      if (completeHandler) {
        completeHandler(result);
      }

      expect(onComplete).toHaveBeenCalledWith(result);
    });
  });

  describe('disconnect', () => {
    it('should disconnect the socket when called', () => {
      const backendUrl = 'http://localhost:8000';
      const sessionId = 'session-123';
      const callbacks = {};

      webSocketService.connect(backendUrl, sessionId, callbacks);
      webSocketService.disconnect();

      expect(mockSocket.disconnect).toHaveBeenCalled();
    });

    it('should handle disconnect when no socket exists', () => {
      // Should not throw error
      expect(() => webSocketService.disconnect()).not.toThrow();
    });
  });

  describe('isConnected', () => {
    it('should return false when not connected', () => {
      expect(webSocketService.isConnected()).toBe(false);
    });

    it('should return true when socket is connected', () => {
      const backendUrl = 'http://localhost:8000';
      const sessionId = 'session-123';
      const callbacks = {};

      webSocketService.connect(backendUrl, sessionId, callbacks);
      mockSocket.connected = true;

      expect(webSocketService.isConnected()).toBe(true);
    });

    it('should return false when socket is disconnected', () => {
      const backendUrl = 'http://localhost:8000';
      const sessionId = 'session-123';
      const callbacks = {};

      webSocketService.connect(backendUrl, sessionId, callbacks);
      mockSocket.connected = false;

      expect(webSocketService.isConnected()).toBe(false);
    });
  });

  describe('getSocket', () => {
    it('should return null when no socket exists', () => {
      expect(webSocketService.getSocket()).toBeNull();
    });

    it('should return the socket instance when connected', () => {
      const backendUrl = 'http://localhost:8000';
      const sessionId = 'session-123';
      const callbacks = {};

      webSocketService.connect(backendUrl, sessionId, callbacks);

      expect(webSocketService.getSocket()).toBe(mockSocket);
    });
  });
}); 