

let f = fetch('https://spam.com', {
	lookup: (name) => {
		console.log('lookup')
		return '1.2.3.4'
	}
})