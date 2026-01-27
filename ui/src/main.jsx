import { StrictMode, useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import './index.css';
import App from './App.jsx';
import { ToastProvider } from './providers/ToastContext';
import { AuthProvider } from './providers/AuthProvider';
import { ConfirmDialogProvider } from './providers/ConfirmDialogProvider';
import { Provider } from 'react-redux';
import { store } from './store.js'
import { ModalProvider } from './Providers/ModalContext.js';
import MainLoader from "./Components/MainLoader.jsx";
import '../public/bootstrap/dist/css/bootstrap.min.css';


const Root = () => {
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    // Wait for all fonts to be loaded
    document.fonts.ready.then(() => setFontsLoaded(true));
  }, []);

  if (!fontsLoaded) {
    return (
      <MainLoader/>
    );
  }

  return (
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
  );
};

createRoot(document.getElementById('root')).render(<Root />);
