import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import { ToastProvider } from './providers/ToastContext';
import { AuthProvider } from './providers/AuthProvider';
import { ConfirmDialogProvider } from './providers/ConfirmDialogProvider';
import { Provider } from 'react-redux';

import { store } from './store.js'
import { ModalProvider } from './Providers/ModalContext.js';
createRoot(document.getElementById('root')).render(
    <>
        <Provider store={store}>
            <ConfirmDialogProvider>
                <ModalProvider>

                    <ToastProvider>
                        <AuthProvider>
                            <App />
                        </AuthProvider>
                    </ToastProvider>
                </ModalProvider>
            </ConfirmDialogProvider>
        </Provider>
    </>
);
