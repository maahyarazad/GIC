import React, { useEffect, useRef, useState } from "react";
import { Provider } from "react-redux";
import { createAppStore } from "./store.js";

import { ToastProvider } from "./Providers/ToastContext";
import { ModalProvider } from "./Providers/ModalContext";
import { AuthProvider } from "./Providers/AuthProvider";
import { SlideMenuProvider } from "./Providers/SlideMenuProvider";
import { ConfirmDialogProvider } from "./providers/ConfirmDialogProvider.js";
import MainLoader from "./Components/MainLoader.jsx";

export function RootProviders({ children, preloadedState }) {
  const storeRef = useRef(null);

  if (!storeRef.current) {
    storeRef.current = createAppStore(preloadedState);
  }

  const [ready, setReady] = useState(typeof window === "undefined");

  useEffect(() => {
    if (typeof window === "undefined") return;

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

  if (typeof window !== "undefined" && !ready) {
    return <MainLoader />;
  }

  return (
    <Provider store={storeRef.current}>
      <SlideMenuProvider>
        <ConfirmDialogProvider>
          <ModalProvider>
            <ToastProvider>
              <AuthProvider>{children}</AuthProvider>
            </ToastProvider>
          </ModalProvider>
        </ConfirmDialogProvider>
      </SlideMenuProvider>
    </Provider>
  );
}
