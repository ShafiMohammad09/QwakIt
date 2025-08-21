import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const automationSessions = pgTable("automation_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  status: text("status").notNull().default("idle"), // idle, running, paused, stopped, completed
  resumeContent: text("resume_content"),
  additionalInstructions: text("additional_instructions"),
  apiKey: text("api_key"),
  autoSendEnabled: boolean("auto_send_enabled").default(true),
  countdownDuration: integer("countdown_duration").default(5),
  connectionDelay: text("connection_delay").default("2-6"),
  totalConnections: integer("total_connections").default(0),
  processedConnections: integer("processed_connections").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const connections = pgTable("connections", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id").notNull().references(() => automationSessions.id),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  profileUrl: text("profile_url").notNull(),
  email: text("email"),
  company: text("company"),
  position: text("position"),
  connectedOn: text("connected_on"),
  status: text("status").default("pending"), // pending, processing, sent, failed, skipped
  generatedMessage: text("generated_message"),
  errorMessage: text("error_message"),
  processedAt: timestamp("processed_at"),
});

export const activityLogs = pgTable("activity_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sessionId: varchar("session_id").notNull().references(() => automationSessions.id),
  type: text("type").notNull(), // info, success, warning, error
  title: text("title").notNull(),
  description: text("description"),
  metadata: jsonb("metadata"),
  timestamp: timestamp("timestamp").defaultNow(),
});

export const insertAutomationSessionSchema = createInsertSchema(automationSessions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertConnectionSchema = createInsertSchema(connections).omit({
  id: true,
  processedAt: true,
});

export const insertActivityLogSchema = createInsertSchema(activityLogs).omit({
  id: true,
  timestamp: true,
});

export type InsertAutomationSession = z.infer<typeof insertAutomationSessionSchema>;
export type AutomationSession = typeof automationSessions.$inferSelect;
export type InsertConnection = z.infer<typeof insertConnectionSchema>;
export type Connection = typeof connections.$inferSelect;
export type InsertActivityLog = z.infer<typeof insertActivityLogSchema>;
export type ActivityLog = typeof activityLogs.$inferSelect;

// Keep existing user schema for compatibility
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
