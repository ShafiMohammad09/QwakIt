# LinkedIn Outreach Automation System

## Overview

This is a full-stack web application that automates LinkedIn outreach by combining resume data with LinkedIn connections to generate personalized messages using AI. The system provides a browser-based automation interface that allows users to upload their resume and connections CSV, configure AI parameters, and monitor the automation process in real-time. The application uses browser automation to interact with LinkedIn profiles while giving users control over message sending through visual confirmation and countdown mechanisms.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript
- **Styling**: Tailwind CSS with shadcn/ui component library
- **State Management**: React hooks with context for component state
- **Real-time Communication**: WebSocket client for live updates from automation process
- **HTTP Client**: TanStack Query for server communication and caching
- **Routing**: Wouter for lightweight client-side routing

### Backend Architecture
- **Runtime**: Node.js with Express.js REST API
- **Language**: TypeScript with ES modules
- **File Processing**: Multer for handling file uploads (resume and CSV parsing)
- **Real-time Communication**: WebSocket server for live automation status updates
- **Browser Automation**: Selenium WebDriver with Chrome for LinkedIn interaction
- **Session Management**: In-memory storage with interfaces for future database integration

### Data Storage
- **Current Implementation**: In-memory storage using Map data structures
- **Database Schema**: Designed for PostgreSQL with Drizzle ORM
- **Session Management**: Tracks automation sessions, connections, and activity logs
- **File Storage**: Temporary file system storage for uploaded documents

### Current Status (January 2025)
- **System Status**: Fully operational with browser automation
- **AI Integration**: Gemini API configured and active for personalized message generation
- **Sample Data**: User's LinkedIn connections CSV loaded (817 connections from various tech companies)
- **Browser Automation**: Chrome WebDriver configured for non-headless operation (fully visible)
- **File Processing**: Resume and CSV parsing working correctly

### AI Integration
- **Provider**: Google Gemini AI API
- **Purpose**: Generate personalized LinkedIn messages based on resume content and profile data
- **Input Processing**: Combines resume text, LinkedIn profile information, and user instructions
- **Output**: Customized outreach messages with professional tone and relevant personalization

### Browser Automation Strategy
- **Visibility**: Non-headless Chrome browser for full user visibility of automation
- **Profile Management**: Uses existing Chrome profiles to maintain LinkedIn login sessions
- **Sequential Processing**: Processes connections one at a time to avoid detection
- **User Control**: Provides countdown mechanisms and manual confirmation before sending messages
- **Error Handling**: Comprehensive logging and error recovery for failed automation steps

## External Dependencies

### Third-party Services
- **Google Gemini AI**: AI message generation service requiring API key
- **Neon Database**: PostgreSQL hosting service (configured but using in-memory storage currently)
- **Chrome/Selenium**: Browser automation requiring ChromeDriver

### Key Libraries
- **UI Components**: Radix UI primitives with shadcn/ui styling
- **Form Handling**: React Hook Form with Zod validation
- **File Processing**: CSV parsing and resume text extraction
- **WebSocket**: Real-time communication between frontend and automation backend
- **Database ORM**: Drizzle configured for PostgreSQL with schema definitions

### Development Tools
- **Build System**: Vite for frontend bundling and development server
- **TypeScript**: Full type safety across frontend and backend
- **Code Quality**: ESBuild for production backend compilation
- **Development Environment**: Replit integration with runtime error overlay