import { fetchSiteData } from "./api/axiosInstance";
import { renderToString } from "react-dom/server";
import { StaticRouter } from "react-router-dom/server";
import App from "./App";
import { EnvContext } from "./EnvContext";
import { RootProviders } from "./RootProviders";

export async function render(url, env) {
  let siteData = null;


  try {

    siteData = await fetchSiteData(env);
    
  } catch (err) {
    console.error("SSR siteData fetch failed", err);
  }

  const preloadedState = {
    auth: {
      isAuthenticated: false,
      user: null,
      loading: true,
    },
    app: {
      siteData,
      loading: false,
      error: null,
      isReady: false,
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
      head: "",
    },
    preloadedState,
  };
}