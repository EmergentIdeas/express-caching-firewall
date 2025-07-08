let strings = ["\\.php", "wp-admin", "gf_page"]
let expressions
function getExpressions() {
	if(!expressions) {
		expressions = strings.map(endpoint => new RegExp(endpoint))
	}

	return expressions
}
export default function deleteCookies(rfs) {

	for(let exp of getExpressions()) {
		if(exp.test(rfs.originalRequestSummary.url)) {
			return
		}

	}
	delete rfs.originalRequestSummary.headers.cookie
}