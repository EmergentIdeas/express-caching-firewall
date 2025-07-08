export default function createTextSubstitutionHeaderTransformer(originalText, substiutionText) {
	return function(key, value) {
		if(value && typeof value === 'string') {
			value = value.split(originalText).join(substiutionText)
			return [key, value]
		}
		else {
			return [key, value]
		}
	}
}