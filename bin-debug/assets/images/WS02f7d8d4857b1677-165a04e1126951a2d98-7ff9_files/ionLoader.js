var ionReadyLoad = function(func){
    var oldonload = window.onload;
    if (typeof window.onload != 'function') {
        window.onload = func;
    }
    else {
        window.onload = function(){
            if (oldonload) {
                oldonload();
            }
            func();
        };
    }
};


var ionResponseManager = function() {
	
		var Core = {};
		error = null;		
		Core.queue = [];
		Core.instances = [];
		
		/**
		 * Push a new request to the triggered requests queue.
		 * The queue is used to keep track of server responses that return / fail
		 * 
		 * @param {Object} reqId id of the request to the server
		 */
		Core.queueRequest = function(reqId, objReference){
			if (!reqId || typeof reqId !== 'string'){
				throw new Error("ionResponse.addRequestToQueue: missing request id");
			}
			Core.instances[objReference][reqId] = null;
		};
		
		/**
		 * Transforms a JSON String into a valid JS object and returns it 
		 * or returns null if the string format isn't valid. 
		 * I know eval is evil, but we'll trust the server.
		 * 
		 * @param {String} JSONString string in JSON format to be evaled and retuned as an object
		 * 
		 * @return {Object}
		 * @return {null}
		 */
		Core.parse = function(JSONString){
			var obj = (typeof JSONString == 'string') ? eval('(' + JSONString + ')') : null;
			return obj;
		};
		
		/**
		 * Method called by the SWF Proxy with the response text for a given request.
		 * This updates the response queue with the appropriate response for the request id.
		 * Request ids are set before the call is made and when the respons comes, they point to the correct data object
		 * 
		 * @param {Object} respText respText response text sent by the server
		 * @param {Object} param2
		 * @param {Object} param3
		 * @param {Object} responseId id of the server call
		 */
		Core.deliverResponse = function(respText, param2, param3, responseId){
			for(el in Core.instances) {
				if(Core.instances[el][responseId] === null) {
					Core.instances[el][responseId] = Core.parse(respText);
				}
			}
		};
		
		Core.checkForRequest = function(managerKey, requestId) {
			if(typeof Core.instances[managerKey][requestId] !== 'object'
				|| Core.instances[managerKey][requestId] === null) {
					return false;
			}
			return true;
		};

		/**
		 * Method called by the SWF Proxy 
		 * when the server throws an unexpected error code
		 * 
		 * @param {String} errorMsg error message sent by the server.
		 */
		Core.deliverError = function(errorMsg){
			Core.error = errorMsg;
		};
	
	
		/**
		 * 
		 */
	 	Core.register = function() {
			var reference = Math.random().toString();
			Core.instances[reference] = new Array();
			return reference;			
		};
		
		
		return {
			register : function(instanceId) {
				return Core.register(instanceId);
			}, 
			queueRequest: function(requestId, objReference) {
				Core.queueRequest(requestId, objReference);
			},
			parse: function(jsonString) {
				Core.parse(jsonString);
			},
			deliverResponse: function(responseContent, param2, param3, responseId) {
				Core.deliverResponse(responseContent, param2, param3, responseId);
			},
			checkForRequest: function(managerKey, requestId) {
				return Core.checkForRequest(managerKey, requestId);
			},
			
			queue : Core.queue,
			
			instances : Core.instances
		}; 
};


var ionResponse = new ionResponseManager();

