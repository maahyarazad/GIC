import "./index.css";
import { hydrateRoot } from "react-dom/client";
import App from "./App";
import { BrowserRouter } from "react-router-dom";
import { Provider } from "react-redux";
import { createAppStore } from "./store.js";
import { ToastProvider } from "./Providers/ToastContext";
import { ModalProvider } from "./Providers/ModalContext";
import { AuthProvider } from "./Providers/AuthProvider";
import { SlideMenuProvider } from "./Providers/SlideMenuProvider";
import { ConfirmDialogProvider } from "./Providers/ConfirmDialogProvider.js";
import { PageProvider } from "./Providers/PageContext";
import { useRef } from "react";

const preloadedState = window.__PRELOADED_STATE__ || {};
// delete window.__PRELOADED_STATE__;

const store = createAppStore(preloadedState);

hydrateRoot(
    document.getElementById("root"),
    <BrowserRouter>
        <Provider store={store}>
            <PageProvider>
                <SlideMenuProvider>
                    <ConfirmDialogProvider>
                        <ModalProvider>
                            <ToastProvider>
                                <AuthProvider>
                                    <App />
                                </AuthProvider>
                            </ToastProvider>
                        </ModalProvider>
                    </ConfirmDialogProvider>
                </SlideMenuProvider>
            </PageProvider>
        </Provider>
    </BrowserRouter>
);