import React, { useEffect, useRef, useState } from "react";
import { Provider } from "react-redux";
import { createAppStore } from "./store.js";

import { ToastProvider } from "./Providers/ToastContext";
import { ModalProvider } from "./Providers/ModalContext";
import { AuthProvider } from "./Providers/AuthProvider";
import { SlideMenuProvider } from "./Providers/SlideMenuProvider";
import { ConfirmDialogProvider } from "./Providers/ConfirmDialogProvider.js";
import { PageProvider } from "./Providers/PageContext";
import MainLoader from "./Components/MainLoader.jsx";

export function RootProviders({ children, preloadedState }) {

    const storeRef = useRef(null);

    if (!storeRef.current) {
        storeRef.current = createAppStore(preloadedState);
    }

    return (
        <Provider store={storeRef.current}>
            <PageProvider>
                <ConfirmDialogProvider>
                    <ModalProvider>
                        <ToastProvider>
                            <AuthProvider>
                                {/* Innermost so slide-menu content can use Toast/Modal/Confirm/Auth. */}
                                <SlideMenuProvider>
                                    {children}
                                </SlideMenuProvider>
                            </AuthProvider>
                        </ToastProvider>
                    </ModalProvider>
                </ConfirmDialogProvider>
            </PageProvider>
        </Provider>
    );
}