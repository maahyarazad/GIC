import { renderToString } from "react-dom/server";
import { StaticRouter } from "react-router-dom/server";
import App from "./App";
import { EnvContext } from "./EnvContext";
import { Provider } from "react-redux";
import { createAppStore } from "./store.js";
import { ToastProvider } from "./Providers/ToastContext";
import { ModalProvider } from "./Providers/ModalContext";
import { AuthProvider } from "./Providers/AuthProvider";
import { SlideMenuProvider } from "./Providers/SlideMenuProvider";
import { ConfirmDialogProvider } from "./Providers/ConfirmDialogProvider.js";
import { PageProvider } from "./Providers/PageContext";

export async function render(url, env, client) {

    console.log("🔥 SSR RENDER FUNCTION HIT");
    console.log(env)
    console.log("🔥 SSR RENDER FUNCTION HIT");

    const preloadedState = {
        auth: {
            isAuthenticated: false,
            user: null,
            loading: true,
        },
        app: {
            siteData: client,
            loading: false,
            error: null,
            isReady: true,
            env: env
        },
    };

    const store = createAppStore(preloadedState);

    const html = renderToString(
        <EnvContext.Provider value={env}>
            <StaticRouter location={url}>
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
            </StaticRouter>
        </EnvContext.Provider>
    );

    return {
        appHtml: {
            html,
            head: "",
        },
        preloadedState,
    };
}