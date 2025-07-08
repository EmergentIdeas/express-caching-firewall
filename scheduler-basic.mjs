export default function schedule(proxy, rfs) {
	
	if(rfs.delay) {
		setTimeout(function() {

			proxy.fullfill(rfs)
		}, rfs.delay)
	}
	else {
		proxy.fullfill(rfs)
	}

}