# react-website

A complete solution for building a React/Redux application

* Routing
* Page preloading
* (optional) Code splitting
* (optional) Server-side rendering
* Asynchronous HTTP requests
* Easy and simplified Redux (no boilerplate code)
* Document metadata (`<title/>`, `<meta/>`, social network sharing)
* Webpack "hot reload"
* HTTP Cookies
* etc

# Introduction

## Getting started

First, install Redux:

```bash
$ npm install redux react-redux@5 --save
```

Then, install `react-website`:

```bash
$ npm install react-website --save
```

Start by creating `react-website` configuration file.

#### ./src/react-website.js

```javascript
import routes from './routes'

// Redux reducers, which will be combined into
// a single Redux reducer via `combineReducers()`.
import * as reducers from './redux/index'

export default {
  routes,
  reducers
}
```

The routes:

#### ./src/routes.js

```js
import React from 'react'
import { Route } from 'react-website'

import App from '../pages/App'
import Home from '../pages/Home'
import About from '../pages/About'

export default (
  <Route path="/" component={ App }>
    <Route component={ Home }/>
    <Route path="about" component={ About }/>
  </Route>
)
```

#### ./src/pages/App.js

```js
import React from 'react'
import { Link } from 'react-website'

export default ({ children }) => (
  <div>
    <h1> Web Application </h1>
    <ul>
      <li> <Link exact to="/"> Home </Link> </li>
      <li> <Link to="/about"> About </Link> </li>
    </ul>
    { children }
  </div>
)
```

#### ./src/pages/Home.js

```js
import React from 'react'

export default () => <div> This is a home page </div>
```

#### ./src/pages/About.js

```js
import React from 'react'

export default () => <div> Made using `react-website` </div>
```

The reducers:

#### ./src/redux/index.js

```js
// For those who're unfamiliar with Redux,
// a reducer is a function `(state, action) => state`.
export { default as reducer1 } from './reducer1'
export { default as reducer2 } from './reducer2'
...
```

Then call `render()` in the main client-side javascript file.

#### ./src/index.js

```javascript
import { render } from 'react-website'
import settings from './react-website'

// Render the page in web browser
render(settings)
```

And the `index.html` would look like this:

```html
<html>
  <head>
    <title>Example</title>
    <!-- Fix encoding. -->
    <meta charset="utf-8">
    <!-- Fix document width for mobile devices. -->
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
  </head>
  <body>
    <script src="/bundle.js"></script>
  </body>
</html>
```

Where `bundle.js` is the `./src/index.js` file built with Webpack (or you could use any other javascript bundler).

Now, `index.html` and `bundle.js` files must be served over HTTP(S).

If you're using Webpack then add [`HtmlWebpackPlugin`](https://webpack.js.org/plugins/html-webpack-plugin/) to generate `index.html`, and run [`webpack-dev-server`](https://webpack.js.org/configuration/dev-server/) with [`historyApiFallback`](https://webpack.js.org/configuration/dev-server/#devserver-historyapifallback) to serve the generated `index.html` and `bundle.js` files over HTTP on `localhost:8080`.

<details>
<summary>See <code>HtmlWebpackPlugin</code> configuration example</summary>

#### webpack.config.js

```js
const HtmlWebpackPlugin = require('html-webpack-plugin')

const buildOutputPath = '...'
const devServerPort = 8080 // Any port number.

module.exports = {
  output: {
    path: buildOutputPath,
    publicPath: `http://localhost:${devServerPort}`,
    ...
  },
  ...,
  plugins: [
    new HtmlWebpackPlugin({
      template: 'src/index.html' // Path to `index.html` file.
    }),
    ...
  ],
  devServer: {
    port: devServerPort,
    contentBase: buildOutputPath,
    historyApiFallback : true
  }
}
```

#### src/index.html

```html
<html>
  <head>
    <title>Example</title>
    <!-- Fix encoding. -->
    <meta charset="utf-8">
    <!-- Fix document width for mobile devices. -->
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
  </head>
  <body>
    <!-- HtmlWebpackPlugin will insert a <script> tag here. -->
  </body>
</html>
```

```
webpack-dev-server --hot --config webpack.config.js
```
</details>

####
The website (`index.html`, `bundle.js`, CSS stylesheets and images, etc) can now be deployed as-is in a cloud (e.g. on Amazon S3) and served statically for a very low price. The API can be hosted "serverlessly" in a cloud (e.g. Amazon Lambda) which is also considered cheap. No running Node.js server is required. Yes, it's not a Server-Side Rendered approach because a user is given a blank page first, then `bundle.js` script is loaded by the web browser, then `bundle.js` script is executed fetching some data from the API via an HTTP request, and only when that HTTP request comes back — only then the page is rendered (in the browser). Google won't index such websites, but if searchability is not a requirement (at all or yet) then that would be the way to go (e.g. startup "MVP"s or "internal applications"). Server-Side Rendering can be easily added to such setup should the need arise.

## Server Side Rendering

Adding server-side rendering to the setup is quite simple though requiring a Node.js process running which increases hosting costs and maintenance complexity.

In case of server-side rendering `index.html` is being generated on-the-fly by page rendering server for each incoming HTTP request, so the `index.html` file may be deleted as it's of no use now.

#### ./rendering-server.js

```javascript
import webpageServer from 'react-website/server'
import settings from './react-website'

// Create webpage rendering server
const server = webpageServer(settings, {
  // Pass `secure: true` for HTTPS.
  //
  // These are the URLs of the "static" javascript and CSS files
  // which are injected in the resulting Html webpage
  // as <script src="..."/> and <link rel="style" href="..."/>.
  // (this is for the main application JS and CSS bundles only,
  //  for injecting 3rd party JS and CSS use `html` settings instead:
  README-ADVANCED.md#all-webpage-rendering-server-options)
  assets() {
    return {
      // Assuming that it's being tested on a local computer first
      // therefore using "localhost" URLs.
      javascript: 'http://localhost:8080/bundle.js',
      // (optional) If using a separate CSS bundle:
      style: 'http://localhost:8080/bundle.css'
    }
  }
})

