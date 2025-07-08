import RecordingTransform from "./recording-transform.mjs";
import transformHeaders from "./transform-headers.mjs";

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
		this.headerTransformers = options.headerTransformers || []
	}
	
	addSubsequentResponse(resp) {
		this.subsequentResponses.push(resp)
		this.pipe(resp)
	}
	
	set(key, value) {
		let mini = {}
		mini[key] = value
		if(this.headerTransformers.length > 0) {
			transformHeaders(mini, this.headerTransformers)
		}
		for(let foundKey of Object.keys(mini)) {
			this.headers[foundKey] = mini[foundKey]
			for(let resp of this.subsequentResponses) {
				resp.set(foundKey, mini[foundKey])
			}
		}
	}

	status(statusCode) {
		this.statusCode = statusCode
		for(let resp of this.subsequentResponses) {
			resp.status(statusCode)
		}
	}
}