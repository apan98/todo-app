import React from 'react';
import { BrowserRouter as Router, Route, Routes, Link } from 'react-router-dom';
import Register from './pages/Register';
import Login from './pages/Login';
import Board from './components/Board';

function App() {
  return (
    <Router>
      <div>
        <nav>
          <ul>
            <li>
              <Link to="/register">Register</Link>
            </li>
            <li>
              <Link to="/login">Login</Link>
            </li>
            <li>
              <Link to="/board">Board</Link>
            </li>
          </ul>
        </nav>

        <Routes>
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/board" element={<Board />} />
          <Route path="/" element={<h2>Welcome to the Todo App!</h2>} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;