// Start webpage rendering server on port 3000
// (`server.listen(port, [host], [callback])`)
server.listen(3000, function(error) {
  if (error) {
    throw error
  }
  console.log(`Webpage rendering server is listening at http://localhost:3000`)
})
```

Run the rendering server:

```
$ npm install npx --global
$ npm install babel-cli
$ npx babel-node rendering-server.js
```

Now [disable javascript in Chrome DevTools](http://stackoverflow.com/questions/13405383/how-to-disable-javascript-in-chrome-developer-tools), go to `localhost:3000` and the server should respond with a fully server-side-rendered page.

## Conclusion

This concludes the introductory part of the README and the rest is the description of the various tools and techniques which come prepackaged with this library.

# Documentation

## Preloading pages

For page preloading use the `@preload()` decorator to load the neccessary data before the page is rendered.

```javascript
import { connect } from 'react-redux'
import { preload } from 'react-website'

// Redux "asynchronous action",
// explained later in this document.
function fetchUsers() {
  return {
    promise: http => http.get('/api/users'),
    events: ['FETCH_USERS_PENDING', 'FETCH_USERS_SUCCESS', 'FETCH_USERS_FAILURE']
  }
}

@preload(async ({ dispatch }) => {
  // Send HTTP request and wait for response
  await dispatch(fetchUsers())
})
@connect(
  (state) => ({ users: state.usersPage.users }),
  // Calls `bindActionCreators()`
  // for the specified Redux action creators.
  { fetchUsers }
)
export default class UsersPage extends Component {
  render() {
    const { users, fetchUsers } = this.props
    return (
      <div>
        <ul> { users.map(user => <li> { user.name } </li>) } </ul>
        <button onClick={ fetchUsers }> Refresh </button>
      </div>
    )
  }
}
```

In this example the `@preload()` decorator is used to preload a page before it is displayed, i.e. before the page is rendered (both on server side and on client side).

`@preload()` decorator takes an `async`/`await` function which takes an object of arguments:

```javascript
@preload(async (preloadArguments) => {
  const = {
    // Can `dispatch()` Redux actions.
    dispatch,
    // Returns Redux state.
    getState,
    // Current page location (object).
    location,
    // Route URL parameters.
    // For example, for route "/users/:id"
    // and URL "/users/barackobama"
    // `params` will be `{ id: "barackobama" }`.
    params,
    // Is this server-side rendering?
    server,
    // (utility)
    // Returns cookie value by name.
    getCookie
  }
  = preloadArguments

  // Send HTTP request and wait for response.
  await dispatch(fetchPageData(params.id))
})
```

<details>
<summary>The decorator also receives an optional `options` argument (advanced topic)</summary>

```js
@preload(async () => { ... }, options)
```

The available options are:

* `blocking` — (defaults to `false`) If `true` then child `<Route/>`'s  `@preload()`s will wait for this `@preload()` to finish in order to get executed.

* `blockingSibling` — (defaults to `false`) If `true` then all further adjacent (sibling) `@preload()`s for the same `<Route/>`'s component will wait for this `@preload()` to finish in order to get executed.

* `client` — (defaults to `false`) If `true` then the `@preload()` will be executed only on client side. If `false` then this `@preload()` will be executed normally: if part of initial page preloading then on server side and if part of subsequent preloading (e.g. navigation) then on client side.

* `server` — (defaults to `false`) If `true` then the `@preload()` will be executed only on server side. If `false` then this `@preload()` will be executed normally: if part of initial page preloading then on server side and if part of subsequent preloading (e.g. navigation) then on client side.
</details>

####

Note: `transform-decorators-legacy` Babel plugin is needed at the moment to make decorators work with Babel:

```sh
npm install babel-plugin-transform-decorators-legacy --save
```

#### .babelrc

```js
{
  ...
  "plugins": [
    "transform-decorators-legacy",
    ...
  ]
}
```

On the client side, in order for `@preload` to work all `<Link/>`s imported from `react-router` **must** be instead imported from `react-website`. Upon a click on a `<Link/>` first it waits for the next page to preload, and then, when the next page is fully loaded, `react-router` navigation itself takes place.

<details>
<summary>`@preload` also works for Back/Forward navigation. To disable page `@preload` on Back navigation pass `instantBack` property to a `<Link/>`.</summary>

For example, consider a search results page preloading some data (could be search results themselves, could be anything else unrelated). A user navigates to this page, waits for `@preload` to finish and then sees a list of items. Without `instantBack` if the user clicks on an item he's taken to the item's page. Then the user clicks "Back" and is taken back to the search results page but has to wait for that `@preload` again. With `instantBack` though the "Back" transition occurs instantly without having to wait for that `@preload` again. Same goes then for the reverse "Forward" navigation from the search results page back to the item's page, but that's just a small complementary feature. The main benefit is the instantaneous "Back" navigation creating a much better UX where a user can freely explore a list of results without getting penalized for it with a waiting period on each click.

```js
@preload(async () => await fetchSomeData())
class SearchResultsPage extends Component {
  render() {
    return (
      <ul>
        { results.map((item) => (
          <li>
            <Link to="/items/{item.id}" instantBack>
              {item.name}
            </Link>
          </li>
        ))) }
      </ul>
    )
  }
}
```

One can also use the exported `wasInstantNavigation()` function (on client side) to find out if the current page was navigated to "instantly". This can be used, for example, for Algolia "Instant Search" component to reset cached search results if it's not an instant "Back" navigation.
</details>

## `@preload()` indicator

Sometimes preloading a page can take some time so one may want to (and actually should) add some kind of a "spinner" to inform the user that the application isn't frozen and that the navigation process needs some more time to finish. This can be achieved by adding the built-in `<Loading/>` component on a page:

```javascript
import { Loading } from 'react-website'
// Using Webpack CSS loader
import 'react-website/components/Loading.css'
import 'react-website/components/LoadingIndicator.css'

