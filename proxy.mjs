
import RecordingResponse from './utils/recording-response.mjs'

export default class Proxy {
	constructor(lifecycle) {
		this.lifecycle = lifecycle
		this.contentSources = {}

	}
	
	async _handle(req, res, next) {
		let rfs = this.lifecycle.dataStructureCreation(req, res)
		

		for(let preCheck of this.lifecycle.preCheck) {
			let result = preCheck(rfs)
			if(result) {
				return result(req, res)
			}
		}
		
		for(let requestForServiceCreation of this.lifecycle.requestForServiceCreation) {
			let result = requestForServiceCreation(rfs)
			if(result instanceof Promise) {
				await result
			}
		}
		
		this.lifecycle.idGenerator(rfs)
		
		for(let auth of this.lifecycle.firstAuthorization) {
			let result = auth(rfs)
			if(result instanceof Promise) {
				result = await result
			}
			if(result) {
				return result(req, res)
			}
		}
		
		rfs.backend = this.lifecycle.determineBackend(this, rfs)
		
		this.lifecycle.prepareBackendRequest(rfs)
		
		let dest = res
		
		dest = new RecordingResponse({
			transformer: function(chunk, enconding) {
				if(this.headers['content-type'].startsWith('text/html')) {
					return chunk.toString().split('https://www.spam.com').join('http://localhost:3000')
				}
				return chunk
			}
			, record: false
		})
		dest.addSubsequentResponse(res)
		
		rfs.backend.fetch(rfs.backendRequestSummary, dest)
		
		
		delete rfs.originalHttpRequest
		delete rfs.originalHttpResponse
		// console.log(JSON.stringify(rfs, null, '\t'))

		// res.end()

	}
	
	getExpressHandler() {
		return async (req, res, next) => {
			this._handle(req, res, next)
		}
	}
}