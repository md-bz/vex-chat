# ConvexChat Application

This is a real-time chat application built with Next.js and Convex. It features real-time messaging with support for channels, private chats, and group conversations.

## Features

- Channels for topic-based discussions
- Group chats for team collaboration
- Direct messages for private conversations
- Real-time updates powered by Convex
- No authentication required - just pick a username
- Simple and clean UI built with shadcn/ui and Tailwind CSS

## Getting Started

1. Clone the repository
2. Install dependencies with `npm install`
3. Set up your Convex deployment
4. Add your Convex URL to the environment variables
5. Run the development server with `npm run dev`

## Structure

The application is structured as follows:

- `/app` - Next.js App Router pages and layouts
- `/components` - Reusable UI components
- `/convex` - Convex backend with schema and API endpoints
- `/lib` - Utility functions, types, and client-side state management

## Technologies

- **Frontend**: Next.js, React, Tailwind CSS, shadcn/ui
- **Backend**: Convex for real-time database and API
- **State Management**: Zustand for client-side state

## Implementation Details

For simplicity, the application uses localStorage to remember the user's selected username. In a production application, you would want to implement proper authentication.

The chat functionality is implemented using Convex's real-time capabilities, with messages being synchronized across all connected clients.