export default function Application() {
  return (
    <div>
      ....
      <Loading/>
    </div>
  )
}
```

The `<Loading/>` component takes an optional `indicator` property which can be a React component accepting a `className` property and which is a white circular spinner by default.

## Asynchronous actions

Implementing synchronous actions in Redux is straightforward. But what about asynchronous actions like HTTP requests? Redux itself doesn't provide any built-in solution for that leaving it to 3rd party middlewares. Therefore this library provides one.

### Pure Promises

This is the lowest-level approach to asynchronous actions. It is described here just for academic purposes and most likely won't be used directly in any app.

If a Redux "action creator" returns an object with a `promise` (function) and `events` (array) then `dispatch()`ing such an action results in the following steps:

 * An event of `type = events[0]` is dispatched
 * `promise` function gets called and returns a `Promise`
 * If the `Promise` succeeds then an event of `type = events[1]` is dispatched having `result` property set to the `Promise` result
 * If the `Promise` fails then an event of `type = events[2]` is dispatched having `error` property set to the `Promise` error

```js
function asynchronousAction() {
  return {
    promise: () => Promise.resolve({ success: true }),
    events: ['PROMISE_PENDING', 'PROMISE_SUCCESS', 'PROMISE_ERROR']
  }
}
```

`dispatch(asynchronousAction())` call returns the `Promise` itself:

```js
@preload(async ({ dispatch }) => {
  await dispatch(asynchronousAction())
})
```

### HTTP utility

Because in almost all cases dispatching an "asynchronous action" means "making an HTTP request", the `promise` function described above always takes an `http` argument: `promise: http => ...`.

The `http` utility has the following methods:

* `head`
* `get`
* `post`
* `put`
* `patch`
* `delete`

Each of these methods returns a `Promise` and takes three arguments:

* the `url` of the HTTP request
* `data` object (e.g. HTTP GET `query` or HTTP POST `body`)
* `options` (described further)

So, API endpoints can be queried using `http` and ES6 `async/await` syntax like so:

```js
function fetchFriends(personId, gender) {
  return {
    promise: http => http.get(`/api/person/${personId}/friends`, { gender }),
    events: ['GET_FRIENDS_PENDING', 'GET_FRIENDS_SUCCESS', 'GET_FRIENDS_FAILURE']
  }
}
```

####

The possible `options` (the third argument of all `http` methods) are

  * `headers` — HTTP Headers JSON object.
  * `authentication` — Set to `false` to disable sending the authentication token as part of the HTTP request. Set to a String to pass it as an `Authorization: Bearer ${token}` token (no need to supply the token explicitly for every `http` method call, it is supposed to be set globally, see below).
  * `progress(percent, event)` — Use for tracking HTTP request progress (e.g. file upload).
  * `onResponseHeaders(headers)` – Use for examining HTTP response headers (e.g. [Amazon S3](http://docs.aws.amazon.com/AmazonS3/latest/API/RESTObjectPUT.html#RESTObjectPUT-responses-response-headers) file upload).

<!--
`http` utility is also available from anywhere on the client side via an exported `getHttpClient()` function (e.g. for bootstrapping).
-->

### Redux module

Once one starts writing a lot of `promise`/`http` Redux actions it becomes obvious that there's a lot of copy-pasting and verbosity involved. To reduce those tremendous amounts of copy-pasta "redux module" tool may be used which:

* Gives access to `http`.
* Autogenerates Redux action status events (`${actionName}_PENDING`, `${actionName}_SUCCESS`, `${actionName}_ERROR`).
* Automatically adds Redux reducers for the action status events.
* Automatically populates the corresponding action status properties (`${actionName}Pending`: `true`/`false`, `${actionName}Error: Error`) in Redux state.

For example, the `fetchFriends()` action from the previous section can be rewritten as:

Before:

```js
// ./actions/friends.js
function fetchFriends(personId, gender) {
  return {
    promise: http => http.get(`/api/person/${personId}/friends`, { gender }),
    events: ['FETCH_FRIENDS_PENDING', 'FETCH_FRIENDS_SUCCESS', 'FETCH_FRIENDS_FAILURE']
  }
}

// ./reducers/friends.js
export default function(state = {}, action = {}) {
  switch (action.type) {
    case 'FETCH_FRIENDS_PENDING':
      return {
        ...state,
        fetchFriendsPending: true,
        fetchFriendsError: null
      }
    case 'FETCH_FRIENDS_SUCCESS':
      return {
        ...state,
        fetchFriendsPending: false,
        friends: action.value
      }
    case 'FETCH_FRIENDS_ERROR':
      return {
        ...state,
        fetchFriendsPending: false,
        fetchFriendsError: action.error
      }
    default
      return state
  }
}
```

After:

```js
import { ReduxModule } from 'react-website'

const redux = new ReduxModule('FRIENDS')

export const fetchFriends = redux.action(
  'FETCH_FRIENDS',
  (personId, gender) => http => {
    return http.get(`/api/person/${personId}/friends`, { gender })
  },
  // The fetched friends list will be placed
  // into the `friends` Redux state property.
  'friends'
  //
  // Or write it like this:
  // { friends: result => result }
  //
  // Or write it as a Redux reducer:
  // (state, result) => ({ ...state, friends: result })
)

// This is the Redux reducer which now
// handles the asynchronous action defined above.
export default redux.reducer()
```

Much cleaner.

Also, when the namespace or the action name argument is omitted it is autogenerated, so this

```js
const redux = new ReduxModule('FRIENDS')
...
redux.action('FETCH_ITEM', id => http => http.get(`/items/${id}`), 'item')
```

could be written as

```js
const redux = new ReduxModule()
...
redux.action(id => http => http.get(`/items/${id}`), 'item')
```

and in this case `redux` will autogenerate the namespace and the action name, something like `REACT_WEBSITE_12345` and `REACT_WEBSITE_ACTION_12345`.

<!--
<details>
<summary>
  There's a single rare use-case though when Redux action name autogeneration doesn't work.
</summary>

####

Sometimes modules for one project are imported from another project, and both these projects have their own `node_modules` installed. For example, one project could import Redux actions from another project. Because these two projects have their own `node_modules` they import each their own `ReduxModule` and each of those `ReduxModule`s starts its autogenerated action `type` counter from `1` which means that the `type`s of Redux actions imported from one project will collide with the `type`s of Redux actions created in the other project resulting in weird behavior. To prevent such autogenerated Redux action `type` collision one should pass a unique `namespace` argument for each `ReduxModule` so that their autogenerated action `type`s don't ever collide due to being prefixed with the `namespace`. If there's an autogenerated Redux action `type` collision then the library will detect it and throw an error at startup.
</details>

####
-->

<details>
<summary>
  Here's a more complex example: a comments section for a blog post page.
</summary>

#### redux/blogPost.js

```js
import { ReduxModule } from 'react-website'

const redux = new ReduxModule('BLOG_POST')

