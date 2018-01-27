import { html } from 'print-error'

// Outputs an error page
export default function render_error(error, options) // , log
{
	// If the error is caught here it means that `catch`
	// (error handler parameter) didn't resolve it
	// (or threw it)

	// Show error stack trace in development mode for easier debugging
	if (process.env.NODE_ENV !== 'production')
	{
		try
		{
			const { status = 500, content } = render_stack_trace(error, options)

			if (content)
			{
				return {
					status,
					content,
					contentType: 'text/html'
				}
			}
		}
		catch (error)
		{
			console.log('[react-website] Couldn\'t render error stack trace.')
			console.log(error.stack || error)
		}
	}

	// Log the error
	console.log('[react-website] Rendering service error')

	// if (log)
	// {
	// 	log.error(error)
	// }

	return {
		status: typeof error.status === 'number' ? error.status : 500,
		content: error.message || 'Error',
		contentType: 'text/plain'
	}
}

function render_stack_trace(error, options)
{
	// Supports custom `html` for an `Error`
	if (error.html)
	{
		return {
			status  : error.status,
			content : error.html
		}
	}

	// Handle `superagent` errors: if an error response was an html, then just render it
	// https://github.com/visionmedia/superagent/blob/29ca1fc938b974c6623d9040a044e39dfb272fed/lib/node/response.js#L106
	if (typeof error.status === 'number')
	{
		// If the `superagent` http request returned an html response 
		// (possibly an error stack trace),
		// then just output that stack trace
		if (error.response 
			&& error.response.headers['content-type']
			&& error.response.headers['content-type'].split(';')[0].trim() === 'text/html')
		{
			return {
				status  : error.status,
				content : error.message
			}
		}
	}

	// If this error has a stack trace then it can be shown
	const stack = get_stack_trace(error)

	// If this error doesn't have a stack trace - do nothing
	if (!stack)
	{
		return {}
	}

	try
	{
		return {
			content : html({ stack }, options)
		}
	}
	catch (error)
	{
		console.error(error)

		return {
			content : error.stack
		}
	}
}

// Extracts stack trace from `Error`
function get_stack_trace(error)
{
	// Standard javascript `Error` stack trace
	if (error.stack)
	{
		return error.stack
	}

	// `superagent` errors have the `original` property 
	// for storing the initial error
	if (error.original && error.original.stack)
	{
		return error.original.stack
	}
}