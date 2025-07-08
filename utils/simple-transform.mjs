import { Transform } from 'stream'

export default class SimpleTransform extends Transform {
	/**
	 * 
	 * @param {*} options 
	 * @param {function} options.transformer Transforms chuncks of data 
	 * @param {array[function]} options.transformers Transforms chuncks of data 
	 */
	constructor(options) {
		super()
		Object.assign(this, options)
	}
	_transform(chunk, encoding, callback) {
		chunk = this.transformer ? this.transformer(chunk, encoding) : chunk
		if(this.transformers) {
			for(let transformer of this.transformers) {
				chunk = transformer.call(this, chunk, encoding)
			}
		}
		return callback(null, chunk)
	}
}