// Post comment Redux "action creator"
export const postComment = redux.action(
  // 'POST_COMMENT',
  (userId, blogPostId, commentText) => async http => {
    // The original action call looks like:
    // `dispatch(postComment(1, 12345, 'bump'))`
    return await http.post(`/blog/posts/${blogPostId}/comment`, {
      userId: userId,
      text: commentText
    })
  }
)

// Get comments Redux "action creator"
export const getComments = redux.action(
  // 'GET_COMMENTS',
  (blogPostId) => async http => {
    return await http.get(`/blog/posts/${blogPostId}/comments`)
  },
  // The fetched comments will be placed
  // into the `comments` Redux state property.
  'comments'
  //
  // Or write it like this:
  // { comments: result => result }
  //
  // Or write it as a Redux reducer:
  // (state, result) => ({ ...state, comments: result })
)

// A developer can listen to any event.
// If two string arguments are passed
// then the first one is namespace
// and the second one is the event name
// and the listener will be called "on success".
// If only one string argument is passed
// then it is a raw Redux `action.type`.
redux.on('BLOG_POST', 'CUSTOM_EVENT', (state, action) => ({
  ...state,
  reduxStateProperty: action.value
}))

// This is the Redux reducer which now
// handles the asynchronous actions defined above
// (and also the `handler.on()` events).
// Export it as part of the "main" reducer.
export default redux.reducer()
```

#### redux/index.js

```js
// The "main" reducer composed of various reducers.
export { default as blogPost } from './blogPost'
...
```

The React Component would look like this

```js
import React, { Component } from 'react'
import { connect } from 'react-redux'
import { preload } from 'react-website'
import { connectComments, getComments, postComment } from './redux/blogPost'

// Preload comments before showing the page
// (see "Page preloading" section of this document)
@preload(async ({ dispatch, params }) => {
  // `params` are the URL parameters populated by `react-router`:
  // `<Route path="/blog/:blogPostId"/>`.
  await dispatch(getComments(params.blogPostId))
})
// See `react-redux` documentation on `@connect()` decorator
@connect((state) => ({
  userId: state.user.id,
  comments: state.blogPost.comments
}), {
  postComment
})
export default class BlogPostPage extends Component {
  render() {
    const {
      comments
    } = this.props

    return (
      <div>
        <ul>
          { comments.map(comment => <li>{comment}</li>) }
        </ul>
        {this.renderPostCommentForm()}
      </div>
    )
  }

  renderPostCommentForm() {
    // `params` are the URL parameters:
    // `<Route path="/blog/:blogPostId"/>`.
    const {
      userId,
      params,
      postComment
    } = this.props

    return (
      <button onClick={() => postComment(userId, params.blogPostId, 'text')}>
        Post comment
      </button>
    )
  }
}
```
</details>

####

Redux module can also handle synchronous actions along with asynchronous ones, should the need arise.

<details>
<summary>See how</summary>

```js
import { ReduxModule } from 'react-website'

const redux = new ReduxModule('NOTIFICATIONS')

// Displays a notification.
//
// The Redux "action" creator is gonna be:
//
// function(text) {
//   return {
//     type    : 'NOTIFICATIONS:NOTIFY',
//     message : formatMessage(text)
//   }
// }
//
// And the corresponding reducer is gonna be:
//
// case 'NOTIFICATIONS:NOTIFY':
//   return {
//     ...state,
//     message: action.message
//   }
//
// Call it as `dispatch(notify(text))`.
//
export const notify = redux.simpleAction(
  // (optional) Redux event name.
  'NOTIFY',
  // The Redux reducer:
  (state, message) => ({ ...state, message }),
  // The Redux reducer above could be also defined as:
  // 'message'
)

// This is the Redux reducer which now
// handles the actions defined above.
export default redux.reducer()
```

```js
notify('Test')
```
</details>

### HTTP authentication

In order for `http` utility to send an authentication token as part of an HTTP request (the `Authorization: Bearer ${token}` HTTP header) the `authentication.accessToken()` function must be specified in `react-website.js`.

```js
{
  authentication: {
    accessToken({ getState, getCookie }) {
      return localStorage.getItem('accessToken')
      return getCookie('accessToken')
      return getState().authentication.accessToken
    }
  }
}
```

<details>
<summary>Protecting the access token from being leaked to a 3rd party</summary>

####

```js
{
  authentication: {
    accessToken({ getState, url, requestedURL, getCookie }) {
      // It's recommended to check the URL to make sure that the access token
      // is not leaked to a third party: only send it to your own servers.
      //
      // When supplying `transformURL()` parameter function the `requestedURL`
      // parameter is the originally requested URL (for example, `/users/123`)
      // and `url` is the result of calling `transformURL(requestedURL)`.
      //
      // When not supplying `transformURL()` parameter function
      // `requestedURL` and `url` are the same.
      //
      if (url.indexOf('https://my.api.com/') === 0) {
        return localStorage.getItem('accessToken')
        return getCookie('accessToken')
        return getState().authentication.accessToken
      }
    }
  }
}
```
</details>

####

<details>
<summary>Authentication and authorization using access tokens</summary>

#####

The `accessToken` is initially obtained when a user signs in: the web browser sends HTTP POST request to `/sign-in` API endpoint with `{ email, password }` parameters and gets `{ userInfo, accessToken }` as a response, which is then stored in `localStorage` (or in Redux `state`, or in a `cookie`) and all subsequent HTTP requests use that `accessToken` to call the API endpoints. The `accessToken` itself is usually a [JSON Web Token](https://jwt.io/introduction/) signed on the server side and holding the list of the user's priviliges ("roles"). Hence authentication and authorization are completely covered. [Refresh tokens](https://auth0.com/blog/refresh-tokens-what-are-they-and-when-to-use-them/) are also supported.

This kind of an authentication and authorization scheme is self-sufficient and doesn't require "restricting" any routes: if a route's `@preload()` uses `http` utility for querying an API endpoint then this API endpoint must check if the user is signed in and if the user has the necessary priviliges. If yes then the route is displayed. If not then the user is redirected to either a "Sign In Required" page or "Access Denied" page.

A real-world (advanced) example for handling "Unauthenticated"/"Unauthorized" errors happening in `@preload()`s and during `http` calls:

#### ./react-website.js

```js
{
  ...,
  onError(error, { path, url, redirect, getState, server }) {
    // Not authenticated
    if (error.status === 401) {
      return handleUnauthenticatedError(error, url, redirect);
    }
    // Not authorized
    if (error.status === 403) {
      return redirect('/unauthorized');
    }
    // Not found
    if (error.status === 404) {
      return redirect('/not-found');
    }
    // Redirect to a generic error page in production
    if (process.env.NODE_ENV === 'production') {
      // Prevents infinite redirect to the error page
      // in case of overall page rendering bugs, etc.
      if (path !== '/error') {
        // Redirect to a generic error page
        return redirect(`/error?url=${encodeURIComponent(url)}`);
      }
    } else {
      // Report the error
      console.error(`Error while preloading "${url}"`);
      console.error(error);
    }
  },
  http: {
    onError(error, { path, url, redirect, dispatch, getState }) {
      // JWT token expired, the user needs to relogin.
      if (error.status === 401) {
        return handleUnauthenticatedError(error, url, redirect);
      }
    },
    ...
  }
}

