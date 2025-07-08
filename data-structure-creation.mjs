
function createSummary() {
	return {
		headers: {}
	}
}



export default function dataStructureCreation(req, res) {
	let requestForService = {
		originalHttpRequest: req
		, originalHttpResponse: res
		, originalRequestSummary: createSummary()
		, orignalResponseSummary: createSummary()
		, key: null
	}

	return requestForService
}