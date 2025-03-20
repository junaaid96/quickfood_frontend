# QuickFood - Frontend

QuickFood is a food delivery platform built with Next.js, allowing users to browse restaurants, order food, and track deliveries in real-time.

## Features

- **User Authentication**: Register and login as a customer or restaurant owner
- **Restaurant Browsing**: Explore a variety of restaurants and their menus
- **Order Management**: Place orders, track status, and view order history

## Tech Stack

- **Frontend**: Next.js 15, React 19
- **Styling**: TailwindCSS 4
- **State Management**: React Context API
- **API Communication**: Axios
- **Authentication**: JWT-based auth system

## Getting Started

### Prerequisites

- Node.js 18.17.0 or later
- npm or yarn

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/quickfood_frontend.git
cd quickfood_frontend
```

2. Install dependencies
```bash
npm install
# or
yarn install
```

3. Run the development server
```bash
npm run dev
# or
yarn dev
```

4. Open [http://localhost:3000](http://localhost:3000) with your browser to see the application

## Project Structure

```
quickfood_frontend/
├── app/                  # Next.js app directory
│   ├── (auth)/           # Authentication routes
│   ├── orders/           # Order management pages
│   ├── restaurants/      # Restaurant browsing pages
│   ├── globals.css       # Global styles
│   └── layout.tsx        # Root layout component
├── components/           # Reusable UI components
├── lib/                  # Utility functions and API clients
├── providers/            # Context providers
│   └── auth-provider.tsx # Authentication context
└── public/               # Static assets
```