function handleUnauthenticatedError(error, url, redirect) {
  // Prevent double redirection to `/unauthenticated`.
  // (e.g. when two parallel `Promise`s load inside `@preload()`
  //  and both get Status 401 HTTP Response)
  if (typeof window !== 'undefined' && window.location.pathname === '/unauthenticated') {
    return;
  }
  let unauthenticatedURL = '/unauthenticated';
  let parametersDelimiter = '?';
  if (url !== '/') {
    unauthenticatedURL += `${parametersDelimiter}url=${encodeURIComponent(url)}`;
    parametersDelimiter = '&';
  }
  switch (error.message) {
    case 'TokenExpiredError':
      return redirect(`${unauthenticatedURL}${parametersDelimiter}expired=✔`);
    case 'AuthenticationError':
      return redirect(`${unauthenticatedURL}`);
    default:
      return redirect(unauthenticatedURL);
  }
}
```
</details>

### HTTP request URLs

<details>
<summary>When sending HTTP requests to API using the <code>http</code> utility it is recommended to set up <code>http.transformURL(url)</code> configuration setting to make the code a bit cleaner.</summary>

#####

Before:

```js
// Actions.

export const getUser = redux.action(
  (id) => http => http.get(`https://my-api.cloud-provider.com/users/${id}`),
  'user'
)

export const updateUser = redux.action(
  (id, values) => http => http.put(`https://my-api.cloud-provider.com/users/${id}`, values)
)
```

After:

```js
// Actions.

export const getUser = redux.action(
  (id) => http => http.get(`api://users/${id}`),
  'user'
)

export const updateUser = redux.action(
  (id, values) => http => http.put(`api://users/${id}`, values)
)

// Settings.

{
  ...
  http: {
    transformURL: (url) => `https://my-api.cloud-provider.com/${url.slice('api://'.length)}`
  }
}
```
</details>

### File upload

The `http` utility will also upload files if they're passed as part of `data` (see example below). The files passed inside `data` must have one of the following types:

* In case of a [`File`](https://developer.mozilla.org/en-US/docs/Web/API/File) it will be a single file upload.
* In case of a [`FileList`](https://developer.mozilla.org/en-US/docs/Web/API/FileList) with a single `File` inside it would be treated as a single `File`.
* In case of a `FileList` with multiple `File`s inside a multiple file upload will be performed.
* In case of an `<input type="file"/>` DOM element all its `.files` will be taken as a `FileList` parameter.

File upload progress can be metered by passing `progress` option as part of the `options` .

<details>
<summary>See example</summary>

```js
// React component
class ItemPage extends React.Component {
  render() {
    return (
      <div>
        ...
        <input type="file" onChange={this.onFileSelected}/>
      </div>
    )
  }

  // Make sure to `.bind()` this handler
  onFileSelected(event) {
    const file = event.target.files[0]

    // Could also pass just `event.target.files` as `file`
    dispatch(uploadItemPhoto(itemId, file))

    // Reset the selected file
    // so that onChange would trigger again
    // even with the same file.
    event.target.value = null
  }
}

// Redux action creator
function uploadItemPhoto(itemId, file) {
  return {
    promise: http => http.post(
      '/item/photo',
      { itemId, file },
      { progress(percent) { console.log(percent) } }
    ),
    events: ['UPLOAD_ITEM_PHOTO_PENDING', 'UPLOAD_ITEM_PHOTO_SUCCESS', 'UPLOAD_ITEM_PHOTO_FAILURE']
  }
}
```
</details>

### JSON Date parsing

By default, when using `http` utility all JSON responses get parsed for javascript `Date`s which are then automatically converted from `String`s to `Date`s. This is convenient, and also safe because such date `String`s have to be in a very specific ISO format in order to get parsed (`year-month-dayThours:minutes:seconds[timezone]`, e.g. `2017-12-22T23:03:48.912Z`), but if someone still prefers to disable this feature and have their stringified dates untouched then there's the `parseDates: false` flag in the configuration to opt-out of this feature.

## Snapshotting

Server-Side Rendering is good for search engine indexing but it's also heavy on CPU not to mention the bother of setting up a Node.js server itself and keeping it running.

In many cases data on a website is "static" (doesn't change between redeployments), e.g. a personal blog or a portfolio website, so in these cases it will be beneficial (much cheaper and faster) to host a statically generated version a website on a CDN as opposed to hosting a Node.js application just for the purpose of real-time webpage rendering. In such cases one should generate a static version of the website by snapshotting it on a local machine and then host the snapshotted pages in a cloud (e.g. Amazon S3) for a very low price.

<details>
<summary>Snapshotting instructions</summary>

First run the website in production mode (for example, on `localhost`).

Then run the following Node.js script which is gonna snapshot the currently running website and put it in a folder which can then be hosted anywhere.

```sh
# If the website will be hosted on Amazon S3
npm install s3 --save
```

```js
import path from 'path'

import {
  // Snapshots website pages.
  snapshot,
  // Uploads files.
  upload,
  // Uploads files to Amazon S3.
  S3Uploader,
  // Copies files/folders into files/folders.
  // Same as Linux `cp [from] [to]`.
  copy,
  // Downloads data from a URL into an object
  // of shape `{ status: Number, content: String }`.
  download
} from 'react-website/static-site-generator'

import configuration from '../configuration'

// Temporary generated files path.
const generatedSitePath = path.resolve(__dirname, '../static-site')

