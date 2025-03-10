import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

// T-shirt sizes
const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

export default function Home() {
  const [socket, setSocket] = useState(null);
  const [username, setUsername] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [joinedSession, setJoinedSession] = useState(null);
  const [session, setSession] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const timerRef = useRef(null);

  // Setup socket connection
  useEffect(() => {
    const initSocket = async () => {
      await fetch('/api/socket');
      const newSocket = io();
      setSocket(newSocket);

      newSocket.on('connect', () => {
        console.log('Socket connected');
      });

      return newSocket;
    };

    let newSocket;
    if (!socket) {
      initSocket().then(s => {
        newSocket = s;
        setSocket(s);
      });
    }

    return () => {
      if (newSocket) newSocket.disconnect();
    };
  }, []);

  // Socket event listeners
  useEffect(() => {
    if (!socket) return;

    // Session updates
    socket.on('session-updated', (updatedSession) => {
      setSession(updatedSession);
    });

    // Voting started
    socket.on('voting-started', ({ session, endsAt }) => {
      setSession(session);
      const remaining = Math.max(0, endsAt - Date.now());
      setTimeLeft(Math.ceil(remaining / 1000));
      
      // Start countdown timer
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    });

    // Vote received (someone voted)
    socket.on('vote-received', ({ session }) => {
      setSession(session);
    });

    // Voting ended
    socket.on('voting-ended', (finalSession) => {
      setSession(finalSession);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        setTimeLeft(0);
      }
    });

    return () => {
      socket.off('session-updated');
      socket.off('voting-started');
      socket.off('vote-received');
      socket.off('voting-ended');
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [socket]);

  // Join session handler
  const handleJoinSession = (e) => {
    e.preventDefault();
    
    if (!username.trim()) {
      setErrorMessage('Please enter a username');
      return;
    }
    
    if (!sessionId.trim()) {
      setErrorMessage('Please enter a session ID');
      return;
    }
    
    setErrorMessage('');
    socket.emit('join-session', sessionId, username);
    setJoinedSession(sessionId);
  };

  // Start voting handler
  const handleStartVoting = () => {
    socket.emit('start-voting', joinedSession);
  };

  // Submit vote handler
  const handleVote = (size) => {
    socket.emit('submit-vote', joinedSession, size);
  };

  // Generate random session ID
  const generateRandomSession = () => {
    const id = Math.random().toString(36).substring(2, 8).toUpperCase();
    setSessionId(id);
  };

  // Display vote results
  const renderResults = () => {
    if (!session || session.status !== 'results') return null;
    
    const voteCount = {};
    let totalVotes = 0;
    
    // Count votes
    Object.values(session.votes).forEach(vote => {
      voteCount[vote] = (voteCount[vote] || 0) + 1;
      totalVotes++;
    });
    
    // Find most common vote
    let mostCommonVote = null;
    let maxCount = 0;
    
    Object.entries(voteCount).forEach(([vote, count]) => {
      if (count > maxCount) {
        maxCount = count;
        mostCommonVote = vote;
      }
    });
    
    const consensus = maxCount / totalVotes > 0.5;
    
    return (
      <div className="results">
        <h3>Results</h3>
        <div className="vote-distribution">
          {SIZES.map(size => (
            <div key={size} className="vote-bar">
              <div className="size-label">{size}</div>
              <div className="bar-container">
                <div 
                  className="bar" 
                  style={{ 
                    width: `${((voteCount[size] || 0) / totalVotes) * 100}%`,
                    backgroundColor: size === mostCommonVote ? '#4CAF50' : '#2196F3'
                  }}
                ></div>
                <span className="vote-count">{voteCount[size] || 0}</span>
              </div>
            </div>
          ))}
        </div>
        
        {consensus ? (
          <div className="consensus">
            <p>The team has reached consensus on size: <strong>{mostCommonVote}</strong></p>
          </div>
        ) : (
          <div className="no-consensus">
            <p>The team did not reach consensus. Most common size: <strong>{mostCommonVote}</strong></p>
          </div>
        )}
      </div>
    );
  };

  // Render participants list
  const renderParticipants = () => {
    if (!session) return null;
    
    return (
      <div className="participants">
        <h3>Participants</h3>
        <ul>
          {Object.values(session.users).map(user => (
            <li key={user.id}>
              {user.username} {user.vote !== null && session.status === 'voting' && '✓'}
              {session.status === 'results' && user.vote && <span className="user-vote">{user.vote}</span>}
            </li>
          ))}
        </ul>
      </div>
    );
  };

  return (
    <div className="container">
      <style jsx global>{`
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
          color: #333;
        }
        
        h1, h2, h3 {
          color: #2c3e50;
        }
        
        .container {
          width: 100%;
        }
        
        .join-form {
          margin-bottom: 20px;
          border: 1px solid #ddd;
          padding: 20px;
          border-radius: 8px;
          background-color: #f9f9f9;
        }
        
        input {
          padding: 8px;
          margin-right: 10px;
          margin-bottom: 10px;
          border: 1px solid #ddd;
          border-radius: 4px;
          width: 200px;
        }
        
        button {
          padding: 8px 16px;
          background-color: #3498db;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          margin-right: 8px;
          margin-bottom: 8px;
        }
        
        button:hover {
          background-color: #2980b9;
        }
        
        button:disabled {
          background-color: #95a5a6;
          cursor: not-allowed;
        }
        
        .session-area {
          margin-top: 20px;
          border: 1px solid #ddd;
          padding: 20px;
          border-radius: 8px;
        }
        
        .voting-options {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin-top: 20px;
        }
        
        .size-button {
          font-size: 18px;
          padding: 15px 25px;
          background-color: #3498db;
        }
        
        .timer {
          font-size: 24px;
          font-weight: bold;
          color: #e74c3c;
          margin: 10px 0;
        }
        
        .participants {
          margin-top: 20px;
        }
        
        .participants ul {
          list-style-type: none;
          padding: 0;
        }
        
        .participants li {
          padding: 5px 0;
          border-bottom: 1px solid #eee;
        }
        
        .user-vote {
          font-weight: bold;
          margin-left: 10px;
          background-color: #3498db;
          color: white;
          padding: 2px 6px;
          border-radius: 4px;
        }
        
        .results {
          margin-top: 20px;
        }
        
        .vote-distribution {
          margin-top: 15px;
        }
        
        .vote-bar {
          display: flex;
          align-items: center;
          margin-bottom: 8px;
        }
        
        .size-label {
          width: 40px;
          font-weight: bold;
        }
        
        .bar-container {
          flex-grow: 1;
          background-color: #ecf0f1;
          height: 24px;
          position: relative;
          border-radius: 4px;
          overflow: hidden;
          margin-left: 10px;
        }
        
        .bar {
          height: 100%;
          transition: width 0.5s ease-in-out;
        }
        
        .vote-count {
          position: absolute;
          right: 10px;
          top: 50%;
          transform: translateY(-50%);
          color: #fff;
          font-weight: bold;
        }
        
        .consensus, .no-consensus {
          margin-top: 15px;
          padding: 10px;
          border-radius: 4px;
        }
        
        .consensus {
          background-color: #e7f9e7;
          border: 1px solid #a3e9a3;
        }
        
        .no-consensus {
          background-color: #fff5e7;
          border: 1px solid #ffcc99;
        }
        
        .error-message {
          color: #e74c3c;
          margin-top: 10px;
        }
      `}</style>

      <h1>T-Shirt Size Estimation</h1>
      
      {!joinedSession ? (
        <div className="join-form">
          <h2>Join a Session</h2>
          <form onSubmit={handleJoinSession}>
            <div>
              <input
                type="text"
                placeholder="Your Name"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div>
              <input
                type="text"
                placeholder="Session ID"
                value={sessionId}
                onChange={(e) => setSessionId(e.target.value)}
                required
              />
              <button type="button" onClick={generateRandomSession}>
                Generate Random
              </button>
            </div>
            <button type="submit">Join Session</button>
            {errorMessage && <p className="error-message">{errorMessage}</p>}
          </form>
        </div>
      ) : (
        <div className="session-area">
          <h2>Session: {joinedSession}</h2>
          <p>Hello, {username}!</p>
          
          {session && session.status === 'waiting' && (
            <div>
              <button onClick={handleStartVoting}>Start Voting (20 seconds)</button>
            </div>
          )}
          
          {session && session.status === 'voting' && (
            <div>
              <div className="timer">Time left: {timeLeft} seconds</div>
              <div className="voting-options">
                {SIZES.map(size => (
                  <button
                    key={size}
                    className="size-button"
                    onClick={() => handleVote(size)}
                    disabled={(session.users[socket.id]?.vote !== null)}
                  >
                    {size}
                  </button>
                ))}
              </div>
              {session.users[socket.id]?.vote && (
                <p>You voted: <strong>{session.users[socket.id].vote}</strong></p>
              )}
            </div>
          )}
          
          {renderParticipants()}
          {renderResults()}
          
          {session && session.status === 'results' && (
            <button onClick={handleStartVoting}>Start New Vote</button>
          )}
        </div>
      )}
    </div>
  );
}