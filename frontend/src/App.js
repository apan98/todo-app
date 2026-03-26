import React from "react";
import { BrowserRouter as Router, Switch, Route } from "react-router-dom";
import Board from "./components/Board";
import Login from "./components/Login";
import Register from "./components/Register";
import PrivateRoute from "./components/PrivateRoute";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function App() {
  return (
    <Router>
      <div className="App">
        <ToastContainer />
        <Switch>
          <Route path="/login" component={Login} />
          <Route path="/register" component={Register} />
          <PrivateRoute path="/" exact component={Board} />
        </Switch>
      </div>
    </Router>
  );
}

export default App;