async function run() {
  // Snapshot the website.
  await snapshot({
    // The host and port on which the website
    // is currently running in production mode.
    // E.g. `localhost` and `3000`.
    host: configuration.host,
    port: configuration.port,
    pages: await generatePageList(),
    outputPath: generatedSitePath
  })

  // Copy assets (built by Webpack).
  await copy(path.resolve(__dirname, '../build/assets'), path.resolve(generatedSitePath, 'assets'))
  await copy(path.resolve(__dirname, '../robots.txt'), path.resolve(generatedSitePath, 'robots.txt'))

  // Upload the website to an Amazon S3 bucket.
  await upload(generatedSitePath, S3Uploader({
    // Setting an `ACL` for the files being uploaded is optional.
    // Alternatively a bucket-wide policy could be set up instead:
    //
    // {
    //   "Version": "2012-10-17",
    //   "Statement": [{
    //     "Sid": "AddPerm",
    //     "Effect": "Allow",
    //     "Principal": "*",
    //     "Action": "s3:GetObject",
    //     "Resource": "arn:aws:s3:::[bucket-name]/*"
    //   }]
    // }
    //
    // If not setting a bucket-wide policy then the ACL for the
    // bucket itself should also have "List objects" set to "Yes",
    // otherwise the website would return "403 Forbidden" error.
    //
    ACL: 'public-read',
    bucket: confiugration.s3.bucket,
    accessKeyId: configuration.s3.accessKeyId,
    secretAccessKey: configuration.s3.secretAccessKey,
    region: configuration.s3.region
  }))

  console.log('Done');
}

run().catch((error) => {
  console.error(error)
  process.exit(1)
})

// Get the list of all page URLs.
async function generatePageList() {
  const pages = [
    '/',
    '/about',
    // Error pages need a `status` property
    // to indicate that it shouldn't throw on such errors
    // and should proceed with snapshotting the next pages.
    { url: '/unauthenticated', status: 401 },
    { url: '/unauthorized', status: 403 },
    { url: '/not-found', status: 404 },
    { url: '/error', status: 500 }
  ]

  // (optional) Add some dynamic page URLs, like `/items/123`.

  // Query the database for the list of items.
  const { status, content } = JSON.parse(await download(`https://example.com/api/items`))

  if (status !== 200) {
    throw new Error('Couldn\'t load items')
  }

  // Add item page URLs.
  const items = JSON.parse(content)
  return pages.concat(items.map(item => `/items/${item.id}`))
}
```

The `snapshot()` function snapshots the list of `pages` to `.html` files and then the `upload()` function uploads them to the cloud (in this case to Amazon S3). The `snapshot()` function also snapshots a special `base.html` page which is an empty page that should be used as the "fallback", i.e. the cloud should respond with `base.html` file contents when the file for the requested URL is not found: in this case `base.html` will see the current URL and perform all the routing neccessary on the client side to show the correct page. If the `snapshot()` function isn't passed the list of `pages` to snapshot (e.g. if `pages` argument is `null` or `undefined`) then it will only snapshot `base.html`. The static website will work with just `base.html`, the only point of snapshotting other pages is for Google indexing.
</details>

####

The snapshotting approach works not only for classical web "documents" (a blog, a book, a portfolio, a showcase) but also for dynamic applications. Consider an online education portal where users (students) can search for online courses and the prices are different for each user (student) based on their institution. Now, an online course description itself is static (must be indexed by Google) and the actual course price is dynamic (must not be indexed by Google).

<details>
<summary>The solution is to add two <code>@preload()</code>s for the course page: one for static data (which runs while snapshotting) and another for dynamic data (which runs only in a user's web browser).</summary>

```js
import React, { Component } from 'react'
import { preload } from 'react-website'

@preload(async ({ dispatch }) => await dispatch(loadCourseInfo()))
@preload(async ({ dispatch }) => await dispatch(loadCoursePrice()), { client: true })
export default class Course extends Component {
  ...
}
```

In this example `loadCourseInfo()` will be executed while snapshotting and therefore course info will be present on the snapshotted page. But course price won't be present on the snapshotted page because it's being loaded inside `@preload(..., { client: true })` which only gets called in a user's web browser. When a user opens the course page in his web browser it will show the snapshotted page with course info with a "loading" spinner on top of it as it is loading the course price. After the course price has been loaded the "loading" spinner disappears and the user sees the fully rendered course page.

</details>

## Page HTTP response status code

To set a custom HTTP response status code for a specific route set the `status` property of that `<Route/>`.

```javascript
export default (
  <Route path="/" Component={Layout}>
    <Route Component={Home}/>
    <Route path="blog"  Component={Blog}/>
    <Route path="about" Component={About}/>
    <Route path="*"     Component={PageNotFound} status={404}/>
  </Route>
)
```

### Setting <title/> and <meta/> tags

Use `@meta(state) => ...)` decorator for adding `<title/>` and `<meta/>` tags:

```js
import { meta } from 'react-website'

