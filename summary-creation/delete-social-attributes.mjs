
export let socialAttributes = ['fbclid', 'mo', 'epik', 'gclid', 'gad_source', 'gad_campaignid', 'gbraid', 'sccss']

export default function deleteSocialAttributes(rfs) {
	
	for(let key of socialAttributes) {
		delete rfs.originalRequestSummary.query[key]
	}
	
	for(let key of Object.keys(rfs.originalRequestSummary.query)) {
		if(key.startsWith('utm_')) {
			delete rfs.originalRequestSummary.query[key]
		}
	}

}
