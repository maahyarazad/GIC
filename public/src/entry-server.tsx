import React from "react";
import { StaticRouter } from "react-router-dom/server";

import { renderToString } from "react-dom/server";
import RootProviders from "./RootProviders";
import App from './App';
import { HeadProvider, createHeadManager, HeadManager } from "./HeadManager";
import { createStore } from "./createStore";
import { Store } from "@reduxjs/toolkit";
import { RootState } from "./createStore";

  export interface RenderResult {
    html: string;
    head: string;
    preloadedState: RootState;
  }

/**
 * Render a React app server-side for a given URL.
 * @param url The URL to render.
 * @param req Optional request object.
 * @returns An object containing HTML, head string, and preloaded Redux state.
 */
export async function render(url: string, req: Record<string, any> = {}): Promise<RenderResult> {
  // create fresh Redux store per request
  const store: Store<RootState> = createStore();

  // OPTIONAL: preload data into store based on URL
  // Example pseudocode:
  // if (url.startsWith('/product/')) {
  //   const id = extractIdFromUrl(url);
  //   const data = await fetchProduct(id);
  //   store.dispatch(productsSlice.actions.setProduct(data));
  // }

  // create a head manager for this render
  const manager: HeadManager = createHeadManager();

  const jsx = (
    <HeadProvider manager={manager}>
      <RootProviders store={store}>
        <StaticRouter location={url}>
          <App />
        </StaticRouter>
      </RootProviders>
    </HeadProvider>
  );

  const html = renderToString(jsx);
  const head = manager.renderToString();
  const preloadedState = store.getState();

  return { html, head, preloadedState };
}
