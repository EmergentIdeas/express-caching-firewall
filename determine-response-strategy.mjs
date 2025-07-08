import ResponseStrategies from "./data/response-strategies.mjs"
import CacheLineStates from "./data/cache-line-states.mjs"

export default function determineResponseStrategy(proxy, rfs) {
	if(rfs.responseStrategy) {
		return
	}
	
	if(rfs.originalRequestSummary.headers.cookie) {
		rfs.responseStrategy = ResponseStrategies.PASS
		return
	}
	
	let cacheLine = proxy.cacheIndex[rfs.key]
	if(!cacheLine) {
		rfs.responseStrategy = ResponseStrategies.REQUEST_AND_CACHE
		return
	}
	
	if(cacheLine.state === CacheLineStates.READY) {
		rfs.responseStrategy = ResponseStrategies.CACHED
		return
	}

	rfs.responseStrategy = ResponseStrategies.REQUEST_AND_CACHE
}