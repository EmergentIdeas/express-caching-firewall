import removeRequestHeaders from "../utils/remove-request-headers.mjs"


export function copyHeaders(source, destination) {
	if(!destination.headers) {
		destination.headers
	}
	
	for(let key of Object.keys(source.headers)) {
		destination.headers[key] = source.headers[key]
	}
	removeRequestHeaders(destination.headers)
}

export function copyRequestHeaders(rfs) {
	return copyHeaders(rfs.originalHttpRequest, rfs.originalRequestSummary)
}