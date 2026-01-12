import React from "react";
import { Provider } from "react-redux";
import { store } from "./store.js";

import { ToastProvider } from "./providers/ToastContext.js";
import { AuthProvider } from "./providers/AuthProvider.js";
import { ConfirmDialogProvider } from "./providers/ConfirmDialogProvider.js";

export function RootProviders({ children }) {
  return (
    <>
      <Provider store={store}>
        <ConfirmDialogProvider>
          <ToastProvider>
            <AuthProvider>{children}</AuthProvider>
          </ToastProvider>
        </ConfirmDialogProvider>
      </Provider>
    </>
  );
}
