
export default function createDeleteHeadersTransform(headers) {
	return function(key, value) {
		if(headers.includes(key)) {
			return [null, null]
		}
		return [key, value]
	}
}