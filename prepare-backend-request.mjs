export default function prepareBackendRequest(rfs) {
	let backendRequest = Object.assign({}, rfs.originalRequestSummary)
	
	rfs.backendRequestSummary = backendRequest
	backendRequest.headers = Object.assign({}, rfs.originalRequestSummary.headers)
	backendRequest.hostname = 'www.spam.com'
	backendRequest.headers.host = backendRequest.hostname
	
	delete backendRequest.headers['if-none-match']
	delete backendRequest.headers['if-modified-since']
	delete backendRequest.headers['vary']
	

	let url = backendRequest.path
	let parms = Object.entries(backendRequest.query).map(entry => entry[0] + '=' + entry[1]).join('&')
	if(parms) {
		url += '?' + parms
	}
	backendRequest.serverRelativeRequest  = url
}