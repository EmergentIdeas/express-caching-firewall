export default function transformHeaders(headers, transformers) {
	key: for(let key of Object.keys(headers)) {
		for(let transformer of transformers) {
			let [newKey, newValue] = transformer(key, headers[key])
			if(!newKey) {
				delete headers[key]
				continue key
			}
			else if(newKey === key) {
				headers[key] = newValue
			}
			else {
				delete headers[key]
				headers[newKey] = newValue
				key = newKey
			}
		}
	}
}