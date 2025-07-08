export default function determineResponseTransformers(rfs) {

	return [
		function (chunk, enconding) {
			if (this.headers['content-type'].startsWith('text/html')) {
				return chunk.toString().split('https://www.spam.com').join('http://localhost:3000')
			}
			return chunk
		}
	]
}