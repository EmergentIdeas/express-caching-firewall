
export default class WebContentSource {
	/**
	 * 
	 * @param {*} options 
	 * @param {string} options.ip 
	 * @param {string} options.port
	 */
	constructor(options) {
		this.timeout = 5000
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

	fetch(backendRequest) {
		let resolved = false
		let rejected = false
		let result
		let p = new Promise((resolve, reject) => {

			let req = this.h.request(`${this.getScheme()}://${backendRequest.headers.host}${this.getPortSpec()}${backendRequest.serverRelativeRequest}`, {
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
				, timeout: this.timeout
				, headers: backendRequest.headers

			}, (res) => {
				result = res
				resolved = true
				resolve(res)
			})


			req.on('error', (e) => {
				if(resolved) {
					result.emit('error', e)
				}
				else {
					rejected = true
					reject(e)
				}
			})
			backendRequest.pipe(req)
		})
		return p
	}


}