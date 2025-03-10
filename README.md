# T-Shirt Sizing App

A real-time web application for team story estimation using T-shirt sizes.

## Features

- Create or join estimation sessions with a unique session ID
- Real-time voting using WebSockets
- T-shirt size voting options (XS, S, M, L, XL, XXL)
- 20-second timer for each voting round
- Results display with vote distribution
- Consensus detection

## Technologies

- Next.js
- React
- Socket.io for real-time communication
- CSS-in-JS styling

## Getting Started

1. Install dependencies:
   ```
   npm install
   ```

2. Run the development server:
   ```
   npm run dev
   ```

3. Open [http://localhost:3000](http://localhost:3000) in your browser.

## How to Use

1. Enter your name and a session ID (or generate a random one)
2. Share the session ID with your team members
3. Once everyone has joined, click "Start Voting"
4. Each team member has 20 seconds to vote on their size estimate
5. After voting ends, results will be displayed
6. Start a new voting round when needed