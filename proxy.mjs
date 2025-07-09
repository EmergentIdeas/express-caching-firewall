
import RecordingResponse from './utils/recording-response.mjs'
import ResponseStrategies from './data/response-strategies.mjs'
import CacheLineStates from './data/cache-line-states.mjs'
import EventEmitter from 'events'
import InMemoryCacheDataStorage from './cache-data-storage/in-memory.mjs'
import DeadStream from './utils/dead-stream.mjs'
import transformHeaders from "./utils/transform-headers.mjs"

export default class Proxy {
	constructor(lifecycle) {
		this.lifecycle = lifecycle
		this.contentSources = {}
		this.cacheIndex = {}
		this.cacheDataStore = new InMemoryCacheDataStorage()
		this.cacheUpdateEvents = new EventEmitter()
		this.cacheHeaders = ['expires', 'cache-control', 'age', 'pragma']

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
	
	removeCacheHeaders(headers) {
		for(let key of Object.keys(headers)) {
			if(this.cacheHeaders.includes(key)) {
				delete headers[key]
			}
		}
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


		if (recordingResponse.overflow || recordingResponse.recording === false) {
			// We don't have the data to cache, so we'll let everybody know that no data will be coming
			cacheLine.state = CacheLineStates.UNCACHEABLE
			this.cacheUpdateEvents.emit('update', cacheLine)
		}
		else {
			// Write the information to the cache storage and notify other of its availability
			cacheLine.state = CacheLineStates.WRITING
			cacheLine.byteCount = recordingResponse.byteCount
			cacheLine.lastAccess = this.now()
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
		if (!rfs.responseStrategy) {
			this.lifecycle.determineResponseStrategy(this, rfs)
		}
		switch (rfs.responseStrategy) {
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
		if (cacheLine.state === CacheLineStates.READY) {
			let contents = await this.cacheDataStore.get(rfs.key)

			if (!contents) {
				return this.recycle(rfs)
			}

			let responseHeaders = Object.assign({}, cacheLine.responseHeaders)
			this.removeCacheHeaders(responseHeaders)
			this.lifecycle.addCacheHeaders(rfs, responseHeaders)
			
			cacheLine.lastAccess = this.now()

			let org = rfs.originalRequestSummary
			let res = rfs.originalHttpResponse

			// Let's check first to see if we can answer with a "not changed" status
			if (
				(org.headers['if-none-match'] && org.headers['if-none-match'] === cacheLine.responseHeaders.etag)
				|| 
				(org.headers['if-modified-since'] && org.headers['if-modified-since'] === cacheLine.responseHeaders['last-modified'])
			) {
				res.status(304)
				
				for (let entry of Object.entries(responseHeaders)) {
					res.set(entry[0], entry[1])
				}
				res.end()
			}
			else {
				for (let entry of Object.entries(responseHeaders)) {
					res.set(entry[0], entry[1])
				}
				for (let part of contents) {
					res.write(part.chunk, part.encoding)
				}
				res.end()
			}
		}
		else {
			return this.recycle(rfs)
		}

	}

	assignContentToDestination(rfs, res, dest) {

		// Theoretically we might be able to answer this with a 304 response, but since this is a real
		// request that has been piping data to the original request, that ship has sailed.
		dest.status(res.statusCode)
		let responseHeaders = Object.assign({}, res.headers)

		this.removeCacheHeaders(responseHeaders)
		this.lifecycle.addCacheHeaders(rfs, responseHeaders)

		for (let key of Object.keys(responseHeaders)) {
			dest.set(key, responseHeaders[key])
		}

		res.pipe(dest)
	}

	async performRequest(rfs) {
		if (rfs.responseStrategy === ResponseStrategies.PIPE) {
			try {
				let res = await rfs.backend.fetch(rfs.originalHttpRequest,)
				let dest = rfs.originalHttpResponse
				dest.status(res.statusCode)
				for (let key of Object.keys(res.headers)) {
					dest.set(key, res.headers[key])
				}
				res.pipe(dest)
				res.on('error', (e) => {
					dest.emit('error', e)
				})
			}
			catch (e) {
				console.error(e)
			}
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
				console.error('proxy caught error')
				this.lifecycle.requestWithErrorHandler(this, rfs)
			})

			try {
				let res = await rfs.backend.fetch(rfs.backendRequestSummary)
				res.on('error', (e) => {
					dest.emit('error', e)
				})
				this.assignContentToDestination(rfs, res, dest)

			}
			catch (e) {
				console.error(e)
				this.lifecycle.requestWithErrorHandler(this, rfs)
			}

		}

	}

	getExpressHandler() {
		return async (req, res, next) => {
			this._handle(req, res, next)
		}
	}
}