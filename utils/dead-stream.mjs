import { Writable } from 'stream'

export default class DeadStream extends Writable {
	constructor(options) {
		super(options)
	}

	_write(chunk, encoding, callback) {
		callback() 
	}

}