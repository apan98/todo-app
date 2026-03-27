import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { DragDropContext } from 'react-beautiful-dnd';
import Board from './components/Board';
import Login from './pages/Login';
import Register from './pages/Register';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [showLogin, setShowLogin] = useState(true);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
  };

  if (!token) {
    return (
      <div>
        {showLogin ? (
          <Login setToken={setToken} setShowLogin={setShowLogin} />
        ) : (
          <Register setToken={setToken} setShowLogin={setShowLogin} />
        )}
      </div>
    );
  }

  return (
    <div className="App">
      <button onClick={handleLogout}>Logout</button>
      <Board />
    </div>
  );
}

export default App;