@meta(state) => ({
  // `<meta property="og:site_name" .../>`
  site_name: 'International Bodybuilders Club',

  // Webpage `<title/>` will be replaced with this one
  // and also `<meta property="og:title" .../>` will be added.
  title: `${state.user.name}`,

  // `<meta property="og:description" .../>`
  description: 'Muscles',

  // `<meta property="og:image" .../>`
  // https://iamturns.com/open-graph-image-size/
  image: 'https://cdn.google.com/logo.png',

  // Objects are expanded.
  //
  // `<meta property="og:image" content="https://cdn.google.com/logo.png"/>`
  // `<meta property="og:image:width" content="100"/>`
  // `<meta property="og:image:height" content="100"/>`
  // `<meta property="og:image:type" content="image/png"/>`
  //
  image: {
    _: 'https://cdn.google.com/logo.png',
    width: 100,
    height: 100,
    type: 'image/png'
  },

  // Arrays are expanded (including arrays of objects).
  image: [{...}, {...}, ...],

  // `<meta property="og:audio" .../>`
  audio: '...',

  // `<meta property="og:video" .../>`
  video: '...',

  // `<meta property="og:locale" content="ru_RU"/>`
  locale: state.user.locale,

  // `<meta property="og:locale:alternate" content="en_US"/>`
  // `<meta property="og:locale:alternate" content="fr_FR"/>`
  locales: ['ru_RU', 'en_US', 'fr_FR'],

  // `<meta property="og:url" .../>`
  url: 'https://google.com/',

  // `<meta property="og:type" .../>`
  type: 'profile',

  // `<meta charset="utf-8"/>` tag is added automatically.
  // The default "utf-8" encoding can be changed
  // by passing custom `charset` parameter.
  charset: 'utf-16',

  // `<meta name="viewport" content="width=device-width, initial-scale=1.0"/>`
  // tag is added automatically
  // (prevents downscaling on mobile devices).
  // This default behaviour can be changed
  // by passing custom `viewport` parameter.
  viewport: '...',

  // All other properties will be transformed directly to
  // either `<meta property="{property_name}" content="{property_value}/>`
  // or `<meta name="{property_name}" content="{property_value}/>`
}))
export default class Page extends React.Component {
  ...
}
```

`@meta()` decorator discards all other `<meta/>` set by any other means, e.g. if there are any `<meta/>` tags in `index.html` template then all of them will be dicarded if using `@meta()` decorator so don't mix `@meta()` decorator with `<meta/>` tags inserted manually into `index.html`.

To set default `<meta/>` (for example, `og:site_name`, `og:description`, `og:locale`) define `meta` property in `react-website.js` settings file:

```js
{
  routes: ...,
  reducers: ...,
  meta: {
    site_name: 'WebSite',
    description: 'A generic web application',
    locale: 'en_US'
  }
}
```

### Get current location

Inside `@preload()`: use the `location` parameter.

Anywhere in a React component: use the `found` property in Redux state.

```js
@connect(({ found }) => ({
  location: found.resolvedMatch.location,
  params: found.resolvedMatch.params
}))
```

### Changing current location

Dispatch `goto`/`redirect` Redux action to change current location (both on client and server).

```javascript
import { goto, redirect } from 'react-website'
import { connect } from 'react-redux'

// Usage example
// (`goto` navigates to a URL while adding a new entry in browsing history,
//  `redirect` does the same replacing the current entry in browsing history)
@connect(state = {}, { goto, redirect })
class Page extends Component {
  handleClick(event) {
    const { goto, redirect } = this.props
    goto('/items/1?color=red')
    // redirect('/somewhere')
  }
}
```

<!--
Advanced: `goto()` can also take `{ instantBack: true }` option.
-->

If the current location needs to be changed while still staying at the same page (e.g. a checkbox has been ticked and the corresponding URL query parameter must be added), then use `dispatch(pushLocation(location))` or `dispatch(replaceLocation(location))` Redux actions.

```javascript
import { pushLocation, replaceLocation } from 'react-website'

@connect(() => ({
  ...
}), {
  pushLocation
})
class Page extends Component {
  onSearch(query) {
    const { pushLocation } = this.props

    pushLocation({
      pathname: '/'
      query: {
        query
      }
    })
  }
}
```

To go "Back"

```javascript
import { goBack } from 'react-website'

@connect(() => ({
  ...
}), {
  goBack
})
class Page extends Component {
  render() {
    const { goBack } = this.props

    return (
      <button onClick={goBack}>
        Back
      </button>
    )
  }
}
```

If someone prefers interacting with found router directly instead then it is available on all pages as a `router` property, or via @withRouter decorator.

```js
import React from 'react'
import { withRouter } from 'found'

@withRouter
export default class Component extends React.Component {
  render() {
    const { router } = this.props
    ...
  }
}
```

## Monitoring

For each page being rendered stats are reported if `stats()` parameter is passed as part of the rendering service settings.

```js
{
  ...

  stats({ url, route, time: { preload } }) {
    if (preload > 1000) { // in milliseconds
      db.query('insert into server_side_rendering_stats ...')
    }
  }
}
```

The arguments for the `stats()` function are:

 * `url` — The requested URL (without the `protocol://host:port` part)
 * `route` — The route path (e.g. `/user/:userId/post/:postId`)
 * `time.preload` — The time for executing all `@preload()`s.
 <!--
 `time.preloadAndRender` — (client side only) The time for executing all `@preload()`s. On client side `@preload()`s not only preload the page, they also perform page rendering when "success" Redux action is dispatched. So it's not just the time to load page data, it's also the time to render the data.
 -->

Rendering a complex React page (having more than 1000 components) takes about 30ms (as of 2017).

<details>
<summary>One could also set up overall Server Side Rendering performance monitoring using, for example, <a href="http://docs.datadoghq.com/guides/dogstatsd/">StatsD</a></summary>

```js
{
  ...

  stats({ url, route, time: { initialize, preload, total } }) {
    statsd.increment('count')

    statsd.timing('initialize', initialize)
    statsd.timing('@preload()', preload)
    statsd.timing('total', total)

    if (total > 1000) { // in milliseconds
      db.query('insert into server_side_rendering_stats ...')
    }
  }
}
```

Where the metrics collected are

 * `count` — rendered pages count
 * `initialize` — server side `initialize()` function execution time (if defined)
 * `preload` — page preload time
 * `time` - total time spent preloading and rendering the page

Speaking of StatsD itself, one could either install the conventional StatsD + Graphite bundle or, for example, use something like [Telegraf](https://github.com/influxdata/telegraf) + [InfluxDB](https://www.influxdata.com/) + [Grafana](http://grafana.org/).

Telegraf starter example:

```sh
# Install Telegraf (macOS).
brew install telegraf
# Generate Telegraf config.
telegraf -input-filter statsd -output-filter file config > telegraf.conf
# Run Telegraf.
telegraf -config telegraf.conf
# Request a webpage and see rendering stats being output to the terminal.
```
</details>

## Webpack HMR

Webpack's [Hot Module Replacement](https://webpack.github.io/docs/hot-module-replacement.html) (aka Hot Reload) works for React components and Redux reducers and Redux action creators (it just doesn't work for page `@preload()`s).

