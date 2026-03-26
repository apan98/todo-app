import React from "react";
import { BrowserRouter as Router, Switch, Route } from "react-router-dom";
import Board from "./components/Board";

function App() {
  return (
    <Router>
      <div className="App">
        <Switch>
          <Route path="/" exact component={Board} />
        </Switch>
      </div>
    </Router>
  );
}

export default App;
