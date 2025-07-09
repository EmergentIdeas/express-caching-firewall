let uncacheablePartIndicators = [/preview/i, /\.php$/i, /wp-admin/i, /gf_page/i]
let longCache = /\.(css|js|png|gif|jp(e)?g|swf|ico|woff2|svg)/i

function isCachableResource(rfs, url) {
	
	for(let exp of uncacheablePartIndicators) {
		if(exp.test(url)) {
			return false
		}
	}

	if(
		rfs.originalRequestSummary.headers['authorization'] 
		|| rfs.originalRequestSummary.headers['cookie'] 
	) {
		return false
	}

	return true
}




export default function addCacheHeaders(rfs, headers) {
	let url = rfs.originalRequestSummary.path
	if(isCachableResource(rfs, url)) {
		delete headers['set-cookie']
		delete headers['cookie']

		if(longCache.test(url)) {
			headers['cache-control'] = 'private, max-age=120, must-revalidate'
			headers['age'] = 0

		}
		else {
			headers['cache-control'] = 'private, no-cache, max-age=120'
			headers['age'] = 0

		}


	}
	else {
		// Use 'no-cache' here instead of 'no-store' otherwise it messes with the
		// ability of the user to use the browsers's back button to see the previous
		// page without requesting the content again.
		headers['cache-control'] = 'no-cache, private, max-age=0'
		headers['expires'] = '0'
		
	}


}