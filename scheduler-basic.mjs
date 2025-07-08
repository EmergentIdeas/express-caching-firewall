export default function schedule(proxy, rfs) {
	
	if(rfs.delay) {
		setTimeout(function() {

			proxy.performRequest(rfs)
		}, rfs.delay)
	}
	else {
		proxy.performRequest(rfs)
	}

}