export default class InMemoryCacheDataStorage {
	constructor(options) {
		this.storage = {}
	}

	async get(key) {
		return this.storage[key]
	}

	async put(key, data) {
		this.storage[key] = data
	}

	async delete(key) {
		delete this.storage[key]
	}
}