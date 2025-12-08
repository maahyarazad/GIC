import React, { ReactNode, FC } from "react";
import { Provider as ReduxProvider } from "react-redux";
import { Store } from "@reduxjs/toolkit";

import { ToastProvider } from "./providers/ToastContext";
import { AuthProvider } from "./providers/AuthProvider";
import { ConfirmDialogProvider } from "./providers/ConfirmDialogProvider";

interface RootProvidersProps {
  store: Store;
  children: ReactNode;
}

const RootProviders: FC<RootProvidersProps> = ({ store, children }) => {
  return (
    <ReduxProvider store={store}>
      <ConfirmDialogProvider>
        <ToastProvider>
          <AuthProvider>{children}</AuthProvider>
        </ToastProvider>
      </ConfirmDialogProvider>
    </ReduxProvider>
  );
};

export default RootProviders;
