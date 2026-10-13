import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.min.css';
import './styles.css';

import App from './App';
import { AuthProvider } from './lib/auth';
import { ToastProvider } from './lib/toast';

createRoot(document.getElementById('root')).render(
    <StrictMode>
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <AuthProvider>
                <ToastProvider>
                    <App />
                </ToastProvider>
            </AuthProvider>
        </BrowserRouter>
    </StrictMode>
);
