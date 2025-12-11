import { StrictMode } from 'react'
import { renderToString } from 'react-dom/server'
import { StaticRouter } from 'react-router-dom/server'
import App from './App'
import { EnvContext } from './EnvContext'

/**
 * @param {string} url
 * @param {object} env
 */
export function render(url, env) {
  const html = renderToString(
    <StrictMode>
      <EnvContext.Provider value={env}>
        <StaticRouter location={url}>
          <App />
        </StaticRouter>
      </EnvContext.Provider>
    </StrictMode>,
  )
  return { html }
}
