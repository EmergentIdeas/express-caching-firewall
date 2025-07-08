import dataStructureCreation from "./data-structure-creation.mjs"
import { copyRequestHeaders } from "./summary-creation/copy-headers.mjs"
import addRequestAttributes from "./summary-creation/add-request-attributes.mjs"
import deleteSocialAttributes from "./summary-creation/delete-social-attributes.mjs"
import forbiddenEndpoints from "./authorization/forbidden-endpoints.mjs"
import deleteCookies from "./summary-creation/delete-cookies-for-wordpress.mjs"
import idGenerator from "./id-generator.mjs"
import determineBackend from "./determine-backend.mjs"
import prepareBackendRequest from "./prepare-backend-request.mjs"
import determineResponseTransformers from "./responses/determine-response-transformers.mjs"
import scheduler from './scheduler-basic.mjs'
import handleRequestWithError from "./handle-request-with-error.mjs"

export default class Lifecycle {
	
	constructor(options) {
		
		this.dataStructureCreation = options.dataStructureCreation || dataStructureCreation
		this.preCheck = options.preCheck || []
		this.requestForServiceCreation = options.requestForServiceCreation || [
			copyRequestHeaders
			, addRequestAttributes
			, deleteSocialAttributes
			, deleteCookies
		]
		this.idGenerator = idGenerator
		this.firstAuthorization = [
			forbiddenEndpoints
		]
		
		this.determineBackend = determineBackend
		this.prepareBackendRequest = prepareBackendRequest
		
		this.determineResponseTransformers = determineResponseTransformers
		
		this.scheduler = scheduler
		
		this.requestWithErrorHandler = handleRequestWithError
		
		
	}
	

}