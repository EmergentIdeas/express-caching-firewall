import dns from 'dns'

dns.lookup('www.spam.com', {"hints":32,"all":true}, (err, address, family) => {
	console.log(`${JSON.stringify(address)}`)
})