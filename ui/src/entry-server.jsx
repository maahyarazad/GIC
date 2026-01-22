
import { renderToString } from 'react-dom/server'
import { StaticRouter } from 'react-router-dom/server'
import App from './App'
import { EnvContext } from './EnvContext'
import { RootProviders } from './RootProviders'

/**
 * @param {string} url
 * @param {object} env
 */
export function render(url, env) {





  const html = renderToString(
    <>
      <EnvContext.Provider value={env}>
        <StaticRouter location={url}>
          <RootProviders>

            <App />
          </RootProviders>
        </StaticRouter>
      </EnvContext.Provider>
    </>,
  )
  return { html }
}
