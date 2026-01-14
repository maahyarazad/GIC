import React from "react";
import { Provider } from "react-redux";
import { store } from "./store.js";

import { ToastProvider } from "./Providers/ToastContext";
import { ModalProvider } from "./Providers/ModalContext";
import { AuthProvider } from "./Providers/AuthProvider";
import { ConfirmDialogProvider } from "./providers/ConfirmDialogProvider.js";

export function RootProviders({ children }) {
    return (
        <>
            <Provider store={store}>
                <ConfirmDialogProvider>
                    <ModalProvider>
                        <ToastProvider>
                            <AuthProvider>{children}</AuthProvider>
                        </ToastProvider>
                    </ModalProvider>
                </ConfirmDialogProvider>
            </Provider>
        </>
    );
}
