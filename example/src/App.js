import React, { useEffect, useState } from "react";
import logo from "./logo.svg";
import { Authenticate } from "@workpathco/client";
import cookie from "js-cookie";
import "./App.css";
const TOKEN_KEY = "_wp_token";
const authentication = new Authenticate({
  redirect_uri: `${window.location.protocol}//${window.location.host}`,
  client_id: process.env.REACT_APP_CLIENT_ID,
  auth_domain: process.env.REACT_APP_API_URL,
  id_domain: process.env.REACT_APP_ID_URL,
});
async function getUser(token) {
  return fetch(`${process.env.REACT_APP_ID_URL}/auth/me`, {
    mode: "cors",
    cache: "no-cache",
    credentials: "same-origin",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer: ${token}`,
    },
    redirect: "follow",
    referrerPolicy: "no-referrer",
  }).then((response) => response.json());
}
function logout() {
  cookie.remove(TOKEN_KEY);
  authentication.logout();
}
function App() {
  const [user, setUser] = useState({});
  useEffect(() => {
    try {
      const searchParams = new URLSearchParams(window.location.search);
      if (cookie.get(TOKEN_KEY)) {
        const token = JSON.parse(cookie.get(TOKEN_KEY));
        getUser(token.access_token).then((user) => setUser(user));
      } else if (searchParams.get("state")) {
        authentication.consume().then(() => {
          const token = authentication.memory.getToken();
          cookie.set(TOKEN_KEY, JSON.stringify(token));
          getUser(token.access_token).then((user) => setUser(user));
          window.history.replaceState(
            {},
            document.title,
            window.location.href.replace(window.location.search, "")
          );
        });
      }
    } catch (e) {
      // noop
    }
  }, []);
  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        {!user.person && (
          <a
            className="App-link"
            href=""
            onClick={() => {
              authentication.login();
              return false;
            }}
          >
            Login
          </a>
        )}
        {user.person && user.person.name && (
          <>
            <h1>{user.person.name}</h1>
            <a className="App-link" href="#" onClick={logout}>
              Logout
            </a>
          </>
        )}
      </header>
    </div>
  );
}

export default App;
