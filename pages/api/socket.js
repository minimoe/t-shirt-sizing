import { Server } from 'socket.io';

const sessions = {};

export default function SocketHandler(req, res) {
  if (res.socket.server.io) {
    res.end();
    return;
  }

  const io = new Server(res.socket.server);
  res.socket.server.io = io;

  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // User joins a session
    socket.on('join-session', (sessionId, username) => {
      socket.join(sessionId);
      
      // Create session if it doesn't exist
      if (!sessions[sessionId]) {
        sessions[sessionId] = {
          users: {},
          status: 'waiting', // waiting, voting, results
          votes: {},
          votingEndsAt: null
        };
      }
      
      // Add user to session
      sessions[sessionId].users[socket.id] = { 
        id: socket.id,
        username, 
        vote: null 
      };
      
      // Notify others about new user
      io.to(sessionId).emit('session-updated', sessions[sessionId]);
      console.log(`${username} joined session ${sessionId}`);
    });

    // Start voting
    socket.on('start-voting', (sessionId) => {
      if (sessions[sessionId]) {
        sessions[sessionId].status = 'voting';
        sessions[sessionId].votes = {};
        sessions[sessionId].votingEndsAt = Date.now() + 20000; // 20 seconds
        
        // Reset all votes
        Object.keys(sessions[sessionId].users).forEach(userId => {
          sessions[sessionId].users[userId].vote = null;
        });
        
        // Notify all users in session
        io.to(sessionId).emit('voting-started', {
          session: sessions[sessionId],
          endsAt: sessions[sessionId].votingEndsAt
        });
        
        // Set timer to end voting
        setTimeout(() => {
          if (sessions[sessionId]) {
            sessions[sessionId].status = 'results';
            io.to(sessionId).emit('voting-ended', sessions[sessionId]);
          }
        }, 20000);
      }
    });

    // Submit vote
    socket.on('submit-vote', (sessionId, vote) => {
      if (sessions[sessionId] && sessions[sessionId].status === 'voting') {
        // Store the vote
        sessions[sessionId].votes[socket.id] = vote;
        sessions[sessionId].users[socket.id].vote = vote;
        
        // Notify all users in session about the update (but not the actual vote yet)
        io.to(sessionId).emit('vote-received', {
          userId: socket.id,
          session: {
            ...sessions[sessionId],
            // Don't reveal votes until voting is done
            users: Object.fromEntries(
              Object.entries(sessions[sessionId].users).map(([id, user]) => [
                id, 
                { ...user, vote: user.vote ? true : null }
              ])
            )
          }
        });
      }
    });

    // User disconnects
    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
      
      // Remove user from all sessions
      Object.keys(sessions).forEach(sessionId => {
        if (sessions[sessionId].users[socket.id]) {
          delete sessions[sessionId].users[socket.id];
          delete sessions[sessionId].votes[socket.id];
          
          // If no users left, delete the session
          if (Object.keys(sessions[sessionId].users).length === 0) {
            delete sessions[sessionId];
          } else {
            // Notify remaining users
            io.to(sessionId).emit('session-updated', sessions[sessionId]);
          }
        }
      });
    });
  });

  res.end();
}