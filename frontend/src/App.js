
import React from 'react';
import { BrowserRouter as Router, Route, Switch, Redirect } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Board from './pages/Board';
import AuthProvider, { AuthContext } from './context/AuthContext';

const PrivateRoute = ({ component: Component, ...rest }) => {
  const { token } = React.useContext(AuthContext);
  return (
    <Route
      {...rest}
      render={(props) =>
        token ? <Component {...props} /> : <Redirect to="/login" />
      }
    />
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <Switch>
          <Route path="/login" component={Login} />
          <Route path="/register" component={Register} />
          <PrivateRoute path="/" component={Board} />
        </Switch>
      </AuthProvider>
    </Router>
  );
}

export default App;
