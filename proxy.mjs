
import RecordingResponse from './utils/recording-response.mjs'
import ResponseStrategies from './data/response-strategies.mjs'
import CacheLineStates from './data/cache-line-states.mjs'
import EventEmitter from 'events'
import InMemoryCacheDataStorage from './cache-data-storage/in-memory.mjs'

export default class Proxy {
	constructor(lifecycle) {
		this.lifecycle = lifecycle
		this.contentSources = {}
		this.cacheIndex = {}
		this.cacheDataStore = new InMemoryCacheDataStorage()
		this.cacheUpdateEvents = new EventEmitter()

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

	createNewCacheLine(rfs) {
		let now = this.now()
		return {
			key: rfs.key
			, created: now
			, modified: now
		}

	}
	cacheAsNeeded(rfs, recordingResponse) {
		let cacheLine = this.cacheIndex[rfs.key]
		if (!cacheLine) {
			cacheLine = this.createNewCacheLine(rfs)
			this.cacheIndex[cacheLine.key] = cacheLine
		}
		cacheLine.modified = this.now()
		cacheLine.statusCode = recordingResponse.statusCode
		cacheLine.responseHeaders = Object.assign({}, recordingResponse.headers)
		if(recordingResponse.overflow || recordingResponse.recording === false) {
			cacheLine.state = CacheLineStates.UNCACHEABLE
			this.cacheUpdateEvents.emit('update', cacheLine)
		}
		else {
			cacheLine.state = CacheLineStates.WRITING
			this.cacheUpdateEvents.emit('update', cacheLine)
			this.cacheDataStore.put(rfs.key, recordingResponse.chunks).then(() => {
				cacheLine.state = CacheLineStates.READY
				this.cacheUpdateEvents.emit('update', cacheLine)

			})
		}
	}

	now() {
		return new Date().getTime()
	}
	
	fullfill(rfs) {
		if(!rfs.responseStrategy) {
			this.lifecycle.determineResponseStrategy(this, rfs)
		}
		switch(rfs.responseStrategy) {
			case ResponseStrategies.CACHED:
				this.fullfillFromCache(rfs)
			break;
			default:
				this.performRequest(rfs)
		}
	}
	recycle(rfs) {
		delete rfs.responseStrategy
		this.fullfill(rfs)
	}
	
	async fullfillFromCache(rfs) {
		let cacheLine = this.cacheIndex[rfs.key]
		if(cacheLine.state === CacheLineStates.READY) {
			let contents = await this.cacheDataStore.get(rfs.key)
			if(!contents) {
				return this.recycle(rfs)
			}

			let responseHeaders = Object.assign({}, cacheLine.responseHeaders)
			delete responseHeaders['date']
			delete responseHeaders['keep-alive']
			delete responseHeaders['connection']
			delete responseHeaders['content-length']
			
			let res = rfs.originalHttpResponse
			
			for(let entry of Object.entries(responseHeaders)) {
				res.set(entry[0], entry[1])
			}
			for(let part of contents) {
				res.write(part.chunk, part.encoding)
			}
			res.end()


		}
		else {
			return this.recycle(rfs)
		}
		
	}

	performRequest(rfs) {


		if (rfs.responseStrategy === ResponseStrategies.PIPE) {
			rfs.backend.fetch(rfs.originalHttpRequest, rfs.originalHttpResponse)
		}
		else {
			let dest
			this.lifecycle.prepareBackendRequest(rfs)
			let transformers = this.lifecycle.determineResponseTransformers(rfs)
			let record = true
			if (rfs.responseStrategy === ResponseStrategies.PASS) {
				record = false
			}
			else {
				// create a cache entry that tells everybody we're requesting this key
				let cacheLine = this.createNewCacheLine(rfs)
				cacheLine.state = CacheLineStates.REQUESTING
				this.cacheIndex[cacheLine.key] = cacheLine
				this.cacheUpdateEvents.emit('update', cacheLine)
			}

			dest = new RecordingResponse({
				transformers: transformers
				, record: record
				, headerTransformers: this.lifecycle.responseHeaderTransformers
			})

			dest.addSubsequentResponse(rfs.originalHttpResponse)
			if (rfs.responseStrategy !== ResponseStrategies.PASS) {
				dest.on('finish', () => {
					this.cacheAsNeeded(rfs, dest)
				})
			}
			dest.on('error', (e) => {
				console.log('proxy caught error')
				this.lifecycle.requestWithErrorHandler(this, rfs)
			})
			
			rfs.backend.fetch(rfs.backendRequestSummary, dest)
		}

	}

	getExpressHandler() {
		return async (req, res, next) => {
			this._handle(req, res, next)
		}
	}
}