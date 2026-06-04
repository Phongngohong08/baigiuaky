import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import Admin from './Admin.jsx'
import './index.css'

// Minimal path-based routing. The hidden /admin dashboard is only reachable by
// typing the URL directly — no navigation link points to it from the public app.
const path = window.location.pathname.replace(/\/+$/, '')
const isAdmin = path === '/admin'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {isAdmin ? <Admin /> : <App />}
  </React.StrictMode>,
)
