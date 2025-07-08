export default function addRequestAttributes(rfs) {
	let req = rfs.originalHttpRequest
	let summary = rfs.originalRequestSummary
	
	summary.hostname = req.hostname
	summary.method = req.method
	summary.url = req.originalUrl
	summary.path = req.path
	summary.query = Object.assign({}, req.query)
	
}