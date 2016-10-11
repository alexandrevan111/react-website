import React           from 'react'
import { match }       from 'redux-router/server'
import { ReduxRouter } from 'redux-router'

import react_render_on_server from '../../render on server'

import { location_url } from '../../location'

// Returns a Promise resolving to { status, content, redirect }.
//
export default function render_on_server({ disable_server_side_rendering, create_page_element, render_webpage_as_react_element, url, store })
{
	// Maybe no one really needs to `disable_server_side_rendering`
	if (disable_server_side_rendering)
	{
		// Render the empty <Html/> component into Html markup string
		return Promise.resolve({ content: react_render_on_server({ render_webpage_as_react_element }) })
	}

	// HTTP response status code
	let http_status_code

	// Perform routing for this `url`
	return match_url(url, store).then(routing_result =>
	{
		// Return in case of an HTTP redirect
		if (routing_result.redirect)
		{
			return routing_result
		}

		// Http response status code
		http_status_code = get_http_response_status_code_for_the_route(routing_result.matched_routes)

		// When `url` matching process finished,
		// it immediately launched preloading process,
		// so it's preloading the page now.
		//
		// After the page has finished preloading, render it
		//
		return wait_for_page_to_preload(store).then(() => 
		{
			// Renders the current page React component to a React element
			// (`<ReduxRouter/>` is gonna get the matched route from the `store`)
			const page_element = create_page_element(<ReduxRouter/>, { store })

			// Render the current page's React element to HTML markup
			const content = react_render_on_server({ render_webpage_as_react_element, page_element })

			// return HTTP status code and HTML markup
			return { status: http_status_code, content }
		})
	})
	.catch((error) =>
	{
		// If an HTTP redirect is required, then abort all further actions.
		// That's a hacky way to implement redirects but it seems to work.
		if (error._redirect)
		{
			return { redirect: error._redirect }
		}

		// Otherwise, throw this error up the call stack.
		throw error
	})
}

// Waits for all `@preload()` calls to finish.
function wait_for_page_to_preload(store)
{
	// This promise was previously set by "preloading middleware"
	// if there were any @preload() calls on the current route components
	const promise = store.getState().router

	// Validate the currently preloading promise
	if (promise && typeof promise.then === 'function')
	{
		// If it's really a Promise then return it
		return promise
	}

	// Otherwise, if nothing is being preloaded, just return a dummy Promise
	return Promise.resolve()
}

// One can set a `status` prop for a react-router `Route`
// to be returned as an Http response status code (404, etc)
function get_http_response_status_code_for_the_route(matched_routes)
{
	return matched_routes.reduce((previous, current) => (current && current.status) || (previous && current.status))
}

// Matches a `url` to a route
// (to a hierarchy of React-router `<Route/>`s).
//
// Returns a Promise resolving to an object:
//
//   redirect    - in case of an HTTP redirect
//
//   matched_routes - the matched hierarchy of React-router `<Route/>`s
//
function match_url(url, store)
{
	// (not using `promisify()` helper here 
	//  to avoid introducing dependency on `bluebird` Promise library)
	//
	return new Promise((resolve, reject) =>
	{
		// perform routing for this `url`
		store.dispatch(match(url, (error, redirect_location, router_state) =>
		{
			// if a decision to perform a redirect was made 
			// during the routing process,
			// then redirect to another url
			if (redirect_location)
			{
				return resolve
				({
					redirect: location_url(redirect_location)
				})
			}

			// routing process failed
			if (error)
			{
				return reject(error)
			}

			// don't know what this if condition is for
			if (!router_state)
			{
				return reject(new Error('No router state'))
			}

			return resolve({ matched_routes: router_state.routes })
		}))
	})
}