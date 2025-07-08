import { commonForbiddenEndpoints } from "../data/common-forbidden-endpoints.mjs";
import response401 from "../responses/response-401.mjs";

let expressions
function getExpressions() {
	if(!expressions) {
		expressions = commonForbiddenEndpoints.map(endpoint => new RegExp(endpoint))
	}

	return expressions
}

export default function forbiddenEndpoints(rfs) {
	let url = rfs.originalRequestSummary.url
	
	for(let exp of getExpressions()) {
		if(exp.test(url)) {
			return response401
		}
	}	
}