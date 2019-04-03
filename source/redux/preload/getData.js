import { getLocationUrl, shouldSkipPreloadForNavigation } from '../../location'

import {
	redirect,
	getMatchedRoutes,
	getMatchedRoutesIndices,
	getMatchedRoutesParams,
	getRouteParams,
	getCurrentlyMatchedLocation,
	getPreviouslyMatchedLocation,
	RedirectException
} from '../../router'

import preload from './preload'

export default function createGetDataForPreload(codeSplit, server, onError, getLocale, getConvertedRoutes, getCookie) {
	return function({ params, context: { dispatch, getState } }) {
		if (!server) {
			if (window._react_website_skip_preload ||
				window._react_website_skip_preload_update_location ||
				window._react_website_hot_reload) {
				// Reset "skip @preload()" flag for `pushLocation()` and `replaceLocation()`.
				if (window._react_website_skip_preload_update_location) {
					window._react_website_skip_preload_update_location = false;
				}
				return
			}
		}
		const { location, previousLocation } = getLocations(getState())
		const isInitialClientSideNavigation = !server && !previousLocation
		// A workaround for `found` router bug:
		// https://github.com/4Catalyzer/found/issues/239
		// Prevent executing `@preload()`s on "anchor" link click.
		if (!server && !isInitialClientSideNavigation) {
			if (shouldSkipPreloadForNavigation(previousLocation, location)) {
				return
			}
		}
		// Execute `@preload()`s.
		return preload(
			location,
			isInitialClientSideNavigation ? undefined : previousLocation,
			{
				routes: getMatchedRoutes(getState(), getConvertedRoutes()),
				routeIndices: getMatchedRoutesIndices(getState()),
				routeParams: getMatchedRoutesParams(getState()),
				params: getRouteParams(getState())
			},
			codeSplit,
			server,
			getCookie,
			getLocale,
			dispatch,
			getState
		)
		.then(
			() => {},
			(error) => {
				// Possibly handle the error (for example, redirect to an error page).
				if (!(error instanceof RedirectException)) {
					if (onError) {
						onError(error, {
							path : location.pathname,
							url  : getLocationUrl(location),
							// Using `redirect` instead of `goto` here
							// so that the user can't go "Back" to the page being preloaded
							// in case of an error because it would be in inconsistent state
							// due to `@preload()` being interrupted.
							redirect(to) {
								throw new RedirectException(to)
							},
							getState,
							server
						})
					}
				}
				throw error
			}
		)
	}
}

function getLocations(state) {
	const server = typeof window === 'undefined'
	return {
		location: getCurrentlyMatchedLocation(state),
		previousLocation: (server || !window._react_website_router_rendered) ? undefined : getPreviouslyMatchedLocation(state)
	}
}