# VexChat Application

Real-time **telegram-like** chat application built with Next.js, Shadcn/ui, Clerk and Convex.

## Features

- Real-time updates powered by Convex
- Authentication with clerk
- Simple and clean UI built with Shadcn/ui and Tailwind CSS
- Seen message tracking
- invite link functionality
- links being clickable
- user and contact search

## Getting Started

1. Clone the repository
2. Install dependencies with `pnpm install`
3. run `pnpm run convex:dev` for convex deployment
4. set up your clerk deployment
5. edit your .env.local file based on .env.example and clerk/convex variables
6. Run the development server with `npm run dev`

## Structure

The application is structured as follows:

- `/convex` - Convex backend with schema and API endpoints
- `src/app` - Next.js App Router pages and layouts
- `src/components` - Reusable UI components
- `src/lib` - Utility functions, types, and client-side state management

## Technologies

- **Frontend**: Next.js, React, Tailwind CSS, Shadcn/ui
- **Backend**: Convex for real-time database and API
- **State Management**: Zustand for client-side state

## License

This project is licensed under the GNU GPLv3 license.
