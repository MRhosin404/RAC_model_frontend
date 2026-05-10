import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { WsProvider } from './context/WsContext';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <WsProvider>
          <App />
          <Toaster
            position="top-right"
            toastOptions={{
              style:{
                background:'#fff',color:'#1e293b',
                border:'1px solid #e2e8f0',
                fontFamily:'Poppins,sans-serif',
                fontSize:'13px',
                borderRadius:'12px',
                boxShadow:'0 4px 16px rgba(0,0,0,0.10)',
              },
              success:{ iconTheme:{ primary:'#22c55e', secondary:'#fff' } },
              error:  { iconTheme:{ primary:'#ef4444', secondary:'#fff' } },
            }}
          />
        </WsProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
