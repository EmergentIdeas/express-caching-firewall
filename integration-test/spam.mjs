
import express from 'express'
const app = express()
import Proxy from '../proxy.mjs'
import Lifecycle from '../lifecycle.mjs'
import HttpsContentSource from '../content-sources/https-content-source.mjs'
import createTextSubstitutionHeaderTransformer from '../transform-tools/text-substitution-header-transformer.mjs'


let lifecycle = new Lifecycle({})
lifecycle.prepareBackendHeaderTransformers.push(
	createTextSubstitutionHeaderTransformer('http://localhost:3000', 'https://www.spam.com')
)
lifecycle.prepareBackendHeaderTransformers.push(
	createTextSubstitutionHeaderTransformer('localhost:3000', 'www.spam.com')
)
lifecycle.responseHeaderTransformers.push(
	createTextSubstitutionHeaderTransformer('https://www.spam.com', 'http://localhost:3000')
)
lifecycle.responseHeaderTransformers.push(
	createTextSubstitutionHeaderTransformer('www.spam.com', 'localhost:3000')
)

lifecycle.determineResponseTransformers = function determineResponseTransformers(rfs) {

	return [
		function (chunk, enconding) {
			if (this.headers['content-type'].startsWith('text/html')) {
				return chunk.toString().split('https://www.spam.com').join('http://localhost:3000')
			}
			if (this.headers['content-type'].startsWith('application/json')) {
				let value = chunk.toString()
				value = value.split('https://www.spam.com').join('http://localhost:3000')
				value = value.split("https:\\/\\/www.spam.com").join('http:\\/\\/localhost:3000')
				return value
			}
			
			return chunk
		}
	]
}

let proxy = new Proxy(lifecycle)

proxy.contentSources['www.spam.com'] = new HttpsContentSource({
	ip: '54.162.145.160'
	// ip: '1.1.1.1'
})





app.use(proxy.getExpressHandler())
 
app.listen(3000)