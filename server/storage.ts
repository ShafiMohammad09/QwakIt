import { 
  type User, 
  type InsertUser,
  type AutomationSession,
  type InsertAutomationSession,
  type Connection,
  type InsertConnection,
  type ActivityLog,
  type InsertActivityLog
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Automation session methods
  createAutomationSession(session: InsertAutomationSession): Promise<AutomationSession>;
  getAutomationSession(id: string): Promise<AutomationSession | undefined>;
  updateAutomationSession(id: string, updates: Partial<AutomationSession>): Promise<AutomationSession | undefined>;
  
  // Connection methods
  createConnection(connection: InsertConnection): Promise<Connection>;
  getConnectionsBySessionId(sessionId: string): Promise<Connection[]>;
  updateConnection(id: string, updates: Partial<Connection>): Promise<Connection | undefined>;
  getNextPendingConnection(sessionId: string): Promise<Connection | undefined>;
  
  // Activity log methods
  createActivityLog(log: InsertActivityLog): Promise<ActivityLog>;
  getActivityLogsBySessionId(sessionId: string): Promise<ActivityLog[]>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private automationSessions: Map<string, AutomationSession>;
  private connections: Map<string, Connection>;
  private activityLogs: Map<string, ActivityLog>;

  constructor() {
    this.users = new Map();
    this.automationSessions = new Map();
    this.connections = new Map();
    this.activityLogs = new Map();
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async createAutomationSession(insertSession: InsertAutomationSession): Promise<AutomationSession> {
    const id = randomUUID();
    const now = new Date();
    const session: AutomationSession = { 
      status: "idle",
      resumeContent: null,
      additionalInstructions: null,
      apiKey: null,
      autoSendEnabled: true,
      countdownDuration: 5,
      connectionDelay: "2-6",
      totalConnections: 0,
      processedConnections: 0,
      ...insertSession, 
      id, 
      createdAt: now,
      updatedAt: now 
    };
    this.automationSessions.set(id, session);
    return session;
  }

  async getAutomationSession(id: string): Promise<AutomationSession | undefined> {
    return this.automationSessions.get(id);
  }

  async updateAutomationSession(id: string, updates: Partial<AutomationSession>): Promise<AutomationSession | undefined> {
    const session = this.automationSessions.get(id);
    if (!session) return undefined;
    
    const updatedSession = { 
      ...session, 
      ...updates, 
      updatedAt: new Date() 
    };
    this.automationSessions.set(id, updatedSession);
    return updatedSession;
  }

  async createConnection(insertConnection: InsertConnection): Promise<Connection> {
    const id = randomUUID();
    const connection: Connection = { 
      status: "pending",
      email: null,
      company: null,
      position: null,
      connectedOn: null,
      generatedMessage: null,
      errorMessage: null,
      ...insertConnection, 
      id, 
      processedAt: null 
    };
    this.connections.set(id, connection);
    return connection;
  }

  async getConnectionsBySessionId(sessionId: string): Promise<Connection[]> {
    return Array.from(this.connections.values()).filter(
      (connection) => connection.sessionId === sessionId
    );
  }

  async updateConnection(id: string, updates: Partial<Connection>): Promise<Connection | undefined> {
    const connection = this.connections.get(id);
    if (!connection) return undefined;
    
    const updatedConnection = { ...connection, ...updates };
    this.connections.set(id, updatedConnection);
    return updatedConnection;
  }

  async getNextPendingConnection(sessionId: string): Promise<Connection | undefined> {
    return Array.from(this.connections.values()).find(
      (connection) => connection.sessionId === sessionId && connection.status === "pending"
    );
  }

  async createActivityLog(insertLog: InsertActivityLog): Promise<ActivityLog> {
    const id = randomUUID();
    const log: ActivityLog = { 
      metadata: null,
      description: null,
      ...insertLog, 
      id, 
      timestamp: new Date() 
    };
    this.activityLogs.set(id, log);
    return log;
  }

  async getActivityLogsBySessionId(sessionId: string): Promise<ActivityLog[]> {
    return Array.from(this.activityLogs.values())
      .filter((log) => log.sessionId === sessionId)
      .sort((a, b) => a.timestamp!.getTime() - b.timestamp!.getTime());
  }
}

export const storage = new MemStorage();
