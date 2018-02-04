This section contains advanced topics. This means that the features described here are for those who have already spent some time with this library and therefore won't be overwhelmed and confused by the topics covered here.

## react-router-redux

I didn't build [`react-router-redux`](https://github.com/reactjs/react-router-redux) functionality into this library because I thought that Redux state is actually not intended for storing router state. See [PHILOSOPHY](https://github.com/catamphetamine/react-website/blob/master/PHILOSOPHY.md).

## CSRF protection

[Cross-Site Request Forgery attacks](http://docs.spring.io/spring-security/site/docs/current/reference/html/csrf.html) are the kind of attacks when a legitimate user is tricked into navigating a malicious website which, upon loading, sends a forged HTTP request (GET, POST) to the legitimate website therefore performing an action on behalf of the legitimate user (because the "remember me" cookie is also sent along).

How can a legitimate website guard its users from such attacks? One solution is to ignore the "remember me" cookie and force reading its value from an HTTP header. Because CSRF attacks can't send custom headers (at least using bare HTML/Javascript, without exploiting Adobe Flash plugin bugs, etc), this renders such hacking attempts useless.

Therefore the API should only read "remember me" token from an HTTP header. The client-side application will read "remember me" cookie value and send it as part of an HTTP header for each HTTP request. Alternatively "remember me" token can be stored in a web browser's `localStorage`.

So, **javascript is required** on the client side in order for this CSRF attacks protection to work (because only javascript can set HTTP headers). If a developer instead prefers to run a website for javascript-disabled users (like [Tor](https://www.deepdotweb.com/)) then the only way is to authenticate users in REST API endpoints by a "remember me" cookie rather than `Authorization` HTTP header. This will open the website users to various possible javascriptless CSRF attacks.

## `@preload()`

`@preload()` decorator seems not working for no reason (though it definitely works) then try to place it on top of all other decorators. Internally it adds a special static method to your `Route`'s `component` and some 3rd party decorators on top of it may not retain that static method (though all proper decorators nowadays do retain static methods and variables of the decorated components using [`hoist-non-react-statics`](https://github.com/mridgway/hoist-non-react-statics)).

## `@onPageLoaded()`

When using `{ client: true }` `@preload()`s it's sometimes required to perform some actions (e.g. adjust the current URL) after those `@preload()`s finish (and after the browser navigates to the preloaded page). While with regular `@preload()`s it could be done using `componentDidMount()` (though only on the client side) such an approach wouldn't work for `{ client: true }` `@preload()`s because they're called after `componentDidMount()`. The solution is `@onPageLoaded()` decorator which takes a function parameter, exactly as `@preload()` decorator does, with an extra `history` parameter.

```js
import { onPageLoaded, replaceLocation } from 'react-website'

@onPageLoaded(function({ dispatch, getState, history, location, parameters, server }) {
  if (isAnIdURL(location.pathname)) {
    replaceLocation(replaceIdWithAnAlias(location, getState().userProfilePage.userProfile), history)
  }
}
```

## Restricted routes

In most applications some routes are only accessible by a specific group of users. One may ask what route restriction mechanisms does this library provide. The answer is: you actually don't need them. For example, in my projects the `@preload()` function itself serves as a guard by querying a REST API endpoint which performs user authentication internally and throws a "403 Access Denied" error if a user doesn't have the permission to view the page.

## Cancelling previous action

E.g. for an autocomplete component querying backend for matches it can be useful to be able to abort the previous search for matches when the user enters additional characters. In this case `Promise` cancellation feature can be employed which requires using `bluebird` `Promise` implementation being [configured](http://bluebirdjs.com/docs/api/cancellation.html) for `Promise` cancellation and passing `cancelPrevious: true` flag in an asynchronous Redux "action".

```js
function autocompleteMatch(inputValue) {
  return {
    promise: ({ http }) => http.get(`/search?query=${inputValue}`),
    events: ['AUTOCOMPLETE_MATCH_PENDING', 'AUTOCOMPLETE_MATCH_SUCCESS', 'AUTOCOMPLETE_MATCH_ERROR'],
    cancelPrevious: true
  }
}
```

Gotcha: when relying on `bluebird` `Promise` cancellation don't use `async/await` syntax which is transpiled by Babel using [Facebook's `regenerator`](https://github.com/facebook/regenerator) (as of 2017) which doesn't use `Promise`s internally meaning that the following `async/await` rewrite won't actually cancel the previous action:

```js
// Action cancellation won't work
function autocompleteMatch(inputValue) {
  return {
    promise: async (({ http })) => await http.get(`/search?query=${inputValue}`),
    events: ['AUTOCOMPLETE_MATCH_PENDING', 'AUTOCOMPLETE_MATCH_SUCCESS', 'AUTOCOMPLETE_MATCH_ERROR'],
    cancelPrevious: true
  }
}
```

## react-router@4

"— Does it support `react-router@4`?"
"— [No](https://github.com/catamphetamine/react-website/issues/42)."

## onEnter

`react-router`'s `onEnter` hook is being called twice both on server and client because `react-router`'s `match()` is called before preloading and then the actual navigation happens which triggers the second `match()` call (internally inside `react-router`). This is not considered a blocker because in this library `@preload()` substitutes `onEnter` hooks so just use `@preload()` instead. Double `onEnter` can be fixed using `<RouterContext/>` instead of `<Router/>` but I see no reason to implement such a fix since `onEnter` is simply not used.

## Redux module event and property naming

By default it generates `"_PENDING"`, `"_SUCCESS"` and `"_ERROR"` Redux events along with the corresponding camelCase properties in Redux state. One can customize that by supplying custom `reduxEventNaming` and `reduxPropertyNaming` functions.

#### react-website.js

```js
import reduxSettings from './react-website-redux'

export default {
  // All the settings as before

  ...reduxSettings
}
```

#### react-website-redux.js

```js
import { underscoredToCamelCase } from 'react-website'

export default {
  // When supplying `event` instead of `events`
  // as part of an asynchronous Redux action
  // this will generate `events` from `event`
  // using this function.
  reduxEventNaming: (event) => ([
    `${event}_PENDING`,
    `${event}_SUCCESS`,
    `${event}_ERROR`
  ]),

  // When using "redux module" tool
  // this function will generate a Redux state property name from an event name.
  // By default it's: event `GET_USERS_ERROR` => state.`getUsersError`.
  reduxPropertyNaming: underscoredToCamelCase
}
```

#### redux/blogPost.js

```js
import { reduxModule, eventName } from 'react-website'
import reduxSettings from './react-website-redux'

const redux = reduxModule('BLOG_POST', reduxSettings)
...
```

Notice the extraction of these two configuration parameters (`reduxEventNaming` and `reduxPropertyNaming`) into a separate file `react-website-redux.js`: this is done to break circular dependency on `./react-website.js` file because the `routes` parameter inside `./react-website.js` is the `react-router` `./routes.js` file which `import`s React page components which in turn `import` action creators which in turn would import `./react-website.js` hence the circular (recursive) dependency (same goes for the `reducer` parameter inside `./react-website.js`).

## `@preload()`

If one `@preload()` is in progress and another `@preload()` starts (e.g. Back/Forward browser buttons) the first `@preload()` will be cancelled if `bluebird` `Promise`s are used in the project and also if `bluebird` is configured for [`Promise` cancellation](http://bluebirdjs.com/docs/api/cancellation.html) (this is an advanced feature and is not required for operation). `@preload()` can be disabled for certain "Back" navigation cases by passing `instantBack` property to a `<Link/>` (e.g. for links on search results pages).

### Serving assets and API

In the introductory part of the README "static" files (assets) are served by `webpack-dev-server` on `localhost:8080`. It's for local development only. For production these "static" files must be served by someone else, be it a dedicated proxy server like NginX or (recommended) a cloud-based solution like Amazon S3.

Also, a real-world website most likely has some kind of an API, which, again, could be either a dedicated API server (e.g. written in Golang), a simple Node.js application or a modern "serverless" API like [Amazon Lambda](https://aws.amazon.com/lambda) deployed using [`apex`](https://github.com/apex/apex) and hosted in the cloud.

#### The old-school way

The old-school way is to set up a "proxy server" like [NginX](https://www.sep.com/sep-blog/2014/08/20/hosting-the-node-api-in-nginx-with-a-reverse-proxy/) dispatching all incoming HTTP requests: serving "static" files, redirecting to the API server for `/api` calls, etc.

<details>
  <summary>The old-school way</summary>

```nginx
server {
  # Web server listens on port 80
  listen 80;

  # Serving "static" files (assets)
  location /assets/ {
    root "/filesystem/path/to/static/files";
  }

  # By default everything goes to the page rendering service
  location / {
    proxy_pass http://localhost:3001;
  }

  # Redirect "/api" requests to API service
  location /api {
    rewrite ^/api/?(.*) /$1 break;
    proxy_pass http://localhost:3000;
  }
}
```

A quick Node.js proxy server could also be made up for development purposes using [http-proxy](https://github.com/nodejitsu/node-http-proxy) library.

```js
const path = require('path')
const express = require('express')
const httpProxy = require('http-proxy')

// Use Express or Koa, for example
const app = express()
const proxy = httpProxy.createProxyServer({})

// Serve static files
app.use('/assets', express.static(path.join(__dirname, '../build')))

// Proxy `/api` calls to the API service
app.use('/api', function(request, response) {
  proxy.web(request, response, { target: 'http://localhost:3001' })
})

// Proxy all other HTTP requests to webpage rendering service
app.use(function(request, response) {
  proxy.web(request, response, { target: 'http://localhost:3000' })
})

// Web server listens on port `80`
app.listen(80)
```
</details>

#### The modern way

The modern way is not using any "proxy servers" at all. Instead everything is distributed and decentralized. Webpack-built assets are uploaded to the cloud (e.g. Amazon S3) and webpack configuration option `.output.publicPath` is set to something like `https://s3-ap-southeast-1.amazonaws.com/my-bucket/folder-1/` (your CDN URL) so now serving "static" files is not your job – your only job is to upload them to the cloud after Webpack build finishes. API is dealt with in a similar way: CORS headers are set up to allow querying directly from a web browser by an absolute URL and the API is either hosted as a standalone API server or run "serverless"ly, say, on Amazon Lambda, and is queried by an absolute URL, like `https://at9y1jpex0.execute-api.us-east-1.amazonaws.com/master/users/list`.

## Internal `render()` function

For some advanced use cases (though most likely no one's using this) the internal `render()` function is exposed.

```js
import { render } from 'react-website/server'
import settings from './react-website'

// Returns a Promise.
//
// redirect - redirection URL (in case of an HTTP redirect).
// cookies - a `Set` of HTTP cookies to be set (`response.setHeader('Set-Cookie', cookie)` for each of them).
// status  - HTTP response status.
// content - rendered HTML document (a Node.js "Readable Stream").
//
const { redirect, cookies, status, content } = await render(
  request.url,
  request.headers,
  settings,
  serverSideConfiguration
)
```

The `await render()` function call can be wrapped in a `try/catch` block and for the `catch` block there's also the exported `renderError(error)` function.

```js
import { renderError } from 'react-website/server'

// status  - HTTP response status.
// content - rendered error (a string).
// contentType - HTTP `Content-Type` header (either `text/html` or `text/plain`).
//
const { status, content, contentType } = renderError(error)
```

## All `react-website.js` settings

```javascript
{
  // React-router routes
  // (either a `<Route/>` element or a
  //  `function({ dispatch, getState })`
  //  returning a `<Route/>` element)
  routes: require('./src/routes')

  // Redux reducers (an object)
  reducer: require('./src/redux/index')
  
  // A React component.
  //
  // React page component (`children` property)
  // is rendered inside this "container" component.
  // (e.g. Redux `<Provider/>`,
  //  `react-hot-loader@3`'s `<AppContainer/>`
  //  and other "context providers")
  //
  // By default it just wraps everything with Redux `<Provider/>`:
  //
  // export default ({ store, children }) => <Provider store={ store }>{ children }</Provider>
  //
  container: require('./src/Container')

  // (optional)
  // User can add custom Redux middleware
  reduxMiddleware: () => [...]

  // (optional)
  // User can add custom Redux store enhancers
  reduxStoreEnhancers: () => [...]

  // (optional)
  // `http` utility settings
  http:
  {
    // (optional)
    // Will be called for each HTTP request
    // sent using `http` utility inside Redux action creators.
    // (`request` is a `superagent` request)
    request: (request, { store }) =>
    {
      if (request.url.indexOf('https://my.domain.com') === 0)
      {
        request.set('X-Secret-Token', store.getState().secretToken)
      }
    }

    // (optional)
    url: (path) => `https://api-server.com${path}`
    // Using `http.url(path)` configuration parameter
    // one can call API endpoints like `http.post('/sign-in')`
    // and such relative paths would be transformed
    // into absolute URLs automatically.

    // By default the `http` utility methods
    // only accept relative URLs.
    // This is done to prevent accidentally leaking
    // sensitive HTTP headers to a third party.
    // (e.g. JSON Web Tokens which are sent
    //  in the form of `Authorization` HTTP header)
    // Set this flag to `true` to allow absolute URLs.
    // (is `false` by default)
    allowAbsoluteURLs: true

    // (optional)
    errorState: (error) => ({ ... })
    // 
    // Parses a `superagent` `Error` instance
    // into a plain JSON object for storing it in Redux state.
    // The reason is that `Error` instance can't be part of Redux state
    // because it's not a plain JSON object and therefore violates Redux philosophy.
    //
    // In case of an `application/json` HTTP response
    // the `error` instance has `.data` JSON object property
    // which carries the `application/json` HTTP response payload.
    //
    // By default `errorState` takes the `application/json` HTTP response payload
    // and complements it with HTTP response `status` and `Error` `message`.

    // (optional)
    // (experimental: didn't test this function parameter but it's likely to work)
    //
    catch: async (error, retryCount, helpers) => {}
    //
    // Can optionally retry an HTTP request in case of an error
    // (e.g. if an Auth0 access token expired and has to be refreshed).
    // https://auth0.com/blog/refresh-tokens-what-are-they-and-when-to-use-them/
    //
    // If an error happens then the logic is (concept):
    //
    // httpRequest().then(..., (error) => {
    //   return catch(error, 0, helpers).then(httpRequest).then(..., (error) => {
    //     return catch(error, 1, helpers).then(httpRequest).then(..., (error) => {
    //       ...
    //     ))
    //   ))
    // ))
    //
    // Auth0 `catch` example:
    //
    // catch(error, retryCount, helpers) {
    //   if (retryCount === 0) {
    //     if (error.status === 401 && error.data && error.data.name === 'TokenExpiredError') {
    //       return requestNewAccessToken(localStorage.refreshToken)
    //     }
    //   }
    //   throw error
    // }
    //
    // The `helpers` argument object holds:
    //
    // * `getCookie(name)` – a helper function which works both on client and server.
    //   This function can be used to obtain a "refresh token" stored in a non-"httpOnly" cookie.
    //
    // * `store` – Redux store.
    //
    // * `http` – `http` utility.
  }

  // (optional)
  // Can handle errors occurring inside `@preload()`.
  // For example, if `@preload()` throws a `new Error("Unauthorized")`
  // then a redirect to "/unauthorized" page can be made here.
  error: (error, { path, url, redirect, dispatch, getState, server }) => redirect(`/error?url=${encodeURIComponent(url)}&error=${error.status}`)

  // (optional)
  authentication:
  {
    // (optional)
    protectedCookie: 'cookie-name'
    //
    // The "remember me" cookie can be further protected
    // by making it non-readable in a web browser (the so called "httpOnly" cookies).
    // But how a web browser is gonna get the cookie value to send it as part of an HTTP header?
    // The answer is: the cookie can be read on the server side when the page is being rendered,
    // and then be inserted on a page as a javascript variable which is captured by
    // `http` utility HTTP request methods and immediately removed from the global scope.
    // Therefore this variable will only be accessible inside `http` utility methods
    // and an attacker won't be able neither to read the cookie value nor to read the variable value.
    // This way the only thing a CSRF attacker could do is to request a webpage
    // (without being able to analyse its content) which is never an action so it's always safe.
    // And so the user is completely protected against CSRF attacks.
    //
    // This can be an Auth0 "refresh token", for example.
    // https://auth0.com/blog/refresh-tokens-what-are-they-and-when-to-use-them/
    // If it is, then it's gonna be available in `http.catch()` function
    // and can be used there to refresh expired (short lived) access tokens.
    // If it's the case and `authentication.protectedCookie` is a "refresh token",
    // then also set `authentication.accessToken()` function parameter
    // to return the currently used "access token":
    // this "access token" will always be set automatically
    // in the "Authorization" HTTP header
    // when using `http` utility inside Redux actions.

    // (optional)
    accessToken: (getCookie, { store }) => String
    //
    // If specified, this "access token" will always be set
    // automatically in the "Authorization" HTTP header
    // when using `http` utility inside Redux actions.
    // "Access tokens" are supposed to be short-lived
    // and their storage requirements are less strict
    // than those for the "refresh token".
    // For example, an "access token" may be stored
    // in a regular non-"httpOnly" cookie.
    // Since this method is run both on client and server
    // the provided `getCookie(name)` function works in both cases.
    //
    // `helpers` object holds:
    //
    // * `store` - Redux store

    // (optional)
    header: 'Authorization'
    // The HTTP header containing authentication token
    // (e.g. "Authorization: Bearer {token}").
    // Is "Authorization" by default.
    // (some people requested this setting for
    //  some projects using 'X-Authorization' header
    //  due to the 'Authorization' header being blocked)
  }

  // (optional)
  history:
  {
    // (optional)
    // `history` options (like `basename`)
    options: {}

    // (optional)
    // Custom `history` wrapper, like `syncHistoryWithStore` from `react-router-redux`
    wrap: (history, { store }) => history
  }

  // (optional)
  // Controls automatic `Date` parsing
  // when using `http` utility, and when
  // restoring Redux state on the client-side.
  // (is `true` by default)
  parseDates: `true` / `false`

  // (optional)
  // When supplying `event` instead of `events`
  // as part of an asynchronous Redux action
  // this will generate `events` from `event`
  // using this function.
  reduxEventNaming: (event) => ([
    `${event}_PENDING`,
    `${event}_SUCCESS`,
    `${event}_ERROR`
  ])

  // (optional)
  // When using "redux module" tool
  // this function will generate a Redux state property name for an event name.
  // E.g. event `GET_USERS_ERROR` => state.`getUsersError`.
  reduxPropertyNaming(event) {
    // Converts `CAPS_LOCK_UNDERSCORED_NAMES` to `camelCasedNames`
    return event.split('_')
      .map((word, i) =>  {
        let firstLetter = word.slice(0, 1)
        if (i === 0) {
          firstLetter = firstLetter.toLowerCase()
        }
        return firstLetter + word.slice(1).toLowerCase()
      })
      .join('')
  }
}
```

## All webpage rendering server options

```javascript
{
  // Specify `secure: true` flag to use `https` protocol instead of `http`.
  // secure: true

  // This setting is for people using a proxy server
  // to query their API by relative URLs
  // using the `http` utility in Redux "action creators".
  // The purpose of this setting is to prepend `host` and `port`
  // to such relative API URLs on the server side when using the `http` utility.
  // Specify `secure: true` flag to use `https` protocol instead of `http`.
  // Note that using a proxy server is considered kinda outdated.
  proxy:
  {
    host: '192.168.0.1',
    port: 3000,
    // secure: true
  }

  // `assets` parameter is introduced for the cases
  // when the project is built with Webpack.
  //
  // The reason is that usually the output filenames
  // in Webpack contain `[hash]`es or `[chunkhash]`es,
  // and so when the project is built
  // the assets have not their original filenames (like "main.js")
  // but rather autogenerated filenames (like "main-0ad5f7ec51a....js"),
  // so the corresponding `<script/>` tags must not be constant
  // and must instead be autogenerated each time the project is built.
  //
  // The `assets` parameter provides URLs of javascript and CSS files
  // which will be inserted into the <head/> element of the resulting Html webpage
  // (as <script src="..."/> and <link rel="style" href="..."/>)
  //
  // Also a website "favicon" URL, if any.
  //
  // Can be an `object` or a `function` returning an `object`.
  //
  // `javascript` and `styles` can be `string`s or `object`s.
  // If they are objects then one should also provide an `entry` parameter.
  // If "common" entry is configured in Webpack
  // then it's always included on every page.
  //
  assets: (path, { store }) =>
  {
    return {
      // Webpack "entry points" to be included
      // on a page for this URL `path`.
      // Defaults to `["main"]`:
      // If no "entry points" are configured in Webpack configuration
      // then Webpack creates a single "main" entry point.
      // entries: [...],

      // Javascripts for the `entries`.
      javascript: {
        main: '/assets/main.js'
      },

      // (optional)
      // Styles for the `entries`.
      styles: {
        main: '/assets/main.css'
      },

      // (optional)
      // Website "favicon" URL.
      icon: '/assets/icon.png'
    }
  },

  // (optional)
  // HTML code injection
  html:
  {
    // (optional)
    // Markup inserted into server rendered webpage's <head/>.
    // Can be either a function returning a value or just a value.
    head: (path, { store }) => String, or React.Element, or an array of React.Elements

    // (optional)
    // Markup inserted to the start of the server rendered webpage's <body/>.
    // Can be either a function returning a value or just a value.
    bodyStart: (path, { store }) => String, or React.Element, or an array of React.Elements

    // (optional)
    // Markup inserted to the end of the server rendered webpage's <body/>.
    // Can be either a function returning a value or just a value.
    bodyEnd: (path, { store }) => String, or React.Element, or an array of React.Elements
  }

  // (optional)
  // Initializes Redux state before performing
  // page preloading and rendering.
  //
  // If defined, this function must return an object
  // which is gonna be the initial Redux state.
  //
  initialize: async (httpClient) => ({})
  // (or same without `async`: (httpClient) => Promise.resolve({})

  // (optional)
  //
  // Returns an object of shape `{ locale, messages }`,
  // where `locale` is the page locale chosen for this HTTP request,
  // and `messages` are the translated messages for this `locale`
  // (an object of shape `{ "message.key": "Message value", ... }`).
  //
  // The returned object may optionally have
  // the third property `messagesJSON` (stringified `messages`)
  // to avoid calculating `JSON.stringify(messages)`
  // for each rendered page (a tiny optimization).
  //
  // `preferredLocales` argument is an array
  // of the preferred locales for this user
  // (from the most preferred to the least preferred)
  //
  // `localize()` should normally be a synchronous function.
  // It could be asynchronous though for cases when it's taking
  // messages not from a JSON file but rather from an
  // "admin" user editable database.
  // If the rountrip time (ping) from the rendering service
  // to the database is small enough then it theoretically
  // won't introduce any major page rendering latency
  // (the database will surely cache such a hot query).
  // On the other hand, if a developer fights for each millisecond
  // then `localize()` should just return `messages` from memory.
  //
  localize: ({ store }, preferredLocales) => ({ locale: preferredLocales[0], messages: { 'page.heading': 'Test' } })

  // Is React Server Side Rendering enabled?
  // (is `true` by default)
  //
  // (does not affect server side routing
  //  and server side page preloading)
  //
  // Can be used to offload React server-side rendering
  // from the server side to the client's web browser
  // (as a performance optimization) by setting it to `false`.
  //
  render: `true`/`false`

  // (optional)
  // A custom `log`
  log: bunyan.createLogger(...)
}
```

## All client side rendering options

```javascript
{
  ...

  // (optional)
  // Is fired when a user performs navigation (and also on initial page load).
  // This exists mainly for Google Analytics.
  // `url` is a string (`path` + "search" (?...) + "hash" (#...)).
  // "search" query parameters can be stripped in Google Analytics itself.
  // They aren't stripped out-of-the-box because they might contain
  // meaningful data like "/search?query=dogs".
  // http://www.lunametrics.com/blog/2015/04/17/strip-query-parameters-google-analytics/
  // The "hash" part should also be stripped manually inside `onNavigate` function
  // because someone somewhere someday might make use of those "hashes".
  onNavigate: (url, location) => {}

  // (optional)
  // Is called as soon as Redux store is created.
  //
  // For example, client-side-only applications
  // may capture this `store` as `window.store`
  // to call `bindActionCreators()` for all actions (globally).
  //
  // onStoreCreated: store => window.store = store
  //
  // import { bindActionCreators } from 'redux'
  // import actionCreators from './actions'
  // const boundActionCreators = bindActionCreators(actionCreators, window.store.dispatch)
  // export default boundActionCreators
  //
  onStoreCreated: (store) => {}

  // (optional)
  // Configures Redux development tools.
  //
  // By default Redux development tools are enabled both in development (full-featured)
  // and production (log only, for performance reasons) if the web browser extension is installed.
  // The default behaviour is considered the best practice.
  //
  devtools:
  {
    // (optional)
    // A developer can supply his custom `compose` function
    // (e.g. when not using the web browser extension).
    // By default, "logOnlyInProduction" compose function is used
    // which is the best practice according to the web browser extension author:
    // https://medium.com/@zalmoxis/using-redux-devtools-in-production-4c5b56c5600f
    compose: require('remote-redux-devtools/composeWithDevTools')

    // (optional)
    // Web browser extension options (when no custom `compose` is supplied).
    // https://github.com/zalmoxisus/redux-devtools-extension/blob/master/docs/API/Arguments.md
    options: { ... }
  }

  // (optional)
  // Loads localized messages (asynchronously).
  // The main purpose for introducting this function
  // is to enable Webpack Hot Module Replacement (aka "hot reload")
  // for translation files in development mode.
  translation: async locale => messages
  // (or same without `async`: locale => Promise.resolve(messages))
}
```

Client-side `render` function returns a `Promise` resolving to an object

```js
{
  store,   // (Redux) store
  rerender // Rerender React application (use it in development mode for hot reload)
}
```

## To do

* (minor) Server-side `@preload()` redirection could be rewritten from `throw`ing special "redirection" `Error`s into `.listen()`ing the server-side `MemoryHistory` but since the current "special redirection errors" approach works and has no operational downsides I think that there's no need in such a rewrite.