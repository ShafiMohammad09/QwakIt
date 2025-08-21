import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer } from "ws";
import multer from "multer";
import { z } from "zod";
import { storage } from "./storage";
import { 
  insertAutomationSessionSchema,
  insertConnectionSchema,
  insertActivityLogSchema 
} from "@shared/schema";
import { parseResumeFile, parseLinkedInCSV, saveUploadedFile } from "./services/fileParser";
import { generatePersonalizedMessage } from "./services/ai";
import { LinkedInBrowserAutomation } from "./services/browser";
import * as fs from "fs";
import * as path from "path";

// Configure multer for file uploads
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

// Store active automation sessions
const activeSessions = new Map<string, {
  browser: LinkedInBrowserAutomation;
  isRunning: boolean;
  isPaused: boolean;
}>();

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  
  // WebSocket server for real-time communication
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  // Store WebSocket connections by session ID
  const wsConnections = new Map<string, any>();

  wss.on('connection', (ws, req) => {
    const url = new URL(req.url!, `http://${req.headers.host}`);
    const sessionId = url.searchParams.get('sessionId');
    
    if (sessionId) {
      wsConnections.set(sessionId, ws);
      
      ws.on('close', () => {
        wsConnections.delete(sessionId);
      });
    }
  });

  // Helper function to broadcast updates
  function broadcastUpdate(sessionId: string, data: any) {
    const ws = wsConnections.get(sessionId);
    if (ws && ws.readyState === ws.OPEN) {
      ws.send(JSON.stringify(data));
    }
  }

  // Helper function to add activity log
  async function addActivityLog(sessionId: string, type: string, title: string, description: string, metadata?: any) {
    await storage.createActivityLog({
      sessionId,
      type,
      title,
      description,
      metadata
    });
    
    broadcastUpdate(sessionId, {
      type: 'log',
      data: { type, title, description, timestamp: new Date().toISOString() }
    });
  }

  // Create automation session
  app.post("/api/sessions", async (req, res) => {
    try {
      const validatedData = insertAutomationSessionSchema.parse(req.body);
      const session = await storage.createAutomationSession(validatedData);
      
      await addActivityLog(session.id, 'info', 'Session created', 'New automation session initialized');
      
      res.json(session);
    } catch (error) {
      res.status(400).json({ message: `Failed to create session: ${error}` });
    }
  });

  // Upload files
  app.post("/api/sessions/:sessionId/upload", upload.fields([
    { name: 'resume', maxCount: 1 },
    { name: 'connections', maxCount: 1 }
  ]), async (req, res) => {
    try {
      const { sessionId } = req.params;
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      
      const uploadDir = path.join(process.cwd(), 'uploads', sessionId);
      let resumeContent = '';
      let connectionsCount = 0;

      // Process resume file
      if (files.resume && files.resume[0]) {
        const resumeFile = files.resume[0];
        const resumePath = saveUploadedFile(resumeFile, uploadDir);
        resumeContent = parseResumeFile(resumePath);
        
        await addActivityLog(sessionId, 'success', 'Resume uploaded', `File: ${resumeFile.originalname}`);
      }

      // Process connections CSV
      if (files.connections && files.connections[0]) {
        const csvFile = files.connections[0];
        const csvPath = saveUploadedFile(csvFile, uploadDir);
        const connections = parseLinkedInCSV(csvPath);
        
        // Save connections to database
        for (const conn of connections) {
          await storage.createConnection({
            sessionId,
            firstName: conn.firstName,
            lastName: conn.lastName,
            profileUrl: conn.profileUrl,
            email: conn.email,
            company: conn.company,
            position: conn.position,
            connectedOn: conn.connectedOn,
            status: 'pending'
          });
        }
        
        connectionsCount = connections.length;
        await addActivityLog(sessionId, 'success', 'Connections uploaded', `${connectionsCount} connections loaded`);
      }

      // Update session
      await storage.updateAutomationSession(sessionId, {
        resumeContent,
        totalConnections: connectionsCount
      });

      broadcastUpdate(sessionId, {
        type: 'upload_complete',
        data: { resumeUploaded: !!resumeContent, connectionsCount }
      });

      res.json({ success: true, resumeUploaded: !!resumeContent, connectionsCount });
    } catch (error) {
      console.error('Upload error:', error);
      res.status(400).json({ message: `Upload failed: ${error}` });
    }
  });

  // Start automation
  app.post("/api/sessions/:sessionId/start", async (req, res) => {
    try {
      const { sessionId } = req.params;
      const session = await storage.getAutomationSession(sessionId);
      
      if (!session) {
        return res.status(404).json({ message: 'Session not found' });
      }

      // Initialize browser automation
      const browser = new LinkedInBrowserAutomation();
      await browser.initialize();
      
      activeSessions.set(sessionId, {
        browser,
        isRunning: true,
        isPaused: false
      });

      await storage.updateAutomationSession(sessionId, { status: 'running' });
      await addActivityLog(sessionId, 'info', 'Automation started', 'Browser initialized, processing connections');

      // Start processing connections asynchronously
      processConnections(sessionId);

      res.json({ success: true });
    } catch (error) {
      console.error('Start automation error:', error);
      res.status(500).json({ message: `Failed to start automation: ${error}` });
    }
  });

  // Pause automation
  app.post("/api/sessions/:sessionId/pause", async (req, res) => {
    try {
      const { sessionId } = req.params;
      const activeSession = activeSessions.get(sessionId);
      
      if (activeSession) {
        activeSession.isPaused = true;
        await storage.updateAutomationSession(sessionId, { status: 'paused' });
        await addActivityLog(sessionId, 'warning', 'Automation paused', 'Processing paused by user');
        
        broadcastUpdate(sessionId, { type: 'status_change', data: { status: 'paused' } });
      }

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: `Failed to pause automation: ${error}` });
    }
  });

  // Resume automation
  app.post("/api/sessions/:sessionId/resume", async (req, res) => {
    try {
      const { sessionId } = req.params;
      const activeSession = activeSessions.get(sessionId);
      
      if (activeSession) {
        activeSession.isPaused = false;
        await storage.updateAutomationSession(sessionId, { status: 'running' });
        await addActivityLog(sessionId, 'info', 'Automation resumed', 'Processing resumed by user');
        
        broadcastUpdate(sessionId, { type: 'status_change', data: { status: 'running' } });
        
        // Continue processing
        processConnections(sessionId);
      }

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: `Failed to resume automation: ${error}` });
    }
  });

  // Stop automation
  app.post("/api/sessions/:sessionId/stop", async (req, res) => {
    try {
      const { sessionId } = req.params;
      const activeSession = activeSessions.get(sessionId);
      
      if (activeSession) {
        activeSession.isRunning = false;
        await activeSession.browser.stop();
        activeSessions.delete(sessionId);
        
        await storage.updateAutomationSession(sessionId, { status: 'stopped' });
        await addActivityLog(sessionId, 'warning', 'Automation stopped', 'Processing stopped by user');
        
        broadcastUpdate(sessionId, { type: 'status_change', data: { status: 'stopped' } });
      }

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: `Failed to stop automation: ${error}` });
    }
  });

  // Update session configuration
  app.patch("/api/sessions/:sessionId", async (req, res) => {
    try {
      const { sessionId } = req.params;
      const updates = req.body;
      
      const session = await storage.updateAutomationSession(sessionId, updates);
      
      if (!session) {
        return res.status(404).json({ message: 'Session not found' });
      }

      res.json(session);
    } catch (error) {
      res.status(500).json({ message: `Failed to update session: ${error}` });
    }
  });

  // Get session status
  app.get("/api/sessions/:sessionId", async (req, res) => {
    try {
      const { sessionId } = req.params;
      const session = await storage.getAutomationSession(sessionId);
      
      if (!session) {
        return res.status(404).json({ message: 'Session not found' });
      }

      const connections = await storage.getConnectionsBySessionId(sessionId);
      const logs = await storage.getActivityLogsBySessionId(sessionId);

      res.json({
        session,
        connections,
        logs,
        isActive: activeSessions.has(sessionId)
      });
    } catch (error) {
      res.status(500).json({ message: `Failed to get session: ${error}` });
    }
  });

  // Get activity logs
  app.get("/api/sessions/:sessionId/logs", async (req, res) => {
    try {
      const { sessionId } = req.params;
      const logs = await storage.getActivityLogsBySessionId(sessionId);
      res.json(logs);
    } catch (error) {
      res.status(500).json({ message: `Failed to get logs: ${error}` });
    }
  });

  // Process connections function
  async function processConnections(sessionId: string) {
    const activeSession = activeSessions.get(sessionId);
    if (!activeSession || !activeSession.isRunning) return;

    const session = await storage.getAutomationSession(sessionId);
    if (!session) return;

    while (activeSession.isRunning) {
      if (activeSession.isPaused) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        continue;
      }

      const connection = await storage.getNextPendingConnection(sessionId);
      if (!connection) {
        // No more connections to process
        await storage.updateAutomationSession(sessionId, { status: 'completed' });
        await addActivityLog(sessionId, 'success', 'Automation completed', 'All connections processed');
        broadcastUpdate(sessionId, { type: 'status_change', data: { status: 'completed' } });
        break;
      }

      try {
        await storage.updateConnection(connection.id, { status: 'processing' });
        
        broadcastUpdate(sessionId, {
          type: 'current_connection',
          data: {
            name: `${connection.firstName} ${connection.lastName}`,
            position: connection.position,
            company: connection.company,
            url: connection.profileUrl
          }
        });

        await addActivityLog(sessionId, 'info', `Opening profile: ${connection.firstName} ${connection.lastName}`, connection.profileUrl);

        // Open LinkedIn profile
        const profileData = await activeSession.browser.openLinkedInProfile(connection.profileUrl);
        
        await addActivityLog(sessionId, 'info', 'AI message generation', 'Generating personalized message using profile data');

        // Generate personalized message
        const message = await generatePersonalizedMessage({
          resumeContent: session.resumeContent || '',
          profileName: `${connection.firstName} ${connection.lastName}`,
          profileHeadline: profileData.headline,
          profileCompany: profileData.company,
          additionalInstructions: session.additionalInstructions || ''
        });

        broadcastUpdate(sessionId, {
          type: 'message_generated',
          data: { message }
        });

        // Open message modal and paste message
        await activeSession.browser.openMessageModal();
        await activeSession.browser.pasteMessage(message);

        await addActivityLog(sessionId, 'info', 'Message ready - countdown started', 'Auto-sending unless cancelled');

        // Start countdown
        const countdownDuration = session.countdownDuration || 5;
        broadcastUpdate(sessionId, {
          type: 'countdown_start',
          data: { duration: countdownDuration }
        });

        let countdownValue = countdownDuration;
        const countdownInterval = setInterval(() => {
          countdownValue--;
          broadcastUpdate(sessionId, {
            type: 'countdown_tick',
            data: { value: countdownValue }
          });
        }, 1000);

        // Wait for countdown or manual intervention
        await new Promise(resolve => setTimeout(resolve, countdownDuration * 1000));
        clearInterval(countdownInterval);

        // Check if still running and not paused
        if (activeSession.isRunning && !activeSession.isPaused && session.autoSendEnabled) {
          await activeSession.browser.sendMessage();
          await storage.updateConnection(connection.id, { 
            status: 'sent', 
            generatedMessage: message,
            processedAt: new Date()
          });
          
          await addActivityLog(sessionId, 'success', `Message sent to ${connection.firstName} ${connection.lastName}`, 'Connection completed successfully');
        } else {
          await storage.updateConnection(connection.id, { status: 'skipped' });
          await addActivityLog(sessionId, 'warning', `Message cancelled for ${connection.firstName} ${connection.lastName}`, 'Skipped due to pause/stop');
        }

        // Close current tab
        await activeSession.browser.closeCurrentTab();

        // Update processed count
        const processedCount = (session.processedConnections || 0) + 1;
        await storage.updateAutomationSession(sessionId, { processedConnections: processedCount });

        broadcastUpdate(sessionId, {
          type: 'progress_update',
          data: {
            processed: processedCount,
            remaining: (session.totalConnections || 0) - processedCount
          }
        });

        // Add delay between connections
        const delayRange = session.connectionDelay?.split('-') || ['2', '6'];
        const minDelay = parseInt(delayRange[0]) * 1000;
        const maxDelay = parseInt(delayRange[1]) * 1000;
        const delay = minDelay + Math.random() * (maxDelay - minDelay);
        
        await new Promise(resolve => setTimeout(resolve, delay));

      } catch (error) {
        console.error(`Error processing connection ${connection.id}:`, error);
        
        const errorMessage = error instanceof Error ? error.message : String(error);
        
        await storage.updateConnection(connection.id, { 
          status: 'failed', 
          errorMessage,
          processedAt: new Date()
        });
        
        await addActivityLog(sessionId, 'error', `Failed to process ${connection.firstName} ${connection.lastName}`, errorMessage);
      }
    }

    // Cleanup
    if (activeSession.browser) {
      await activeSession.browser.stop();
    }
    activeSessions.delete(sessionId);
  }

  return httpServer;
}
