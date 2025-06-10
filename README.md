# Base Operations Take Home Challenge

## Setup

### Prerequisites
- Node.js version 22.8.0

### Installation
```bash
npm install
cd frontend
npm install
cd ..
```

### Running the Application
```bash
npm run dev-full
```

Or run separately:
```bash
npm run dev
npm run frontend
```

## Architecture

### Backend (Express.js)
- Port: 3000
- API Endpoints:
  - `GET /api/events/monthly/:id`
  - `GET /api/events/recent/:id`

### Frontend (React)
- Port: 3001
- San Francisco focus (Location ID: 98)

## Technologies Used
- Backend: Node.js, Express.js, PostgreSQL
- Frontend: React, Recharts, CSS3