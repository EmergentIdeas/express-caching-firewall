import rand from "./utils/rand.mjs"
import ResponseStrategies from "./data/response-strategies.mjs"


export default function idGenerator(rfs) {
	if(rfs.originalRequestSummary.headers.cookie) {
		rfs.key = rand()
		rfs.responseStrategy = ResponseStrategies.PASS
		return
	}

	let key = rfs.originalRequestSummary.hostname + rfs.originalRequestSummary.method + rfs.originalRequestSummary.path
	let parms = Object.entries(rfs.originalRequestSummary.query).map(entry => entry[0] + '=' + entry[1]).join('&')
	if(parms) {
		key += '?' + parms
	}

	rfs.key = key
	return key
}