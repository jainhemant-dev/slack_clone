# Slack Clone with AI-Powered Features

A modern Slack clone built with Next.js, MongoDB, and Google's Gemini AI that enhances team communication with intelligent features.

## Live Deployed Link

[Slack Clone AI](https://slack-clone-self-psi.vercel.app/)

## Setup Instructions

### Prerequisites

- Node.js (version 18.0.0 or higher)
- MongoDB account (for database)
- Google AI Studio account (for Gemini API key)

### Environment Variables

Create a `.env` file in the root directory with the following variables:

refere `.env.sample` file
```
# MongoDB
MONGODB_URI=your_mongodb_connection_string

# Google Gemini AI
NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key
NEXT_PUBLIC_GEMINI_MODEL=gemini-pro

# JWT for Authentication
JWT_SECRET=your_jwt_secret
```

### Installation Steps

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install -g pnpm (if not exist)
   pnpm install
   ```
3. Run the development server:
   ```bash
   pnpm run dev
   ```
4. Open [http://localhost:3000](http://localhost:3000) in your browser

### Building for Production

```bash
pnpm run build
pnpm start
```

## AI Features Overview

### 1. Org Brain Plugin

The Org Brain gives AI access to all public channels and pinned documents, allowing users to query organizational knowledge.

**Implementation Details:**
- Leverages Gemini AI to process and understand organizational content
- Indexes messages from public channels.
- Provides intelligent responses to queries like "What's the latest on Project Atlas?"
- Synthesizes information across multiple channels and documents

**Usage:**
- Type queries in the AI assistant interface
- Receive comprehensive summaries drawn from across the workspace

### 2. Auto-Reply Composer

The Auto-Reply Composer helps users respond quickly to messages with AI-generated suggestions.

**Implementation Details:**
- Analyzes entire message thread context
- Generates contextually relevant replies
- Considers conversation history for coherent responses

**Usage:**
- Click "Suggest Reply" on any message thread
- AI proposes a response based on the conversation context
- Edit the suggestion as needed before sending

### 3. Tone & Impact Meter

The Tone & Impact Meter analyzes message sentiment and provides feedback on communication style.

**Implementation Details:**
- Uses Gemini AI to evaluate message tone and impact
- Provides feedback on whether messages sound aggressive, weak, confusing, etc.
- Assigns impact rating (high/medium/low) to help users improve communication

**Usage:**
- Type a message in any channel
- View real-time feedback on tone and impact
- Adjust your message based on AI suggestions before sending

### 4. Meeting Notes Generator

The Meeting Notes Generator automatically creates structured meeting notes from conversation threads.

**Implementation Details:**
- Analyzes conversation transcripts
- Extracts key topics, decisions, and action items
- Generates formatted meeting notes with assignees and due dates

**Usage:**
- Select a thread or channel
- Click "Generate Meeting Notes"
- Review and share the automatically generated notes

## Tech Stack

- **Frontend**: Next.js, React 19, TailwindCSS, Radix UI
- **Backend**: Next.js API routes
- **Database**: MongoDB with Mongoose
- **AI**: Google Generative AI (Gemini-1.5 flash)
- **State Management**: Redux Toolkit
- **Authentication**: JWT with bcrypt
- **Deployment**: Vercel
