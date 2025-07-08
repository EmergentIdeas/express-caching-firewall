import response500 from "./responses/response-500.mjs"
import response404 from "./responses/response-404.mjs"
import ResponseStrategies from './data/response-strategies.mjs'



export default function handleRequestWithError(proxy, rfs) {
	if(rfs.tryCount) {
		rfs.tryCount++
	}
	else {
		rfs.tryCount = 1
	}
	
	if(rfs.tryCount < maxTryCount) {
		rfs.delay = rfs.tryCount * retryCooldown
		console.log('retry')
		proxy.lifecycle.scheduler(proxy, rfs)
	}
	else {
		if(rfs.responseStrategy === ResponseStrategies.PIPE || rfs.responseStrategy === ResponseStrategies.PASS) {
			return response500(rfs.originalHttpRequest, rfs.originalHttpResponse)
		}
		if(rfs.responseStrategy !== ResponseStrategies.CACHED) {
			rfs.responseStrategy = ResponseStrategies.CACHED
			console.log('retry cache only')
			proxy.lifecycle.scheduler(proxy, rfs)
		}
		else {
			return response404(rfs.originalHttpRequest, rfs.originalHttpResponse)
		}
	}
	

}

export let maxTryCount = 3
export let retryCooldown = 2000