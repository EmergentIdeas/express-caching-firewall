export default function wait(time) {
	return new Promise((resolve, reject) => {
		setTimeout(function() {
			resolve()
		}, time)
	})
}