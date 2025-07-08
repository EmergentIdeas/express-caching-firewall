export default function removeRequestHeaders(headers) {
	delete headers['connection']
	delete headers['keep-alive']
}