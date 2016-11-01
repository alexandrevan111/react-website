// produces wrong line numbers:
// import 'source-map-support/register'

import React from 'react'

import Html from './html'
import Http_client from '../http client'

import redux_render                                from '../redux/server/render'
import { render_on_server as react_router_render } from '../react-router/render'

import create_store from '../redux/server/store'
import set_up_http_client from '../redux/http client'

import { normalize_common_options } from '../redux/normalize'

import start_monitoring from './monitoring'

// isomorphic (universal) rendering (middleware).
// will be used in web_application.use(...)
export default async function({ monitoring, preload, localize, assets, application, request, render, loading, html, authentication, cookies }, common)
{
	// Make sure `monitoring` is defined (either `StatsD` or a stub)
	monitoring = monitoring || start_monitoring({})

	const
	{
		get_reducer,
		redux_middleware,
		on_store_created,
		promise_event_naming,
		create_routes,
		wrapper,
		parse_dates
	}
	= normalize_common_options(common)

	let
	{
		head,
		body,
		body_start,
		body_end,
		style
	}
	= html

	if (style)
	{
		console.warn(`"html.style" parameter is deprecated and will be removed in the next major release. Use "html.head" instead: if (development) return [<style dangerouslySetInnerHTML={{ __html: style }} charSet="UTF-8"/>, ...]`)
	}

	// Make `assets` into a function
	assets = normalize_assets(assets)

	// In development mode Redux DevTools are activated, for example
	const development = process.env.NODE_ENV !== 'production'

	// Trims a question mark in the end (just in case)
	const url = request.url.replace(/\?$/, '')

	// Read authentication token from a cookie (if configured)
	let authentication_token
	if (authentication && authentication.cookie)
	{
		authentication_token = cookies.get(authentication.cookie)
	}

	// Isomorphic http client (with cookie support)
	const http_client = new Http_client
	({
		host          : application.host,
		port          : application.port,
		secure        : application.secure,
		clone_request : request,
		format_url    : common.http && common.http.url,
		parse_dates,
		authentication_token,
		authentication_token_header: authentication ? authentication.header : undefined
	})

	// initial Flux store data (if using Flux)
	let store_data = {}

	// supports custom preloading before the page is rendered
	// (for example to authenticate the user and retrieve user selected language)
	if (preload)
	{
		await monitoring.measure('request.preload', async () =>
		{
			store_data = (await preload(http_client, { request })) || store_data
		}) 
	}

	// create Redux store
	let store
	if (get_reducer)
	{
		store = create_store(get_reducer,
		{
			development,
			server: true,
			create_routes,
			data: store_data,
			middleware: redux_middleware,
			on_store_created,
			promise_event_naming,
			on_preload_error : common.preload && common.preload.catch,
			http_client,
			preload_helpers : common.preload && common.preload.helpers,
			on_navigate     : common.on_navigate,
			history_options : common.history
		})
	}

	// Customization of `http` utility
	// which can be used inside Redux action creators
	set_up_http_client(http_client,
	{
		store,
		on_before_send : common.http && common.http.request
	})

	// Internationalization

	let locale
	let messages

	if (localize)
	{
		const result = await localize(store)

		locale   = result.locale
		messages = result.messages
	}

	// If Redux is being used, then render for Redux.
	// Else render for pure React.
	const render_page = store ? redux_render : react_router_render

	// Render the web page
	let result

	return await render_page
	({
		monitoring,

		disable_server_side_rendering: render === false,
		
		url,

		create_page_element: (child_element, props) => 
		{
			if (localize)
			{
				props.locale   = locale
				props.messages = messages
			}

			return React.createElement(wrapper, props, child_element)
		},

		render_webpage_as_react_element: content =>
		{
			assets = assets(url, { store })
			if (assets.styles)
			{
				assets.style = assets.styles
			}

			if (head)
			{
				head = head(url)
			}

			if (body_start)
			{
				body_start = body_start(url)
			}

			if (body_end)
			{
				body_end = body_end(url)
			}

			const markup = 
			(
				<Html
					development={development}
					assets={assets}
					locale={locale}
					head={head}
					body={body}
					body_start={body_start}
					body_end={body_end}
					style={style}
					store={store}
					parse_dates={parse_dates}
					authentication_token={authentication_token}>

					{disable ? loading : content}
				</Html>
			)

			return markup
		},

		store,

		// create_routes is only used for bare React-router rendering
		create_routes: store ? undefined : create_routes
	})
}

// Makes it a function
function normalize_assets(assets)
{
	// Normalize `assets` parameter
	// (to be a function)
	if (typeof assets !== 'function')
	{
		const assets_object = assets
		assets = () => assets_object
	}

	return assets
}