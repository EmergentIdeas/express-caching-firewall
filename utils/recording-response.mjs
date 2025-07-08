import RecordingTransform from "./recording-transform.mjs";

export default class RecordingResponse extends RecordingTransform {
	
	/**
	 * 
	 * @param {object} options 
	 * @param {array<HTTPResponse>} options.subsequentResponses 
	 */
	constructor(options) {
		super(options)
		this.headers = {}
		this.subsequentResponses = options.subsequentResponses || []
	}
	
	addSubsequentResponse(resp) {
		this.subsequentResponses.push(resp)
		this.pipe(resp)
	}
	
	set(key, value) {
		this.headers[key] = value
		for(let resp of this.subsequentResponses) {
			resp.set(key, value)
		}
	}

	status(statusCode) {
		this.statusCode = statusCode
		for(let resp of this.subsequentResponses) {
			resp.status(statusCode)
		}
	}
}