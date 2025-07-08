
import express from 'express'
const app = express()
import Proxy from '../proxy.mjs'
import Lifecycle from '../lifecycle.mjs'
import HttpsContentSource from '../content-sources/https-content-source.mjs'

let proxy = new Proxy(new Lifecycle({}))

proxy.contentSources['www.spam.com'] = new HttpsContentSource({
	ip: '54.162.145.160'
})





app.use(proxy.getExpressHandler())
 
app.listen(3000)