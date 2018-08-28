import React from 'react'
import { createStore, combineReducers, applyMiddleware, compose } from 'redux'
import { composeWithDevTools } from 'redux-devtools-extension/logOnlyInProduction'

import asynchronousMiddleware from './middleware/asynchronous'
import routerMiddleware from './middleware/router'

import preloadReducer from './preload/reducer'
import createGetDataForPreload from './preload/getData'

import translateReducer from './translate/reducer'

import {
	convertRoutes,
	foundReducer,
	createRouterStoreEnhancers,
	initializeRouter
} from '../router'

export default function _createStore(settings, data, createHistoryProtocol, httpClient, options)
{
	let
	{
		reducers,
		routes,
		reduxMiddleware,
		reduxStoreEnhancers,
		reduxEventNaming,
		http,
		onError,
		getLocale,
		codeSplit
	}
	= settings

	const
	{
		server,
		devtools,
		stats,
		onNavigate
	}
	= options

	// `routes` will be converted.
	let convertedRoutes
	const getConvertedRoutes = () => convertedRoutes

	// Add `@preload()` data hook.
	if (!codeSplit) {
		routes = React.cloneElement(routes, {
			getData: createGetDataForPreload(server, onError, getLocale, getConvertedRoutes)
		})
	}

	// Convert `found` `<Route/>`s to a JSON structure.
	routes = convertRoutes(routes)
	convertedRoutes = routes

	// Redux middleware.
	// User may supply his own Redux middleware.
	const middleware = reduxMiddleware ? reduxMiddleware() : []

	// Built-in middleware.
	middleware.push
	(
		// Asynchronous middleware (e.g. for HTTP Ajax calls).
		asynchronousMiddleware
		(
			httpClient,
			reduxEventNaming,
			server,
			http.onError,
			http.errorState
		)
	)

	if (!server) {
		middleware.push(routerMiddleware(
			routes,
			codeSplit,
			onNavigate,
			stats
		))
	}

	// Redux "store enhancers"
	const storeEnhancers = []

	// User may supply his own Redux store enhancers.
	if (reduxStoreEnhancers) {
		storeEnhancers.push(...reduxStoreEnhancers())
	}

	storeEnhancers.push(...createRouterStoreEnhancers(routes, createHistoryProtocol, {
		basename: settings.basename
	}))

	// Redux middleware are applied in reverse order.
	// (which is counter-intuitive)
	storeEnhancers.push(applyMiddleware(...middleware))

	// Create Redux store.
	const store = getStoreEnhancersComposer(server, devtools)(...storeEnhancers)(createStore)(createReducer(reducers), data)

	// On the client side, add `hotReload()` function to the `store`.
	// (could just add this function to `window` but adding it to the `store` fits more)
	if (!server) {
		// `hotReload` helper function gives the web application means to hot reload its Redux reducers
		store.hotReload = (reducers) => store.replaceReducer(createReducer(reducers))
	}

	// Initialize `found`.
	initializeRouter(store)

	// Return the Redux store
	return store
}

function createReducer(reducers)
{
	// Check for reserved reducer names.
	for (const reducerName of RESERVED_REDUCER_NAMES) {
		if (reducers[reducerName]) {
			throw new Error(`"${reducerName}" reducer name is reserved.`)
		}
	}
	// Clone the object because it will be modified.
	reducers = { ...reducers }
	// Add `found` reducer.
	reducers.found = foundReducer
	// Add `@preload()` status reducer.
	reducers.preload = preloadReducer
	// // Add `@translate()` reducer.
	// reducers.translation = translateReducer
	// Create reducer.
	return combineReducers(reducers)
}

function getStoreEnhancersComposer(server, devtools)
{
	// Redux DevTools aren't used on the server side
	if (server) {
		return compose
	}

	// Custom behaviour
	if (devtools && devtools.compose) {
		return devtools.compose
	}

	// With custom options
	if (devtools && devtools.options) {
		return composeWithDevTools(devtools.options)
	}

	// Without custom options
	return composeWithDevTools
}

const RESERVED_REDUCER_NAMES = [
	'found',
	'location',
	'preload',
	'translation'
]