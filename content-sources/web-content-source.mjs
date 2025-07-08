
export default class WebContentSource {
	/**
	 * 
	 * @param {*} options 
	 * @param {string} options.ip 
	 * @param {string} options.port
	 */
	constructor(options) {
		Object.assign(this, options)
	}

	getScheme() {
		return ''

	}
	getPortSpec() {
		if (this.port) {
			return ':' + this.port
		}
		return ''
	}

	fetch(backendRequest, destination) {
		let req = this.h.request(`${this.getScheme()}://${backendRequest.hostname}${this.getPortSpec()}${backendRequest.url}`, {
			lookup: (name, options, callback) => {
				if (typeof callback !== 'function' && typeof options === 'function') {
					callback = options
					options = {}
				}
				if (options.all) {
					callback(null, [{ "address": this.ip, "family": 4 }])
				}
				else {
					callback(null, num, 4)
				}
			}
			, method: backendRequest.method

		}, (res) => {
			destination.status(res.statusCode)
			for (let key of Object.keys(res.headers)) {
				destination.set(key, res.headers[key])
			}
			res.pipe(destination)
		})


		req.on('error', (e) => {
			console.error(e)
		})
		if (backendRequest.bodyStream) {
			backendRequest.bodyStream.pipe(req)
		}
		else {
			req.end()
		}
	}


}