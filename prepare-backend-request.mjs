import transformHeaders from "./utils/transform-headers.mjs"
import SimpleTransform from "./utils/simple-transform.mjs"
import ResponseStrategies from "./data/response-strategies.mjs"

export default function prepareBackendRequest(rfs) {
	let trans = new SimpleTransform()
	let backendRequest = Object.assign(trans, rfs.originalRequestSummary)
	
	rfs.backendRequestSummary = backendRequest
	if(rfs.responseStrategy === ResponseStrategies.PASS) {
	// if(true) {
		backendRequest.headers = Object.assign({}, rfs.originalRequestSummary.headers)
	}
	else {
		backendRequest.headers = {
			host: rfs.originalRequestSummary.headers.host
		}
	}
	transformHeaders(backendRequest.headers, this.prepareBackendHeaderTransformers)
	

	let url = backendRequest.path
	let parms = Object.entries(backendRequest.query).map(entry => entry[0] + 
		(entry[1] ? '=' + entry[1] : '')
	).join('&')
	if(parms) {
		url += '?' + parms
	}
	backendRequest.serverRelativeRequest  = url
	
	rfs.originalHttpRequest.pipe(backendRequest)
}