import React, { Component } from 'react'
import hoist_statics from 'hoist-non-react-statics'

import { On_page_loaded_method_name } from './middleware/preloading middleware'

// `@onPageLoaded()` decorator.
//
// `function onPageLoaded({ dispatch, getState, location, parameters, history, server })`.
//
export default function onPageLoaded(on_page_loaded, options)
{
	return function(Wrapped)
	{
		class OnPageLoaded extends Component
		{
			render()
			{
				return <Wrapped {...this.props} />
			}
		}

		OnPageLoaded[On_page_loaded_method_name] = on_page_loaded

		OnPageLoaded.displayName = `OnPageLoaded(${get_display_name(Wrapped)})`
		
		return hoist_statics(OnPageLoaded, Wrapped)
	}
}

function get_display_name(Wrapped)
{
	return Wrapped.displayName || Wrapped.name || 'Component'
}