import { renderToString } from "react-dom/server";
import { StaticRouter } from "react-router-dom/server";
import App from "./App";
import { EnvContext } from "./EnvContext";
import { RootProviders } from "./RootProviders";

export function render(url, env) {
  const preloadedState = {
    auth: {
      isAuthenticated: false,
      user: null,
    },
    app: {
      theme: "light",
    },
  };

  const html = renderToString(
    <EnvContext.Provider value={env}>
      <StaticRouter location={url}>
        <RootProviders preloadedState={preloadedState}>
          <App />
        </RootProviders>
      </StaticRouter>
    </EnvContext.Provider>
  );

  return {
    appHtml: {
      html,
      head: "", // 👈 keep this, even if unused
    },
    preloadedState,
  };
}
