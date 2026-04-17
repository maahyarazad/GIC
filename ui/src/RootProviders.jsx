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

    // SSR: always false (never ready until client hydrates)
    const [ready, setReady] = useState(false);

    useEffect(() => {
        const waitForImages = () =>
            new Promise((resolve) => {
                const images = Array.from(document.querySelectorAll("#root img"));
                if (images.length === 0) return resolve();

                let loaded = 0;
                const done = () => ++loaded === images.length && resolve();

                images.forEach((img) => {
                    if (img.complete) done();
                    else {
                        img.addEventListener("load", done);
                        img.addEventListener("error", done);
                    }
                });
            });

        const waitForFonts = () =>
            document.fonts ? document.fonts.ready : Promise.resolve();

        Promise.all([waitForFonts(), waitForImages()]).then(() => {
            setReady(true);
        });
    }, []);

    return (
        <Provider store={storeRef.current}>
            <PageProvider>
                <SlideMenuProvider>
                    <ConfirmDialogProvider>
                        <ModalProvider>
                            <ToastProvider>
                                <AuthProvider>
                                    {!ready ? <MainLoader /> : children}
                                </AuthProvider>
                            </ToastProvider>
                        </ModalProvider>
                    </ConfirmDialogProvider>
                </SlideMenuProvider>
            </PageProvider>
        </Provider>
    );
}