import { Transform } from 'stream'

export default class RecordingTransform extends Transform {
	/**
	 * 
	 * @param {*} options 
	 * @param {function} options.transformer Transforms chuncks of data 
	 * @param {boolean} options.record Whether to record the data
	 * @param {int} options.maxSize The default size to be stored in bytes. Default is 3 meg.
	 */
	constructor(options) {
		super()
		this.record = true
		this.maxSize = 3145728
		Object.assign(this, options)
		this.chunks = []
		this.overflow = false
		this.byteCount = 0
	}
	_transform(chunk, encoding, callback) {
		chunk = this.transformer ? this.transformer(chunk, encoding) : chunk
		if(chunk) {
			let size = chunk.byteLength || chunk.length || JSON.stringify(chunk).length
			this.byteCount += size
			if(!this.overflow && this.record) {
				if(this.byteCount > this.maxSize) {
					delete this.chunks
					this.overflow = true
				}
				else {
					this.chunks.push({
						chunk: chunk
						, encoding: encoding
					})
				}

			}
		}
		return callback(null, chunk)
	}
}
