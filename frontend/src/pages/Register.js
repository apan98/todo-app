import React, { useState } from 'react';
import axios from 'axios';

const Register = ({ setToken, setShowLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('/api/auth/register', { username, password });
      // Log in automatically after registration
      const loginRes = await axios.post('/api/auth/login', { username, password });
      localStorage.setItem('token', loginRes.data.token);
      setToken(loginRes.data.token);
    } catch (error) {
      console.error('Registration failed', error);
    }
  };

  return (
    <div>
      <h2>Register</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.Targe.value)}
        />
        <button type="submit">Register</button>
      </form>
      <button onClick={() => setShowLogin(true)}>Go to Login</button>
    </div>
  );
};

export default Register;
