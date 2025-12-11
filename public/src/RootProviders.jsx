import React, { StrictMode } from "react";
import { Provider } from "react-redux";
import { store } from "./store.js";

import { ToastProvider } from "./providers/ToastContext.js";
import { AuthProvider } from "./providers/AuthProvider.js";
import { ConfirmDialogProvider } from "./providers/ConfirmDialogProvider.js";

export function RootProviders({ children }) {
  return (
    <StrictMode>
      <Provider store={store}>
        <ConfirmDialogProvider>
          <ToastProvider>
            <AuthProvider>{children}</AuthProvider>
          </ToastProvider>
        </ConfirmDialogProvider>
      </Provider>
    </StrictMode>
  );
}
