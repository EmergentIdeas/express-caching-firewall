import http from 'http'
import WebContentSource from "./web-content-source.mjs";

export default class HttpContentSource extends WebContentSource {
	constructor(options) {
		super(options)
		this.h = http
	}
	
	getScheme() {
		return 'http'
	}
}