HMR setup for Redux reducers is as simple as adding `store.hotReload()` (as shown below). For enabling [HMR on React Components](https://webpack.js.org/guides/hmr-react/) (and Redux action creators) use [react-hot-loader](https://github.com/gaearon/react-hot-loader):

#### application.js

```js
import { render } from 'react-website'
import settings from './react-website'

render(settings).then(({ store, rerender }) => {
  if (module.hot) {
    module.hot.accept('./react-website', () => {
      rerender()
      // Update reducer
      store.hotReload(settings.reducers)
    })
  }
})
```

#### Container.js

```js
import React from 'react'
import { Provider } from 'react-redux'
import { hot } from 'react-hot-loader'

function Container({ store, children }) {
  return (
    <Provider store={ store }>
      { children }
    </Provider>
  )
}

export default hot(module)(Container)
```

#### .babelrc

```js
{
  "presets": [
    "react",
    ["env", { modules: false }],
  ],

  "plugins": [
    // `react-hot-loader` Babel plugin
    "react-hot-loader/babel"
  ]
}
```

#### ./src/index.js

```js
// An ES6 polyfill is required for `react-hot-loader`.
require('babel-polyfill')
...
```

Then start [`webpack-dev-server`](https://github.com/webpack/webpack-dev-server) or [`webpack-serve`](https://github.com/webpack-contrib/webpack-serve) with `--hot` option.

## WebSocket

`websocket()` helper sets up a WebSocket connection.

```js
import { render } from 'react-website'
import websocket from 'react-website/websocket'

render(settings).then(({ store }) => {
  websocket({
    host: 'localhost',
    port: 80,
    // secure: true,
    store,
    token: localStorage.getItem('token')
  })
})
```

If `token` parameter is specified then it will be sent as part of every message (providing support for user authentication).

<details>
<summary>How to use WebSocket</summary>

WebSocket will autoreconnect (with ["exponential backoff"](https://en.wikipedia.org/wiki/Exponential_backoff)) emitting `open` event every time it does.

After the `websocket()` call a global `websocket` variable is created exposing the following methods:

 * `listen(eventName, function(event, store))`
 * `onOpen(function(event, store))` – is called on `open` event
 * `onClose(function(event, store))` – is called on `close` event
 * `onError(function(event, store))` – is called on `error` event (`close` event always follows the corresponding `error` event)
 * `onMessage(function(message, store))`
 * `send(message)`
 * `close()`

The `store` argument can be used to `dispatch()` Redux "actions".

```js
websocket.onMessage((message, store) => {
  if (message.command) {
    switch (message.command) {
      case 'initialized':
        store.dispatch(connected())
        return console.log('Realtime service connected', message)
      case 'notification':
        return alert(message.text)
      default:
        return console.log('Unknown message type', message)
    }
  }
})

websocket.onOpen((event, store) => {
  websocket.send({ command: 'initialize' })
})

websocket.onClose((event, store) => {
  store.dispatch(disconnected())
})
```

The global `websocket` object also exposes the `socket` property which is the underlying [`robust-websocket`](https://github.com/appuri/robust-websocket) object (for advanced use cases).

As for the server-side counterpart I can recommend using [`uWebSockets`](https://github.com/uWebSockets/uWebSockets)

```js
import WebSocket from 'uws'

const server = new WebSocket.Server({ port: 8888 })

const userConnections = {}

server.on('connection', (socket) => {
  console.log('Incoming WebSocket connection')

  socket.sendMessage = (message) => socket.send(JSON.stringify(message))

  socket.on('close', async () => {
    console.log('Client disconnected')

    if (socket.userId) {
      userConnections[socket.userId].remove(socket)
    }
  })

  socket.on('message', async (message) => {
    try {
      message = JSON.parse(message)
    } catch (error) {
      return console.error(error)
    }

    try {
      switch (message.command) {
        case 'initialize':
          // If a user connected (not a guest)
          // then store `userId` for push notifications.
          // Using an authentication token here
          // instead of simply taking `userId` out of the `message`
          // because the input can't be trusted (could be a hacker).
          if (message.userAuthenticationToken) {
            // (make sure `socket.userId` is a `String`)
            // The token could be a JWT token (jwt.io)
            // and `authenticateUserByToken` function could
            // check the token's authenticity (by verifying its signature)
            // and then extract `userId` out of the token payload.
            socket.userId = authenticateUserByToken(message.userAuthenticationToken)

            if (!userConnections[socket.userId]) {
              userConnections[socket.userId] = []
            }

            userConnections[socket.userId].push(socket)
          }

          return socket.sendMessage({
            command: 'initialized',
            data: ...
          })

        default:
          return socket.sendMessage({
            status: 404,
            error: `Unknown command: ${message.command}`
          })
      }
    } catch (error) {
      console.error(error)
    }
  })
})

server.on('error', (error) => {
  console.error(error)
})

// Also an HTTP server is started and a REST API endpoint is exposed
// which can be used for pushing notifications to clients via WebSocket.
// The HTTP server must only be accessible from the inside
// (i.e. not listening on an external IP address, not proxied to)
// otherwise an attacker could push any notifications to all users.
// Therefore, only WebSocket connections should be proxied (e.g. using NginX).
httpServer().handle('POST', '/notification', ({ to, text }) => {
  if (userConnections[to]) {
    for (const socket of userConnections[to]) {
      socket.sendMessage({
        command: 'notification',
        text
      })
    }
  }
})
```

Feature: upon receiving a `message` (on the client side) having a `type` property defined such a `message` is `dispatch()`ed as a Redux "action" (this can be disabled via `autoDispatch` option). For example, if `{ type: 'PRIVATE_MESSAGE', content: 'Testing', from: 123 }` is received on a websocket connection then it is automatically `dispatch()`ed as a Redux "action". Therefore, the above example could be rewritten as

```js
// Server side (REST API endpoint)
socket.sendMessage({
  type: 'DISPLAY_NOTIFICATION',
  text
})

// Client side (Redux reducer)
function reducer(state, action) {
  switch (action.type) {
    case 'DISPLAY_NOTIFICATION':
      return {
        ...state,
        notifications: state.notifications.concat([action.text])
      }
    default:
      return state
  }
}
```
</details>

## Server-Side Rendering and bundlers

If the application is being built with a bundler (most likely Webpack) and Server-Side Rendering is enabled then make sure to build the server-side code with the bundler too so that `require()` calls for assets (images, styles, fonts, etc) inside React components don't break.
## Code splitting

Code splitting is supported.

## Advanced

At some point in time this README became huge so I extracted some less relevant parts of it into README-ADVANCED (including the list of all possible settings and options). If you're a first timer then just skip that one - you don't need it for sure.

## License

[MIT](LICENSE)
