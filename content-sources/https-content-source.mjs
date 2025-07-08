import https from 'https'
import WebContentSource from "./web-content-source.mjs";

export default class HttpsContentSource extends WebContentSource {
	constructor(options) {
		super(options)
		this.h = https
	}
	
	getScheme() {
		return 'https'
	}
}