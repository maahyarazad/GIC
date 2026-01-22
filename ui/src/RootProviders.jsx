import React, {useEffect, useState} from "react";
import { Provider } from "react-redux";
import { store } from "./store.js";

import { ToastProvider } from "./Providers/ToastContext";
import { ModalProvider } from "./Providers/ModalContext";
import { AuthProvider } from "./Providers/AuthProvider";
import { ConfirmDialogProvider } from "./providers/ConfirmDialogProvider.js";
import MainLoader from "./Components/MainLoader.jsx";


export function RootProviders({ children }) {

const [ready, setReady] = useState(false);

  useEffect(() => {
    // Helper to check if all images inside #root are loaded
    const waitForImages = () => {
      return new Promise((resolve) => {
        const images = Array.from(document.querySelectorAll("#root img"));

        if (images.length === 0) {
          resolve();
          return;
        }

        let loadedCount = 0;
        const onLoadOrError = () => {
          loadedCount++;
          if (loadedCount === images.length) {
            resolve();
          }
        };

        images.forEach((img) => {
          if (img.complete) {
            onLoadOrError();
          } else {
            img.addEventListener("load", onLoadOrError);
            img.addEventListener("error", onLoadOrError);
          }
        });
      });
    };

    const waitForFonts = () => {
      if (document.fonts) {
        return document.fonts.ready;
      }
      return Promise.resolve();
    };

    Promise.all([waitForFonts(), waitForImages()]).then(() => {
      setReady(true);
    });
    
  }, []);

  if (typeof window !== "undefined" && !ready) {
    return <MainLoader />;
  }


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
