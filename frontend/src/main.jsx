import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
// Importamos Bootstrap (ya lo hicimos antes, pero confirmamos)
import 'bootstrap/dist/css/bootstrap.min.css';
import { BrowserRouter } from 'react-router-dom';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* Envolvemos la App en el Router */}
    <BrowserRouter> 
      <App />
    </BrowserRouter>
  </React.StrictMode>,
);