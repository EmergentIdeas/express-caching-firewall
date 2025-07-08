export default function prepareBackendRequest(rfs) {
	let backendRequest = Object.assign({}, rfs.originalRequestSummary)
	
	rfs.backendRequestSummary = backendRequest
	backendRequest.headers = Object.assign({}, rfs.originalRequestSummary.headers)
	backendRequest.hostname = 'www.spam.com'
	backendRequest.headers.host = backendRequest.hostname
	console.log(backendRequest)

}