
import RecordingResponse from './utils/recording-response.mjs'
import ResponseStrategies from './data/response-strategies.mjs'
import response500 from './responses/response-500.mjs'

export default class Proxy {
	constructor(lifecycle) {
		this.lifecycle = lifecycle
		this.contentSources = {}

	}

	async _handle(req, res, next) {
		let rfs = this.lifecycle.dataStructureCreation(req, res)


		for (let preCheck of this.lifecycle.preCheck) {
			let result = preCheck(rfs)
			if (result) {
				return result(req, res)
			}
		}

		for (let requestForServiceCreation of this.lifecycle.requestForServiceCreation) {
			let result = requestForServiceCreation(rfs)
			if (result instanceof Promise) {
				await result
			}
		}

		this.lifecycle.idGenerator(rfs)

		for (let auth of this.lifecycle.firstAuthorization) {
			let result = auth(rfs)
			if (result instanceof Promise) {
				result = await result
			}
			if (result) {
				return result(req, res)
			}
		}

		rfs.backend = this.lifecycle.determineBackend(this, rfs)


		this.lifecycle.scheduler(this, rfs)

	}
	
	cacheAsNeeded(rfs, recordingResponse) {


	}
	
	performRequest(rfs) {
		let dest

		this.lifecycle.prepareBackendRequest(rfs)

		if (rfs.responseStrategy === ResponseStrategies.PIPE) {
			dest = rfs.originalHttpResponse
		}
		else {
			let transformers = this.lifecycle.determineResponseTransformers(rfs)
			let record = true
			if (rfs.responseStrategy === ResponseStrategies.PASS) {
				record = false
			}

			dest = new RecordingResponse({
				transformers: transformers
				, record: record
			})

			dest.addSubsequentResponse(rfs.originalHttpResponse)
			if (rfs.responseStrategy !== ResponseStrategies.PASS) {
				dest.on('end', () => {
					this.cacheAsNeeded(rfs, dest)
				})
			}
			dest.on('error', (e) => {
				console.log('proxy caught error')
				this.lifecycle.requestWithErrorHandler(this, rfs)
			})
		}

		rfs.backend.fetch(rfs.backendRequestSummary, dest)
	}

	getExpressHandler() {
		return async (req, res, next) => {
			this._handle(req, res, next)
		}
	}
}