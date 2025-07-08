import http2 from 'http2'
import http from 'http'
import https from 'https'


let req = https.request('https://www.spam.com/', {
	lookup: (name, options, callback) => {

		console.log(`lookup: ${name}, ${JSON.stringify(options)}, ${callback}`)
		// let num = '1.2.3.4'
		let num = '54.162.145.160'
		if(typeof callback !== 'function' && typeof options === 'function') {
			callback = options
			options = {}

		}
		if(options.all) {
			callback(null, [{"address": num,"family":4}])

		}
		else {
			callback(null, num, 4)

		}
	}

}, (res) => {

	console.log('statusCode:', res.statusCode);
	console.log('headers:', res.headers);

	res.on('data', (d) => {
		process.stdout.write(d);
	});


})


req.on('error', (e) => {
	console.error(e)
})
req.end()