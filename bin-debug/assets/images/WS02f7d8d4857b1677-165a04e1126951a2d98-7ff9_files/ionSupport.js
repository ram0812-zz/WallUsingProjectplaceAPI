/**
 * @author fbocse@adobe.com
 *
 */
var ionSupportBadge = function(){
	
	
	var ionSupportBadge = this;

    var opt = {}; 		//public options for the badge.
    var config = {}; 	//private options for the badge.
    var Msg = null; 	//wrapper for error.
    var instanceId = null;
    
	var Util = {};
	var User = {};	
	var Core = {};
	var Callbacks = {};
	var reqModule = {};
	var Template = {};			//wrapper for badge DOM elements, template generating methods, element behaviors
	var Instance = {};
	var Feedback = {};			//container for user input data to be sent to the server (rating, comment body)
	var HtmlEntities = {};		//container for html markup generated entities.
	
	Instance.flag = []; 		//container for this badge's instance flags (connection started/ended)
	User.flag = [];				//container for this user's settings and permissions for this badge/url combo
	Callbacks.actions = [];		//container for this badge's callbacks implementations

    
	var serverRoot = location.protocol+'//community.adobe.com/help/';
	
    config = {
		
		managerKey: null,

		//Swf proxy configurations
		proxyId : 'ionProxy',							//DOM id element for the embeded SWF proxy
		proxyFile : serverRoot + 'badge/v3/proxy.v3',	//Source file of the embeded SWF proxy
		
		//Locale configurations
		//Acceptable locale
		validLocale : ["da_DK","de_DE","en_US","es_ES","fi_FI","fr_FR","it_IT","ja_JP","ko_KR","nb_NO","nl_NL","pt_BR","ro_RO","sv_SE","zh_CN","zh_TW"],
		
		retryDelay : 200, 								//Delay between operation retries: loading proxy, loading external js files
		langFolder : serverRoot+'badge/lang/',			//Location of the language pack files
		
		//Environment configurations
		postSupportCommentURL : serverRoot+'api/v1/support/acomm.html',	//API URL path for sending support comment
		thumbsUpRatingURL: serverRoot+'api/v1/support/thumb-up.html',		//API URL path for adding thumbs up ratings
		thumbsDownRatingURL: serverRoot+'api/v1/support/thumb-down.html',	//API URL path for adding thumbs down ratings
		
		recoveryCookieName : "ach-badge-recovery",		// name of the cookie used to store temporary comment data on post failure
		supportIonCookieName : "ach-badge-support",		// name of the cookie used to store temporary comment data on post failure
		
        /* Community Help AIR Client User Agent used to deactivate the badge when loading pages. 
         * This prevents duplicate commenting controls in the same view.
         */
		CHCUserAgent: "Community Help Client",	

		//Initial settings
		maxCommentLength: 1000,
		timeOutDelay: 30000,
		
		//Service configurations
		sSkyApp:'ion',				//Name of the SocialSky application
		sSkyBucket:'support',		//Name of the SocialSky data bucket
		sSkyFormat:'json',			//Format for the data from SocialSky
		comPerPage:50				//Number of comments shown per page	
	};
	
	
	/* Util methods */
    Util.trim = function(str){
        if (typeof str !== 'string') {return null;}
        return str.replace(/^(\s)+/g, "");
    };
	
    Util.cleanURL = function(url){
        url = url.replace(/#(.*)/, "");
        url = encodeURIComponent(url);
        return url;
    };
	
	Util.getUserAgent =  function(){
		return (window.navigator && window.navigator.userAgent) ? window.navigator.userAgent : null;
	};
	
	/**
	 * Toggle off the visibility of an HTML element
	 * @param {Object} element element to hide
	 */
	Util.hide = function(element){
		if (element && typeof element == 'object'){
			element.style.display = 'none';
		}
	};
	
	/**
	 * Toggle on the visibility of an HTML element
	 * @param {Object} element element to show
	 */
	Util.show = function(element){
		if (element && typeof element == 'object'){
			element.style.display = 'block';
		}
	};

	
	/**
	 * Set a cross browser compatible event listener
	 * 
	 * @param {Object} element	element on which to listen for events
	 * @param {String} eventType name of the event to attach the lister to
	 * @param {Function} handler method to execute when the event happens
	 * @param {Boolean} capture
	 */
	Util.setEventListener = function(element, eventType, handler, capture){
		try{
			if (element){
				if (element.attachEvent) {
					element.attachEvent("on" + eventType, handler);
					Util.stopProp(window.event);
				}
				else 
					if (element.addEventListener) {
						element.addEventListener(eventType, handler, capture);
					}
			}
			return false;
		}catch (e){}
	};
	
	
	
	/**
	 * Prevent event propagation through the DOM
	 * 
	 * @param {Event} e the event for which to stop propagation
	 */
	Util.stopProp = function(e){
		e = e || window.event;
		if (!e.stopPropagation) {
			e.stopPropagation = function(){
				this.cancelBubble = true;
			};
		}
		e.stopPropagation();
	};
	
	/**
	 * Prevent default browser behavior for an event.
	 * 
	 * @param {Event} e event for which to prevent behavior
	 */		
	Util.stopBehavior = function(e){
		e = e || window.event;
		if (!e.preventDefault) {
			e.preventDefault = function(){
				this.returnValue = false;
			};
		}
		e.preventDefault();
	};
	
	
	/**
	 * Takes an array of items and creates a string with the elements. 
	 * Place a separator string between items. If no separator is set, use comma as default
	 * 
	 * @param {Object} arr array to split and build into string
	 * @param {String} separator string to place between elements
	 * 
	 * @return {String}
	 */
	Util.arrayToString =  function(arr, separator){
		if (!arr ||  arr.length == 'undefined'){
			throw new Error('Util.arrayToString: no array specified');
		}
		
		if (!separator || typeof separator !== 'string'){
			separator = ',';
		}
		var string = '';
		
		var i=arr.length; while (i--) {
			string = string + arr[i];
			if (i!== 0){
				string = string + separator;
			}
		}
		
		return string;
	};
	
	/**
	 * Strips all the whitespace from a string and checks the length 
	 * It the string does not contain any more characters it means 
	 * that it was comprised only by spaces and enters
	 * Used to check for bogus comments that include only whitespace
	 * 
	 * @param {String} string text from which to remove whitespace
	 * 
	 * @return {Boolean}
	 */
	Util.isJustWhiteSpace = function(string){
		if(!string || typeof string !== 'string'){
			return true;
		}
		
		string = string.replace(/(\s)/g,"");
	
		var isWhiteSpace = (string.length === 0)? true:false;
		return isWhiteSpace;
	};
	
	/**
	 * Use the SWF proxy to do GET or POST requests
	 * 
	 * @arg {String} url URL to call
	 * @arg {String} method type of request GET or POST
	 * @arg {Array} params parameters to append to the request
	 * @arg {String} onLoad name of the callback method to run when the server responds ok
	 * @arg {String} onError name of the callback method to run when an error is thrown
	 * @arg {String} id id of the call to be sent out
	 */
	Util.URLRequest = function() {	
		var url, method, params, onLoad, onError, id;
		var callURL = function(){
			//get an instance of the SWF proxy embeded in the page
			var proxyInstance = Template.proxy;
			
			switch (method){
				case "GET":
					proxyInstance.doGETRequest(url, params, onLoad, onError, id);
				break;
				
				case "POST":
					proxyInstance.doPOSTRequest(url, params, onLoad, onError, id);
				break;
			}
		};
		
		return {
			send:function(){
				url = this.url || null;
				method = this.method || "GET"; 
				params = this.params || {};
				onLoad = this.onLoad || null;
				onError = this.onError || null;
				id = this.id || "";
				
				callURL();
			}
		};
	};

	/**
	 * Get the value of a cookie.
	 * Returns null if the cookie doesn't exist.
	 * 
	 * @param {String} cookieName name of the cookie for which to get the value
	 * 
	 * @return {String}
	 * @return {Null}
	 */
	Util.getCookie = function(cookieName) {
		var results = document.cookie.match ('(^|;) ?' + cookieName + '=([^;]*)(;|$)');
		if (results){
			return results[2];
		}
		else{
			return null;
		}
	};
	
	/**
	 * Set a cookie with a specific value and a given expiration date in days
	 * 
	 * @param {Object} cookieName name of the cookie for which to set the value
	 * @param {Object} value value to be stored in the cookie
	 * @param {Object} expiredays number of days after which the cookie expires
	 */
	Util.setCookie = function(cookieName,value,expiredays){
		var exdate=new Date();
		exdate.setDate(exdate.getDate()+expiredays);
		document.cookie = cookieName+ "=" +escape(value)+((expiredays===null) ? "" : ";expires="+exdate.toGMTString());
	};
	
	
	

	/**
	 * Delete a set cookie by replacing it with one that expires in the past
	 * @param {Object} cookieName name of the cookie to be deleted
	 */
	Util.deleteCookie = function(cookieName){
		Util.setCookie(cookieName,"",-1);
	};
	
	/**
	 * Toggle the enabled attribute of an html element.
	 * @param {HTMLElement} htmlElement - the target html element.
	 * @param {boolean} status - true/false
	 */	
	Util.toggleInputElement = function(htmlElement, status) {
		var state = false;
		if(typeof status == Boolean) 
			state = (status == false) ? false : true;
		if (state) {
			htmlElement.removeAttribute("disabled");
		}
		else {
			htmlElement.setAttribute("disabled", "disabled");
		}
	};
	
	
	
	/**
	 * Run a number of checks at regular intervals
	 * if validCondition is true and the number of retrys has not reached zero, run the validHandler()
	 * if errorCondition is true stop retrying and run errorHandler()
	 * if the number of retrys reaches zero, run the errorHandler();
	 * 
	 * @param{Number} attempts number of times to retry
	 * @param{Number} delay	time interval between each retry
	 * @param{Function} validCondition method that returns BOOLEAN values to check if the try was successful
	 * @param{Function} errorCondition method that returns BOOLEAN values 
	 * 								   to check if an error occured or we ran out of retrys
	 * @param{Function}	validHandler method to run when the validCondition is true
	 * @param{Function} errorHandler method to run when the errorContition is true or if we ran out of retrys
	 */
	function retryChecker(){

		var self = this;
		
		/**
		 * Check if we have an errorCondition method and run it
		 * Will use this to stop retrying and use the self.errorHandler()
		 */
		var checkErrCondition =  function(){
			var err = false;
			if (self.errorCondition){
				err = self.errorCondition();
			}
			return err;
		};
		
		/**
		 * Retries the valid and error condition at regular intervals set by self.delay;
		 */
		var doRetry = function(){
			//ran out of retries. run errorHandler and stop
			if (self.attempt < 1){
				self.errorHandler();
				return;
			}
			
			var isError = checkErrCondition();	
			if (isError === true){
				self.errorHandler();
				return;
			}
			
			var isValid = self.validCondition();
			if (isValid === false){
				//retry unsuccessful.
				//reduce the number of attempts and retry after some time.
				setTimeout(function(){
					self.attempt = self.attempt-1;
					doRetry();
				},self.delay);
			}
			else{
				//the retry was successful
				self.validHandler();
			}
		};
		
		return {
			start:function(){
				self.attempt = this.attempts || 10;				
				self.validCondition = this.validCondition;
				self.validHandler = this.validHandler;
				self.errorCondition = this.errorCondition;
				self.errorHandler = this.errorHandler;
				self.delay = this.delay || 200;
			
				doRetry();
			}
		};
	};
	

	/**
	 * Check that the SWF proxy has loaded and is fully parsed.
	 * Retry the operation at set intervals for a number of attemtps until giving up.
	 * After each attempt the number of attempts is decremented by one. 
	 * Once zero attemtps is hit stop the badge.
	 * 
	 * @param {Number} attempt number of times to retry. 
	 */
	Core.checkProxy = function(attempt){
		
		var proxy = document.getElementById(config.proxyId);

		//Ran out of attemtps. 
		if (attempt < 1){ return; }

		//check if the SWF proxy is parsed by checking a function from inside it
		if (typeof proxy.doGETRequest !== 'function'){
			//Retry the check and decrement the attempts number
			setTimeout(function(){
				Core.checkProxy(attempt-1);
			},config.retryDelay);
		} else{
			//Set a reference to the DOM container of the SWF proxy
			Template.proxy = proxy;
			//Set the flag to signal that the required module has loaded
			reqModule.proxy = true;
		}
	};
	
	/**
	 * Embed the SWF proxy object into the document 
	 * Check at regular intervals if it has loaded and set flags accordingly
	 */
    Core.deployProxy = function(){
        //Embed SWFProxy
        ionComProxy.embedProxy(config.proxyId, config.proxyFile);
        setTimeout(function(){
            Core.checkProxy(opt.timeOutDelay / config.retryDelay);
        }, 2000);
    };
	
	
	/**
	 * Load each of the provided callbacks into the UDF callbacks stack 
	 */	
	Core.loadUDFCallbacks = function(){
		
		/**
		 * User can implementa UDF callback both as function or pass it 
		 * as a collection of function where multiple callbacks are required.
		 */
			
		if (opt.ratingCallbackQueue) {
			//check for Function type passed UDF callback.			
			if (typeof opt.ratingCallbackQueue == 'function') {
				Core.registerCallback(opt.ratingCallbackQueue);
			}
			//check for implementing Serializable type passed UDF collection of callbacks.
			else 
				if (typeof opt.ratingCallbackQueue !== 'string' 
					&& opt.ratingCallbackQueue.length) {
					for(var i=0; i < opt.ratingCallbackQueue.length; i++) {	
						Core.registerCallback(opt.ratingCallbackQueue[i]);
					}
				}
		}
	};
	
	
	/**
	 * Register a UDF callback to the rating success actions.
	 * @param {Object} successCallback
	 */	
	Core.registerCallback = function(successCallback) {
		if (typeof successCallback == 'function') {
			Callbacks.actions.push(successCallback);
		}
	};
	
	
	/**
	 * Consume the stack of UDF callbacks passing along the response object.
	 * @param {Object} jsonResponse
	 */
	Core.consumeRegisteredCallbacks = function(jsonResponse) {

		for(var i=0; i < Callbacks.actions.length; i++) {
			var udfCallback = Callbacks.actions[i];
			udfCallback.apply(window, [jsonResponse]);
		}
	};
	
	
	/**
	 * Shutdown the badge deployment and hide any visible UI.
	 */
	Core.stopBadge = function(){
		//console.log('silent stop');
	};
	
	
	/**
	 * Check a number times (attempts) if all the required modules have completed loading. 
	 * If everything is ok, continue with badge deployment. 
	 * Else stop the badge and show error messages accordingly.
	 * 
	 * @param {Number} attempt number of attemps to retry the check for required modules.
	 */
	Core.checkRequiredModules = function(attempt){
		
		if (attempt < 1){
			Core.stopBadge();
			return;
		}
		
		var pendingModules = 0;
		
		//TODO - Dump required modules.
		for (var i in reqModule){
			if (reqModule[i] === false){
				++pendingModules;
			}
		}
		
		if (pendingModules > 0){
			setTimeout(function(){
				Core.checkRequiredModules(attempt-1);
			},config.retryDelay);
		}
		else {
			Core.deployBadge();
		}
	};
	
	
	/**
	 * 
	 */	
	Core.deployBadge = function() {
		//setup the badge instance (comment+rating, comment or rating) 
		//used for setting up appropriate template and behavior 
		Instance.type = Core.getBadgeInstance();
		
		//Both commenting and rating have been set to false
		//We're dealing with Dr. Evil or an idiot
		if (Instance.type === 0){
			Core.stopBadge();
			return;
		}
		
		Msg = new Message();
		
		//Set the logged in status of the user 
		//User.flag['canRate'] = (Core.hasSupportCookie()) ? false : true;
		User.flag['canRate'] = true; 
		
		//Build the basic badge HTML template and append it to the document
		Template.buildBase();
		
		//Load the appropriate badge branch transaction: get comments or get ratings
		Core.triggerBranch();
	};
	
	
	/**
	 * Trigger the appropriate server communication method according to the badge Instance.type
	 * - get comments
	 * - get avg rating
	 * - get user rating
	 */
	Core.triggerBranch = function(){

		switch(Instance.type){
			case 1:
				//comment + rating badge
				Core.buildCommentArea();
			break;
			
			case 2:
				//comment badge
				Core.buildCommentArea();
			break;
			
			case 3:
				//rating badge.
				Core.buildCommentArea();
			break;
		}
	};
	
	
	
	/**
	 * 
	 */
	Core.buildCommentArea = function() {
		Core.handleInteractionControls();
	}
	
	
	
	
	/**
	 * Return the code for the badge instance type. Depending on the instance type the workflow changes. 
	 * Ex: in comment+rating instance the comment is optional
	 * 
	 * 1 = rating + comment
	 * 2 = only rating
	 * 
	 * @return {Number}
	 */
	Core.getBadgeInstance =  function(){
		var inst = 0;
		switch (opt.commenting){
			case true:
				if (opt.rating === false){
					//commenting only
					inst = 2;
				}
				else{
					//commenting + rating
					inst = 1;
				}
			break;
			
			case false:
				if (opt.rating === false){
					//none
					inst = 0;
				}
				else{
					//rating only
					inst = 3;
				}
			break;
		}
		return inst;
	};

	
	/**
	 * Check the flash player version to see if it supports the SWF proxy.
	 * Version major needs to be at least 9.
	 * 
	 * @return {Boolean}
	 */
	Core.checkFlashVersion = function(){
		var cond = false;
		var flashVer = ionComProxy.getPlayerVersion();
		if (flashVer && flashVer.major >= 9){
			cond = true;		
		}
		return cond;
	};
	
	/**
	 * Load language pack with localized strings.
	 * If forcedLocale is not set try the user's defined locale from the setup
	 * If the user's defined locale does not work this method will retry with 'en_US'
	 * If the 'en_US' language pack does not work the badge will stop loading.
	 * 
	 * @param {String} forcedLocale optional locale code to load the language pack for
	 */
	Core.loadLocale = function(forcedLocale){
		
		var lang = (!forcedLocale || typeof forcedLocale != 'string')? opt.locale:forcedLocale;
				
		//for Chinese get the language pack in full locale (zh_CN / zh_TW)
		var isChinese = lang.substring(0,2).match('zh');				
		lang = isChinese ? lang:lang.substring(0,2);			
				
		//Load the language pack
		var langPack = new LazyLoader();
		langPack.src = config.langFolder + 'ionLang_'+lang+'.js';
		langPack.objToLoad = 'ionLang';			
		langPack.onLoad = function(){
			reqModule['locale'] = true;
		};
		
		langPack.onError = function(){			
			if (opt.locale !== 'en_US'){
				//retry setup with default locale
				Core.loadLocale('en_US');
			}
		};
		
		langPack.load();
	};
	
	
	/**
	 * Set the default flags for the badge
	 */
	Core.setFlags = function (){
		
		reqModule.locale = false;		//language pack is not loaded
		reqModule.proxy = false;		//proxy is not loaded
		
		//custom login link for applications authenticating through Adobe Dev Center (Cookbooks does this)
		//set the flags for the default user rating status
		User.flag['canRate'] = true; 		//false if user has rated this before
		User.flag['rating'] = null;		//rating value of this user if he rated before. null for no rating
		
		Instance.flag['hasComments'] = false;		//check for empty badge [comments]
		Instance.flag['hasRatings'] = false; 		//check for empty badge [ratings]
		Instance.flag['loadedData'] = false; 		//switch and check when requesting comments/rating crossdomain
		Instance.currPage = null;					//current page number of comments
		Instance.pageCache = [];					//container for cached comment pages
	};
	
	/**
	 * Begin badge setup procedures.
	 * Load required files, check for flash version
	 */
	Core.setup = function(){


		//Check for Community Help AIR client userAgent and stop badge if matched
		//This is required so there aren't two commenting components in the same view
		/*
		var ua = Util.getUserAgent();
		if (ua && ua.indexOf(config.CHCUserAgent) != -1){
			Core.stopBadge();
			return false;
		}
		*/

		// register badge instance to ion proxy manager.
		Core.registerToManager();
			
		//setup the default badge flags
		Core.setFlags();
		
		//load language pack
		Core.loadLocale();
		
		//set UDF callbacks queue
		Core.loadUDFCallbacks();
		
		//Check if the flash version supports the SWF Proxy
		var flashOk = Core.checkFlashVersion();
		if (flashOk === true){
			Core.deployProxy();
		}
		else{
			reqModule.proxy = false;
		}
		
		//Run delayed checks to see if the required modules have loaded 
		Core.checkRequiredModules(opt.timeOutDelay / config.retryDelay);
	};
	
	
	/**
	 * Register to manager.
	 */
	Core.registerToManager = function() {
		config.managerKey = window.ionResponse.register(this);
	};
	

	/**
	 * Decide if to show the comment form or build it from scratch
	 * Hide the add comment button, show loading messages
	 */
	Core.showCommentForm = function(){
		
		Util.hide(Template.butAdd);
		
		if(Template.commentForm)
		{
			//we have the comment form, show it
			Util.show(Template.commentForm);
		}
		else
		{	
			//get the comment form with text area and buttons
			var form = Template.getCommentForm();
			
			//check if there is a comment recovery cookie set and populate the form with its contents
			var recoveryCookie = Util.getCookie(config.recoveryCookieName);
			
			if (recoveryCookie){
				//Core.recoverComment(recoveryCookie);
			}
			Template.addForm.appendChild(form);
			Template.commentForm = form;
		}
	};

	/**
	 * Remove the rating value from the internal object that was due for the server
	 * Remove stars / checked thumbs option
	 */
	Core.resetRating = function(){
		/**
		 * Reset the checked inputs from the thumbs rating
		 */
		var resetThumbs = function(){
			var inputs = Template.ratingModule.getElementsByTagName('input');
			if (inputs){
				for (var i=0; i<inputs.length; i++){
					inputs[i].checked = false;
				}
			}
		};

		//delete the temp stored rating value;	
		Core.deleteRating();

		//reset thumbs.
		resetThumbs();
	};

	/**
	 * Delete the stored rating value if the user has rated
	 * Used after the user has posted a comment / reset the comment
	 */
	Core.deleteRating = function(){
		if (typeof Feedback.rating == 'number'){
			delete Feedback.rating;
		}
	};
	
	
	/**
	 * Check if the user has permissions to post comments / ratings
	 */
	Core.handleInteractionControls = function(){
		//Build call to action area:  add comment button / rating control
		Template.buildCallToAction();
	};


	/**
	 * Calculate the coverage percentage of the star rating control
	 */
	Core.calculateRatingPercent = function(value){
		var coverage = value * 20;
		return coverage;
	};
	
	
	
	/**
	 * Set the user input rating to an internal object.
	 * Send to the server or wait for the user to press submit depending on the badge instance
	 * 
	 * Update the rating UI for the star rating control
	 * 
	 * @param {Number} value number of the rating
	 * 						 thumbs: 0 = thumbs down (no) / 1 = thumbs up (yes)
	 * 						 stars: number of stars
	 */
	Core.setRating = function(value){
		
		//set the rating in the object that will be queried before sending to the server.
		Feedback.rating = parseInt(value,10);
		
		//update the icons on the star rating control
		if (opt.ratingType == 1){
			Template.updateUserRatingUI(value);
		}
		
		//This is a rating badge. post the rating as soon as it comes
		Core.postRating();
		
		//	If comments is enabled show comments dialog.
		if (Instance.type === 1 || Instance.type === 2) {
			Core.showCommentForm();
		}else {
			Util.hide(Template.addForm);
		}
		
	};
	
	/**
	 * Return an array with the default application parameters for socialSky calls
	 * @return{Array}
	 */
	Core.getBasicServiceParams = function(){
		var params = [
			['app', config.sSkyApp],
			['bucket', config.sSkyBucket],
			['format', config.sSkyFormat]
		];
		
		return params;
	};


	/**
	 * Check to see if there is a temporary comment stored in the ach-recovery cookie.
	 * If there is one stored for this URL, populate the comment textarea with the content.
	 * 
	 * @param {String} cookie recovery cookie value
	 */
	Core.recoverComment = function(cookie){
		/**
		 * Get the cookie JSON string and return a JS object with its contents
		 * If you pass JSON string to a function, it is automatically parsed as JS.
		 * 
		 * @param {Object} cookieObj contents of the cookie
		 * @return {Object}
		 */
		var decodeCookie = function(cookieObj){
			var obj = {};
			
			var parts = cookieObj.split("|split|");
			
			if (parts){
				obj.url = (parts[0]!=='')? parts[0]:null;
				obj.comment = (parts[1]!=='')? parts[1]:null;
			}
			
			return obj;
		};
		
		/**
		 * Populate the comment textarea with the user's temp comment stored in the cookie
		 * @param {Object} value content of the user's comment
		 */
		var populateTextarea = function(value){
			if (value && typeof value == 'string'){
				Template.commentTextarea.value = value;
				Template.commentTextarea.className = '';
			}
		};
		
		//get the recovery object
		var recoverObj = decodeCookie(unescape(cookie));
		
		//and populate with a comment value if exists for this url
		if (recoverObj && recoverObj.url && recoverObj.url == opt.url){
			populateTextarea(recoverObj.comment);		
		}
	};
	
	
	/**
	 * Post a comment + rating (if present) to the server.
	 * Gather required parameters about the badge instance.
	 * 
	 * Post comment and append handler methods for the response
	 */
	Core.postComment = function(){	
	
		var content = Template.commentTextarea.value;
	
		var parameters = [
			['app', config.sSkyApp],
			['bucket', config.sSkyBucket],
			['o', config.sSkyFormat],
			['ion.language', opt.locale],
			['resource_id', opt.url],
			['content', encodeURIComponent(content)]
		];
		
		//TODO move badge-specific parameters (lang, sitearea, product label) to a generic getter function
		//if there is a product label specified, append it to the parameters array
		if (opt.productLabel){
			var emptyLabelValue = '';
			var labelValue = emptyLabelValue;
			
			if (typeof opt.productLabel == 'string'){
				labelValue = opt.productLabel;
			}
			else if(typeof opt.productLabel !== 'string' && opt.productLabel.length){				
				labelValue =  Util.arrayToString(opt.productLabel);
			}
			
			if (labelValue !== emptyLabelValue) {
				parameters.push(['ion..label', labelValue]);
			}
		}
		
		//if siteArea is specified append it to the parameters array
		if (opt.siteArea && typeof opt.siteArea == "string"){
			parameters.push(['ion.site', opt.siteArea]);
		}
		
		//if there is a rating set append it to the parameters array
		if (typeof Feedback.rating == 'number'){
			parameters.push(['ion.rating', Feedback.rating]);
			parameters.push(['ion.rating_type', opt.ratingType]);
		}
		
		//request id used to keep track of the response from the server
		var request = new ServerRequest();
		request.url = config.postSupportCommentURL;
		request.method = "POST";
		request.params = parameters;
		request.id = Hasher.grind().toString();
		request.onSuccess = Core.updateSupportComment;
		request.onError = function(){
			Msg.show("POST_ERROR");
			Template.behavior.onAddCommentError();
		};
		request.send();	
	};
	
	/**
	 * Handles comment posting request. 
	 * @param {Object} responseBody
	 */
	Core.updateSupportComment = function(responseBody) {
		
		//show thank you message for posting this comment
		//Template.showThanks();
			
		//update the related UI and internal variables
		Template.behavior.onAppendComment();
	};


	
	/**
	 * Take the internally stored rating value set by the user and post it to the server.
	 * Update the UI and disallow the user to rate again
	 */
	Core.postRating = function(){
		
		if (typeof Feedback.rating !== 'number'){
			//there is no rating set. Don't know how you got here :)
			return;
		}
		
		var parameters = Core.getBasicServiceParams();
		parameters.push(['resource_id',opt.url]);
		parameters.push(['content',Feedback.rating]);
		parameters.push(['ion.language', opt.locale]);
		
		//if there is a product label specified, append it to the parameters array
		if (opt.productLabel){
			var labelValue = '';
			if (typeof opt.productLabel == 'string'){
				labelValue = opt.productLabel;
			}
			else if(typeof opt.productLabel !== 'string' && opt.productLabel.length){				
				labelValue =  Util.arrayToString(opt.productLabel);
			}
			parameters.push(['ion.label', labelValue]);
		}
		
		//if siteArea is specified append it to the parameters array
		if (opt.siteArea && typeof opt.siteArea == "string"){
			parameters.push(['ion.site', opt.siteArea]);
		}
		
		var request = new ServerRequest();
		request.url = Core.getRatingUrl();
		request.method = "POST";
		request.params = parameters;
		request.id = Hasher.grind().toString();
		request.onSuccess = Core.updateSupportRating;
		request.onError = function(){
			Msg.show("ADD_RATING_ERROR");
		};
		request.send();
	};
	
	
	/**
	 * Take the response from the server for adding a rating and 
	 * update the rating UI, badge instance so the user can't rate again
	 */
	Core.updateSupportRating = function(responseBody){
		
		Core.updateRatingFlags(responseBody);
		
		//reset form view
		//Util.hide(Template.commentForm);
		Util.show(Template.addForm);

		//update the UI with new rating data
		Template.rebuildRatingUI();
		
		//remove the stored rating value
		//Core.deleteRating();
		
		//consume the UDF callbacks passing along the rating object.
		Core.consumeRegisteredCallbacks(responseBody);
	};
	
	
	/**
	 * Set the user's flags if he can rate, or if he's rate before set the rating
	 * 
	 * @param {Object} rating
	 */
	User.setRatingFlags =  function(rating){
		if(typeof rating == 'string') {
			if(rating === 'up' || rating === 'down') {
				User.flag['canRate'] = false;
				User.flag['rating'] = (rating === 'up') ? 1 : 0;
			}		
		}
	};

		
	/**
	 * 
	 * @param {Object} responseBody
	 */
	Core.updateRatingFlags = function(responseBody) {
		User.setRatingFlags(responseBody.ion.thumbs[0].content);
	};
	
	
	/**
	 * Return the correct add rating url according to the rating type and the rating value
	 * 
	 * @return{String}
	 */
	Core.getRatingUrl = function(){
		var url = null;
		//thumbs rating
		url = (Feedback.rating === 0)? config.thumbsDownRatingURL:config.thumbsUpRatingURL;
		return url;
	};

	/**
	 * Check if the user's input is a valid comment 
	 * (not blank, not default text, not whitespace)
	 * 
	 * @return{Boolean}
	 */
	Core.isValidComment = function(){
		var isValid =  true;
		var content = Template.commentTextarea.value;
		
		//check if the text ins't just whitespace (space, enter, tab);
		var bogusText = Util.isJustWhiteSpace(content);
	
		if (content === '' || content == Template.defaultCommentText || bogusText){
			//the comment is null, default of just whitespace
			isValid = false;
		}
		
		return isValid;
	};

	/**
	 * Check the response object from the server for error codes and throw error messages 
	 * or relay the object to a handler method that is expecting it.
	 * 
	 * @param {Object} response data object from the server
	 * @param {Function} handleResponse reference to a method that will use the response data if no errors code was found
	 * 					 				ex: listComments
	 */
	Core.checkForServiceErros = function(response, handleResponse){
		//Response contains an error code.
		if (response.ion && response.ion.error){
			switch(response.ion.errorCode){
				
				case "FATAL_EXCEPTION":
					Msg.show("SERVICE_ERROR");
				break;
				
				default:
					Msg.show("SERVICE_ERROR");
			}
			//if the crash didn't happen on rating badges, show the comment form so the user can retry
			if (Instance.type !== 3){
				Template.behavior.onAddCommentError();
			}	
		}
		else{
			handleResponse(response);
		}
	};


	/**
	 * Set a recovery cookie with the contents of the current comment textarea and
	 * current url so we can check when the user later returns to the comment form.
	 */
	Core.setRecoveryCookie = function(){
		if (Template.commentTextarea){
			//using custom separtor string because pipe is common in code examples
			recoveryObj = opt.url +"|split|"+ Template.commentTextarea.value;
			//set the recovery cookie and set it to expire in one day
			Util.setCookie(config.recoveryCookieName, recoveryObj, 1);
		}
	};
	
	
	/**
	 * Checks for the support badge specific cookie.
	 */
	Core.hasSupportCookie = function() {
		return false;
		if(Util.getCookie(config.supportIonCookieName) == null) {
			return false;
		} 
		return true;
	};


	
	/**
	 * Start a GET or POST request to the server, run delayed checks to see if a response has come back 
	 * and handle any errors that occur.
	 * 
	 * Requests get handled by a specified ID. 
	 * They get called to the server with this ID and added to the ionResponse queue.
	 * 
	 * @param{String} id
	 * @param{String} url
	 * @param{String} method
	 * @param{Function} onSuccess
	 * @param{Function} onError
	 * @param{Array} params
	 * @param{Number} delay
	 * @param{Number} attempts
	 * @param{String} SWFonLoad
	 * @param{String} SWFonError
	 */
	function ServerRequest(){
		var self = this;
		
		var sendRequest = function(){
			var request = buildRequest();
			var requestHandler = buildHandler();
			
			//push the request id to the queue so the SWF Proxy can deliver the response to the correct request
			ionResponse.queueRequest(self.id, config.managerKey);
			
			//reset the error response object
			ionResponse.error = null;
		
			request.send();
			requestHandler.start();

		};
		
		//Build the server request call
		var buildRequest = function(){
			var req = Util.URLRequest();
			req.url = self.url;
			req.method = self.method;
			req.params = self.params;
			req.onLoad = self.SWFonLoad;
			req.onError = self.SWFonError;
			req.id = self.id;
			
			return req;
		};
		
		/**
		 * Build and return a repetitive checker object for the valid response from the server
		 * handle any errors that occur or run the onSuccess method as a handler for valid responses
		 * 
		 * @return{Object}
		 */
		var buildHandler = function(){
			var checker = new retryChecker();
			checker.attempts = self.attempts;
			checker.delay = self.delay;
			checker.validCondition = isValidResponse;
			checker.validHandler = checkForErrors;
			checker.errorCondition = isServerError;
			checker.errorHandler = self.onError;
			
			return checker;
		};
		
		/**
		 * Check if the server seturned a valid response object for the request with the current id
		 * 
		 * @return{Boolean}
		 */
		var isValidResponse = function(){
			return ionResponse.checkForRequest(config.managerKey, self.id);
		};
		
		/**
		 * Check the server response for service error codes.
		 * Show errors if any, or handle the response with the onSuccess specified method.
		 */
		var checkForErrors = function(){
			Core.checkForServiceErros(
				ionResponse.instances[config.managerKey][self.id], 
				self.onSuccess);
		};
		
		/**
		 * Method to check if the server has returned an error during data transmission
		 * @return {Boolean}
		 */
		var isServerError = function(){
			var isErr = (ionResponse.error !== null)? true:false;
			return isErr;
		};
		
		return {
			send:function(){
				//REQUIRED params
				self.url = this.url;
				self.id = this.id;
				self.onSuccess = this.onSuccess;
				
				//OPTIONAL params
				self.onError = this.onError || Core.showServerError;
				self.attempts = this.attempts || opt.timeOutDelay / config.retryDelay;
				self.delay = this.delay || config.retryDelay;
				self.method = this.method || "GET";
				self.params = this.params || [];
				
				//methods called by the SWF proxy as callbacks
				self.SWFonLoad = this.SWFonLoad || "ionResponse.deliverResponse";
				self.SWFonError = this.SWFonError || "ionResponse.deliverError";
				
				sendRequest();
			}
		};
	};
	
	
	
	/**
	 * Show a service / server error when the connection hangs or 
	 * the server response is not valid.
	 */
	Core.showServerError = function(){
		//The server has thrown an error
		/*
		if(ionResponse.error !== null){
			alert('server error: '+ ionResponse.error);
		}
		*/
		Msg.show("SERVICE_ERROR");
	};
	
	

	
	
	/**
	 * Update the number of stars selected in the static UI for the star rating control
	 * 
	 * @param {Number} value number of stars selected by the user
	 */
	Template.updateUserRatingUI = function(value){
		if(Template.currRating){
			var percent = Core.calculateRatingPercent(value) + "%";
			Template.currRating.style.width = percent;
		}
	};
	

	/**
	 * Build call to action controls:
	 * "Add comment" button / Rating control
	 */
	Template.buildCallToAction = function(){
		
		Template.buildAddForm();
		
		//Build the rating module container (this will be flushed after the used has rated).
		Template.buildRatingContainer();
		
		//Build the rating module content: label and controls
		Template.buildRatingModule();
		
		var fix = Template.getClearFix();
		Template.addForm.appendChild(fix);
	};
	

	/**
	 * Build the form that will contain user interaction modules:
	 * add comment button, add comment form, rating control
	 */
	Template.buildAddForm = function(){
		// TODO - please document this change.
		var addForm = Template.breedElement({
			type: 'form',
			className: 'ionComAddForm',
			method: 'POST',
			action: '#',
			parent: Template.base
		});
		
		addForm.spawn();
		
		//set a reference to the add form
		Template.addForm = addForm.reference();
	};
	
	/**
	 * Build and return the HTML markup for a button element with onclick behavior attached
	 * 
	 * @param {Object} text	content of the button display
	 * @param {Object} onClick	method to run when clicking on the button
	 * @param {Object} idName optional HTML id name of the button if we need persistant references
	 * 
	 * @return {Object}
	 */
	Template.getButton = function(text, onClick, idName){
		var but = document.createElement('a');
		but.className = 'ionButton';
		but.href = "#";
		but.innerHTML = text;
				
		if (idName && typeof idName == "string"){
			but.id = idName;
		}
		
		//Stop default browser beavior and execute the specified method on click
		Util.setEventListener(but, 'click', function(e){
			Util.stopBehavior(e);
			onClick();
		}, false);
		
		return but;
	};


	/**
	 * 
	 */
	Template.buildRatingModule = function(){
		Template.buildRatingLabel();
		Template.buildRatingControl();
	};
	
	
	/**
	 * Build the rating module container and append to the add form
	 */
	Template.buildRatingContainer = function(){

		// TODO - please document this change.
		var module = Template.breedElement({
			type: 'div',
			className: 'ionComRating',
			style: { cssFloat: 'left', styleFloat: 'left'},
			parent: Template.addForm
		});
		module.spawn();
		//get a DOM reference to the rating module from the page
		Template.ratingModule = module.reference();
	};

	
	/**
	 * Method that resets the rating UI components and the stored rating value.
	 * Used after adding comments / rating to update the view
	 */
	Template.rebuildRatingUI = function(){
		//run the operation only if the user has rated in this session.
		if (opt.rating){
			//reset the contents
			Template.ratingModule.innerHTML = '';
			
			//run the build script again to take into account the user's rating
			Template.buildRatingModule();
		}
	};


	/**
	 * Build the rating control depending on the badge ratingType and user rating status
	 * If the user has already rated:
	 * 		- stars: show his rating in stars
	 * 		- thumbs: show his positive / negative rating as string
	 */
	Template.buildRatingControl = function(){
		//placeholder for the rating control builder method to run
		var ratingControl;
		
		/**
		 * Build the star rating control with behavior and append to the screen
		 */
		var buildStarRating = function(){	
			//create an inline-box wrapper
			var wrapper = Template.getInlineWrapper();
			
			//get a base template of the star rating list
			var baseList = Template.getStarRatingList();
			
			//get a base template of the star rating preview (how many stars selected)
			var preview = Template.getStarRating();				
			preview.id = "ionUserRating";
			
			//append the rating preview to the rating list template		
			baseList.appendChild(preview);
			
			//append the active star rating control to the inline wrapper
			wrapper.appendChild(baseList);
			
			//get an array of active stars (clickable)
			var stars = getActiveRatingStars();
			if (stars instanceof Array){			
				var len = stars.length;
				for (var i=0; i<len; i++){
					//append active star control to the rating list
					baseList.appendChild(stars[i]);
				}
			}		
				
			//set a referecence to the current rating item so we can change it if the user rates
			Template.currRating = preview;
			Template.starList = baseList;			
		
			//Append the rating control to the rating module
			Template.ratingModule.appendChild(wrapper);
		};
		
		/**
		 * Build an array of List elements that contain active star rating controls.
		 * When clicking the star controls the rating is set in a queue / sent to the server.
		 * The rating preview in the "add form" is also updated.
		 * 
		 * @return {Object}
		 */
		var getActiveRatingStars = function(){
			//array container for active star controls
			var activeStars = [];
			
			//map of rating value to css class name of the star rating control
			var stars = {
				"1":"one-star",
				"2":"two-stars",
				"3":"three-stars",
				"4":"four-stars",
				"5":"five-stars"
			};
			
			for (var i in stars) {
				var li = document.createElement('li');
				var ctrl = document.createElement('a');
				ctrl.className = stars[i];
				ctrl.innerHTML = i;
				ctrl.href = "#";
				
				Util.setEventListener(ctrl, 'click', function(value){
					return function(evt){
						//Prevent the browser from follwing the # hash of the rating control
						Util.stopBehavior(evt);
						
						//set the rating as a numeric value
						Core.setRating(parseInt(value, 10));
					};
				}(i), false);
						
				li.appendChild(ctrl);
				activeStars.push(li);
			}
			
			return activeStars;
		};
		
		/**
		 * Build the rating preview for the user to show his rating for this article, if he has set one
		 */
		var buildStaticStarRating = function(){
			if (typeof User.flag['rating'] == 'number'){
				var ratingPreview = Template.getStaticStarRating(User.flag['rating']);
				
				//get an inline wrapper to keep the stars and label on the same row
				var wrapper = Template.getInlineWrapper();
				wrapper.appendChild(ratingPreview);
				
				//Append the user's last rating to the add form as a preview
				Template.ratingModule.appendChild(wrapper);
			}
		};
		
		var getActiveThumb = function(name, value){
			var thumb;
			
			//IE doesn't fully comply with DOM standards and
			//cannot add "name" attribute to dynamically created elements
			try{
				thumb = document.createElement('<input type="radio" name="'+ name +'">');
			}
			catch(e){}
			
			//DOM Compliant Browsers
			if (!thumb || !thumb.name){
				thumb = document.createElement('input');
				thumb.type = 'radio';
				thumb.name = name;
			}
			
			thumb.value = value;
			
			return thumb;
		};
		
		/**
		 * Build the thumbs (yes/no) rating control
		 * Users have two options to express their opinion in regards to an article:
		 * Positive / Negative
		 * 
		 * Clicking on the radion control for positive/negative will set the value 
		 * in an internal object and trigger any UI changes
		 */
		var buildThumbsRating = function(){
			
			var container = Template.breedElement({
				type: 'span',
				id: 'ionThumbRatingGroup',
				parent: Template.ratingModule
			});
			
			container.create();

			var yesLabel = document.createElement('label');	
			var noLabel = document.createElement('label');
			var yesInput = getActiveThumb('ionThumbsRating', 1);
			var noInput = getActiveThumb('ionThumbsRating', 0);
			
			yesLabel.innerHTML = ionLang.label.labelYes;
			noLabel.innerHTML = ionLang.label.labelNo;
			
			//make sure that the user has not submited a rating.
			if (User.flag['rating'] === null || User.flag['rating'] == false) {
				/*
				 * can't set "for" attribute to label via DOM creation procedure
				 * this is a workaround so when clicking the label, the radio control also gets clicked.
				 */
				Util.setEventListener(yesLabel, 'click', function(){
					yesInput.click();
				});
				
				Util.setEventListener(noLabel, 'click', function(){
					noInput.click();
				});
				
				//set the rating when clicking the radio input
				Util.setEventListener(yesInput, 'click', function(){
					Core.setRating(yesInput.value);
				});
				
				Util.setEventListener(noInput, 'click', function(){
					Core.setRating(noInput.value);
				});
			}else {
				//disable rating input elements.
				Util.toggleInputElement(yesInput, false);
				Util.toggleInputElement(noInput, false);
			}
			
			container.ghost().appendChild(yesInput);
			container.ghost().appendChild(yesLabel);
			container.ghost().appendChild(noInput);
			container.ghost().appendChild(noLabel);
			
			container.spawn();
		};	
		
		if (User.flag['canRate'] === true){
			//Decide which type of active rating control to show
			ratingControl = (opt.ratingType === 2)? buildThumbsRating():buildStarRating();
		}
		else{
			//Show inactive rating control with last selected value
			ratingControl = (opt.ratingType === 2)? '':buildStaticStarRating();
		}
	};
	
	/**
	 * Build the rating module label DOM element
	 */
	Template.buildRatingLabel =  function(){
		var label =  document.createElement('span');
		label.className = (User.flag['canRate'] === true) ? 'ionLabel' : 'ionLabel thankyou';
		label.innerHTML = Template.getRatingLabelString();
		//append the rating label to the rating module container
		Template.ratingModule.appendChild(label);
	};
	
	
	/**
	 * Return the correct string for the rating module container 
	 * according to the rating type (stars/thumbs) or if the user has already rated this.
	 */
	Template.getRatingLabelString = function(){
		var str;
		
		/**
		 * get the rating label if the user has rated on this badge
		 */
		var getRatedString = function(){
			var ratedStr;
			ratedStr = ionLang.support.thanksForRating;
			return ratedStr;
		};
		
		/**
		 * get the rating label if the user has not rated before on this badge
		 */
		var getUnRatedString = function(){
			var unRatedStr;
			unRatedStr = ionLang.support.ratingLabelThumbs;
			return unRatedStr;
		};
		
		/**
		 * get the correct label based on the user's permission to rate
		 */
		if(User.flag['canRate'] === true){
			str = getUnRatedString();
		}
		else{
			//"user has already rated" label
			str = getRatedString();
		}
		
		return str;
	};
	
	
	/**
	 * Create or reuse a DOM element with the thanks message for posting a comment.
	 * Append this DOM element to the last comment on the commenting list.
	 */
	Template.showThanks = function(){
	
		/**
		 * Build and return a DOM el with the thanks message block
		 * 
		 * @return{Object}
		 */
		var getThanksMessage = function(){
			var el = document.createElement('p');
			el.innerHTML = ionLang.prompt.thanks;
			el.className = "ionComMessage";
			return el;
		};
		
		var thanks = (Template.thanks)? Template.thanks : getThanksMessage();
		
		Template.commentForm.parentNode.appendChild(thanks);
		Template.thanks = thanks;
	};
	
	
	
	
	

	/**
	 * Dynamic Script Loading
	 * 
	 * - load a JS file into the head of the current page 
	 * - retry loading for a custom number of times after a custom set delay in milliseconds
	 * - run a custom method when successfully loaded
	 * - run a custom method when the file is not valid or 404
	 * 
	 * 
	 * @param {String} src path to the script to be loaded
	 * @param {String} objToLoad reference to an object in the file to be loaded. Used to check if the file was loaded and parsed
	 * @param {Function} onLoad function to run on successful load  
	 * @param {Function} onError function to run on an invalid or 404 file
	 * 
	 * @arg {Number} attempts number of times to retry loading the script. Default: 10 
	 * @arg {Number} delay millisecond between each attempt to load the script. Default: 1000 (1 second)
	 */
 	function LazyLoader(){
		var src=null;
		var objToLoad='';
		var onLoad=function(){};
		var onError=function(){};
		var attempts=10;
		var delay=1000;
			
		return{				
			load:function(){
				var that = this;
				that.delay = that.delay? that.delay : delay;
				that.attempts = that.attempts? that.attempts : attempts;
				
				if (!that.src){
					that.onError();
					return;
				}
						
				var scriptEl = document.createElement('script');
				scriptEl.src = that.src;
				scriptEl.type = 'text/javascript';
				
				scriptEl.addEventListener && function(){
					scriptEl.addEventListener('error',function(){
						that.onError();
						that.unload();
					},false);
					scriptEl.addEventListener('load',function(){										
						that.waitToLoad(0);
					},false);
	
				}();
					
		    	scriptEl.onreadystatechange = function(){					
					if ((this.readyState !=='complete' && this.readyState !== 'loaded') || this.readyState == 'complete'){
						that.waitToLoad(0);
					} 	
				};
							
				document.getElementsByTagName('head')[0].appendChild(scriptEl);
				that.scriptEl = scriptEl;	
			},
			
			unload:function(){
				document.getElementsByTagName('head')[0].removeChild(this.scriptEl);
			},
		
			waitToLoad : function(attempt){
				var that = this;				
				if (attempt >= that.attempts){
					that.onError();
					that.unload();
					return;
				}			
				
				var pattern = new RegExp(/^\w+$/);
				var typeofObject = pattern.test(that.objToLoad)? eval("typeof " + that.objToLoad) : "undefined";
				
				if (typeofObject == 'object' || typeofObject == 'function'){
					that.onLoad();
				}
				else{
					setTimeout(function(){that.waitToLoad(attempt + 1);}, delay);
					return;	
				}		
			}
		};							
	};
	
	/**
	 * Message handling mechanism: 
	 * error / prompts, message showing, message replacing
	 */
	var Message = function(){
		var CSS_ERROR ="ionComErr";				//css class for error message containers
		var CSS_NOTICE = "ionComNotice";		//css class for warning message containers
		var CSS_MESSAGE = "ionComMessage";		//css class for plain message containers
		var CSS_LOADING = "ionComLoading";		//css class for loading message containers
		var activeList = {};					//container for messages visible on screen and appended to the DOM
		
		/**
		 * JSON map of possible messages with 
		 * 	message code
		 *  message text
		 *  array of message codes that this message can replace on the template 
		 *  	
		 *  css class of the message container (error, notice)
		 */
		var map = {
			"SERVICE_OFF": {
				text: ionLang.error.noService,								//text content for the message
				canReplace: ["NO_COMM", "NO_REVIEW", "LOAD_COMM"],			//message codes of messages this one can replace
				cssClass: CSS_ERROR											//css class name of the message container
			},
			
			"SERVICE_ERROR": {
				text: ionLang.error.errServer,
				canReplace: ["LOAD_COMM", "LOAD_REVIEW", "LOAD_COMM","ADD_COMM","ADD_RATING","NO_COMM","NO_REVIEW","SERVICE_ERROR"],
				cssClass: CSS_ERROR
			},
			
			"LOAD_COMM": {
				text: ionLang.prompt.loadingComments,
				canReplace: [],
				cssClass: CSS_LOADING
			},
			
			"LOAD_FORM": {
				text: ionLang.prompt.loadingAddForm,
				canReplace: [],
				cssClass: CSS_LOADING
			},
			
			"POST_ERROR":{
				text: ionLang.error.postComment,
				canReplace: ["ADD_COMM","ADD_RATING"],
				cssClass: CSS_ERROR
			},
			
			"ADD_COMM":{
				text: ionLang.prompt.postComment,
				canReplace: ["NULL_COMM","NO_COMM","NO_REVIEW","LOGIN_EXPIRED","POST_ERROR","NO_LOGIN","SERVICE_ERROR"],
				cssClass: CSS_LOADING
			},
			
			"ADD_RATING":{
				text: ionLang.prompt.postRating,
				canReplace: ["NULL_COMM","NO_RATING","NO_REVIEW","LOGIN_EXPIRED","POST_ERROR","NO_LOGIN","SERVICE_ERROR"],
				cssClass: CSS_LOADING
			},
			
			"ADD_RATING_ERROR":{
				text: ionLang.error.errAddRating,
				canReplace: ["ADD_RATING","NO_COMM","NO_REVIEW","NO_RATING"],
				cssClass: CSS_ERROR
			},
			
			"AVG_RATING_ERROR":{
				text: ionLang.error.errAvgRating,
				canReplace: ["ADD_RATING"],
				cssClass: CSS_NOTICE
			},
			
			"NULL_COMM": {
				text: ionLang.prompt.blankComment,
				canReplace: ["NULL_COMM"],
				cssClass: CSS_NOTICE
			},
			
			"NO_LOGIN": {
				//text: Template.getLoginString(),
				text : "No_Login",
				canReplace: ["LOAD_COMM","ADD_COMM","ADD_RATING","NO_LOGIN"],
				cssClass: CSS_MESSAGE
			},
			
			"LOGIN_EXPIRED": {
				text: ionLang.prompt.loginExpired,
				canReplace: ["LOAD_COMM","ADD_COMM","ADD_RATING"],
				cssClass: CSS_NOTICE
			},
			
			"NO_SCREENNAME": {
				//text: Template.getNoScreenNameString(),
				text: "no_screenname",
				canReplace: ["LOAD_COMM"],
				cssClass: CSS_NOTICE
			},
			
			"NO_RATING":{
				text: ionLang.prompt.noRatings,
				canReplace: ["LOAD_COMM"],
				cssClass: CSS_MESSAGE
			},
			
			"NO_COMM": {
				text: ionLang.prompt.noComments,
				canReplace: ["LOAD_COMM"],
				cssClass: CSS_MESSAGE
			},
			
			"NO_REVIEW": {
				text: ionLang.prompt.noReviews,
				canReplace: ["LOAD_REVIEW"],
				cssClass: CSS_MESSAGE
			},
			
			"FEEDBACK_OFF":{
				text: ionLang.prompt.disabledComments,
				canReplace: ["LOAD_COMM", "LOAD_REVIEW", "LOAD_COMM","NO_COMM","NO_REVIEW"],
				cssClass: CSS_MESSAGE
			}
		};
		
		
		/**
		 * Remove messages that this message can overwrite
		 * 		ex: a server communication error "SERVER_ERROR" replaces a comment loading message "LOAD_COMM"
		 * 
		 * @param {String} msgCode message code of the new message that can overwrite other messages
		 */
		var removeObsoleteMessages = function(msgCode){			
			for (var i in map[msgCode].canReplace){
				var msgToReplace = map[msgCode].canReplace[i];

				if (typeof activeList[msgToReplace] !== 'undefined'){
					removeMessageNode(activeList[msgToReplace]);			
					//remove the visible message
					delete activeList[msgToReplace];
				}
			}
		};
		
		/**
		 * Remove the DOM node with the message from the UI
		 * @param {Object} node reference to the DOM node to be removed
		 */
		var removeMessageNode = function(node){
			if (typeof node == 'object'){
				Template.msgContainer.removeChild(node);
			}
		};
		
		var createMessage = function(msgObj, customText){
			var msgNode = document.createElement('div');
			msgNode.className = msgObj.cssClass;
			msgNode.innerHTML = customText || msgObj.text;
			
			return msgNode;
		};
			
		return {
			show: function(msgCode, customText){
				var msgObj = map[msgCode];
				
				if (msgObj) {
					//remove any items that this message overwrites
					removeObsoleteMessages(msgCode);
					
					//create and append the message node
					var msg = createMessage(msgObj, customText);
					Template.msgContainer.appendChild(msg);
					
					//store the active message code and DOM reference for future removal
					activeList[msgCode] = msg;
				}
			},
			
			remove: function(msgCode){				
				if(activeList[msgCode]){
					//remove the DOM element identified by specified message code
					removeMessageNode(activeList[msgCode]);
					
					//remove the visible message
					delete activeList[msgCode];
				}
			}
		};
	};
	
	
	
	
	
	/**TEMPLATE-AREA**/
	
	/**
	 * Build basic badge HTML template: header, comment list container, add Button
	 */
	Template.buildBase = function(){
		
		// TODO - please document this change.
		var base = Template.breedElement({
			type: 'div',
			className: 'ionCom',
			parent: opt.container
		});
		base.spawn();
		//set a reference to the base container.
		Template.base = base.reference();
		
		//Don't apply to rating only badge. 
		//This is a common base template for comment & comment+rating badge
		if (Instance.type !== 3){
			Template.buildHeader();
		}	
		
		// TODO - please document this change.
		//Create the container where notifications / errors wil be shown
		var msgContainer = Template.breedElement({
			type: 'div',
			className: 'ionMessageContainer',
			parent: Template.base
		});
		msgContainer.spawn();
		//set a reference to the base container.
		Template.msgContainer = msgContainer.reference();
		
		return base;
	};
	
	
	/**
	 * Build the comments / ratings header at the top of the comments list
	 */
	Template.buildHeader = function(){
		
		Template.buildHeaderContainer();
		
		//header containers are floated - apply a clearFix CSS hack to clear the container
		var floatFix = Template.getClearFix();
		Template.comHeader.appendChild(floatFix);
	};
	
	/**
	 * Build the DIV element at the top of the comments list. 
	 * This holds the number of comments, rating summary and comments RSS link
	 */
	Template.buildHeaderContainer = function(){
		// TODO - please document this change.
		var header = Template.breedElement({
			type: 'div',
			className: 'ionComHeader',
			parent: Template.base
		});
		header.spawn();
		//Append the base element to the badge container specified by the setup
		Template.comHeader = header.ghost();
	};
	

	/**
	 * Breed template.
	 * @param {Object} configs
	 */	
	Template.breedElement = function(configs) {
		
		var valid = { types:['div', 'form', 'span', 'h1', 'h2', 'h3',  'ul', 'a', 'textarea'] };
		var Core = {};
		var config = {};
		var init = configs;
		var element;
		var loaded = false;
		var created = false;
		
		Core.create = function() {
			Core.setup();
			Core.createElement();
			created = true;
		};
		
		Core.spawn = function() {
			if (created) {
				Core.birth();
			}else {
				Core.create();
				Core.birth();				
			}	
		}
		
		Core.setup = function() {
			if(Core.load()) {
				Core.check();
				Core.generator();
			}
		};
		
		Core.check = function() {
			if (typeof config.id == 'undefined') {
				config.generated.push("id");
			}
		};
		
		Core.generator = function() {
			for (el in config.generated) {
				if(config.hasOwnProperty(config.generated[el]))
					config[config.generated[el]] = config.generator();
			}
		};
		
		Core.createElement = function() {
			element = document.createElement(config.type);
			element.id = config.id;
			element.className = (typeof config.className != 'undefined') ? config.className : '';
			element.innerHTML = config.innerHTML;
			if(typeof config.href != 'undefined')
				element.href = config.href;
			if(typeof config.rows != 'undefined')
				element.rows = config.rows;
			if(typeof config.cols != 'undefined')
				element.cols = config.cols;
			if(typeof config.action != 'undefined')
				element.action = config.action;
			if(typeof config.method != 'undefined')
				element.method = config.method;
			if(typeof config.style != 'undefined') {
				for(el in config.style) {
					element.style[el] = config.style[el];	
				}
			}
		};
		
		Core.appendTo = function(parent) {
			config.parent = (typeof init.parent == 'object') ? init.parent : undefined;
			Core.spawn();	
		};
		
        Core.birth = function() {
                config.parent.appendChild(element);
        };

		
		Core.isValid = function(validCollection, element) {
			for(el in validCollection) {
				if(validCollection[el] === element) 
					return true;
			}
			return false;
		};
		
		Core.load = function() {
			if(!loaded)
				return Core._load();
			return false;	 	
		};
		
		Core._load = function() {
			
			//parent overload
			parentOverload = (typeof config.parent != 'undefined') ? config.parent : undefined;
			
			if (typeof init != 'object')
				return false;
				
			if(typeof init.type != 'string' || !Core.isValid(valid.types, init.type))
				return false;
				
			config.type = init.type;
			config.generated = (typeof init.generated == 'array') ? init.generated : new Array();
			config.id  = (typeof init.id == 'string') ? init.id : undefined; 
			config.className = (typeof init.className == 'string') ? init.className : undefined;
			config.generator = (typeof init.generator == 'function') ? init.generator : Hasher.grind;
			config.innerHTML = (typeof init.innerHTML == 'string') ? init.innerHTML : '';
			config.parent = (typeof init.parent == 'object') ? init.parent : parentOverload;
			config.method = (typeof init.method == 'string') ? init.method : undefined;
			config.action = (typeof init.action == 'string') ? init.action : undefined;
			config.style = (typeof init.style == 'object') ? init.style : undefined;
			config.cols = (typeof init.cols == 'number') ? init.cols : undefined;
			config.rows = (typeof init.rows == 'number') ? init.rows : undefined;
			config.href = (typeof init.href == 'string') ? init.href : undefined;
			
			loaded = true;
			return true;
		};
		
		return {
			spawn: function() {
				Core.spawn();
			}, 
			create: function() {
				Core.create();
			},
			reference: function() {
				return $('#'+config.id+'');
			},
			ghost: function() {
				return element;
			},
			appendTo: function(parent) {
				Core.appendTo(parent);
			}
		};
	};
	
	
	
	
	
	/**
	 * Build and return a SPAN element with a descriptive string 
	 * containing the number of people that found this resource helpful
	 * 
	 * @return{Object}
	 */
	
	Template.createEl = function(elType, elParams){
		if (elParams && typeof elParams !== 'object'){
			throw new Error("Template.createEl() Incorect parameter: elParams Expected: object, got: "+ typeof elParams);
		}
		
		var el = document.createElement(elType);
		if (elParams){
			for (var key in elParams){
				switch(key.toString()){
					case "value":
						el.value = elParams[key];
					break;
					
					case "innerHTML":
					case "html":
					case "text":
						el.innerHTML = elParams[key];
					break;
					
					case "className":
						el.className = elParams[key];
					break;
					
					default:
					el.setAttribute(key.toString(), elParams[key]);
				}
				
			}
		}
		return el;
	};
	
	
	/**
	 * Generate the badge header string with the number of comments or reviews
	 * Based on the badge instance the string varies for "comments" or "comments+rating"
	 * 
	 * @param {String} count number of comments/reviews
	 */
	Template.getHeadingCountString = function(count){
		var str = ionLang.label.commentsHeading;
		var comNr = (count)? count:'0';	
		str+= ' ('+comNr+')';
		return str;
	};
	
	/**
	 * Build and return a 'clearfix' css hack element to be used after floating elements.
	 * 
	 * @return {Object}
	 */
	Template.getClearFix = function(){
		var el = document.createElement('br');
		el.className = 'ionClearFix';
		return el;
	};
	
	
	/**
	 * Build and return the comment form DOM object so the user can add his comment
	 * 
	 * @return {Object}
	 */
	Template.getCommentForm = function(){
		//set the default comment textarea content to an internal Template property
		Template.setDefaultCommentText();
		
		/*
		//comment textarea and button wrapper
		var addBlock = document.createElement('div');
		addBlock.id = 'ionComAdd';
		*/
		// TODO - document this change.
		var addBlock = Template.breedElement({
			type: 'div',
			className: 'ionComAdd'
		});
		
		addBlock.create();
		
		
		/*
		//comment input element
		var textArea = document.createElement('textarea');
		textArea.rows = '6';
		textArea.cols = '50';
		textArea.id = 'ionComTextArea';
		textArea.className = 'ionComLegend';
		textArea.innerHTML = Template.defaultCommentText;
		*/
		var textArea = Template.breedElement({
			type: 'textarea',
			rows: 6,
			cols: 50,
			className: 'ionComLegend',
			innerHTML: Template.defaultCommentText,
			parent: addBlock.ghost()
		});
		
		textArea.spawn();

		
		Util.setEventListener(textArea.ghost(), 'focus', Template.behavior.onFocusTextarea, false);
		Util.setEventListener(textArea.ghost(), 'blur', Template.behavior.onBlurTextarea, false);
		Util.setEventListener(textArea.ghost(), 'keyup', Template.behavior.onKeyUp, true);
		
		//Set a reference to the comment textarea for future manipulation / reset
		Template.commentTextarea = textArea.ghost();
		
//		addBlock.ghost().appendChild(textArea.ghost());
		
		//Create info panel.
		var infoPanel = document.createElement('fieldset');
		var maxLimitInfo = document.createElement('span');
		maxLimitInfo.innerHTML = ionLang.support.maxCommentCharactersLimit;
		infoPanel.appendChild(maxLimitInfo);
		
		//Append info panel.
		addBlock.ghost().appendChild(infoPanel);
		
		//Create control elements.
		var controls = document.createElement('fieldset');
		var butSubmit = Template.getButton(ionLang.label.butSubmit, Template.behavior.onSubmit);
		controls.appendChild(butSubmit);
		var butCancel = Template.getButton(ionLang.support.butNoFeedback, Template.behavior.onCancel);
		controls.appendChild(butCancel);

		//Append control elements.
		addBlock.ghost().appendChild(controls);
	
		//Append legal notice.
		var noticeLegal = document.createElement('fieldset');
		var legalText = document.createElement('span');
		legalText.style.cssFloat="right";
		legalText.style.styleFloat="right";
		legalText.innerHTML = ionLang.support.legalLinkExpression;				
		noticeLegal.appendChild(legalText);
				
		addBlock.ghost().appendChild(noticeLegal);
		
		return addBlock.ghost();
	};
	
	
	/**
	 * Wrapper for comment form elements event behaviors (click, focus, blur)
	 */
	Template.behavior = {  
	
		onCancel: function(){
			Template.resetAddForm();
		},
		
		onEdit: function(){
			//TODO-PREVIEW Util.hide(Template.commentPreview);
			Util.show(Template.commentForm);
			Util.show(Template.ratingModule);
		},
		
		onSubmit: function() {
			
			var hasComment = Core.isValidComment();
			
			if (!hasComment){
				Template.resetAddForm();
			}
			else{
				Msg.show('ADD_COMM');
				Core.postComment();
				Util.hide(Template.addForm);
			}
		},
		
		onAppendComment: function(){	
		
			//reset the add comment form to its initial state
			Template.resetAddForm();
			
			//remove a comment recovery cookie if any was set. the message was successfuly posted
			Util.deleteCookie(config.recoveryCookieName);
		},
		
		/**
		 * This groupd of behaviors gets executed after the badge fails in posting a comment / reiew
		 * The recover comment cookie is set so the user can retrieve his comment
		 * The form is shown so the user can copy his comment to another safe location.
		 */
		onAddCommentError: function(){
			
			Core.setRecoveryCookie();
			
			if (Template.addForm){
				Util.show(Template.addForm);
				Util.show(Template.commentForm);
			}
		},
		
		onKeyUp: function() {
			if(Template.commentTextarea.value.length > opt.maxComLength) {
				Template.commentTextarea.value =
					Template.commentTextarea.value.substring(0, opt.maxComLength);
				return false;	
			}
		},
		
		onFocusTextarea: function(){
			if (Template.commentTextarea.className !== 'ionComLegend'){
				return;
			}
			else{
				Template.commentTextarea.value = '';
				Template.commentTextarea.className = '';
			}		
		},
		
		onBlurTextarea: function(){
			if (Template.commentTextarea.value === ''){
				Template.resetTextarea();
				return;
			}
		}
	};
	
	
	/**
	 * Update the rating summary in the badge header.
	 * This is called when a new rating has been registered to update the UI
	 */
	Template.updateRatingHeading = function(){
		if (opt.ratingType == 2 && Instance.type == 1){			
			var newRating = Template.getRatingSummary(false);
		
			if (typeof newRating == 'object') {
				Template.ratingHeading.innerHTML = '';
				Template.ratingHeading.appendChild(newRating);
			}
		}
	};
	
	
	/**
	 * Build and return a DIV containing a summarization of the rating for this resource.
	 * Summary depends on badge opt.ratingType: 
	 * 		1 - show stars and total number of ratings
	 * 		2 - show nr of ratings and number of positive ratings
	 * 
	 * @param {Boolean} isAnchor return a summary element with an anchor to the rating control
	 */
	Template.getRatingSummary = function(isAnchor){
		
		/**
		 * get the link for the anchor.
		 * if the rating control is created, anchor links to it, else links to the comment list
		 * 
		 * @return{String}
		 */
		var getAnchorTarget = function(){
			var target = Template.base.id;
			
			if (Template.addForm){
				target = Template.addForm.id;
			}
			else if(Template.comHeading){
				target = Template.comHeading.id;
			}
			
			return "#" + target;
		};
		
		/**
		 * Build an return a DIV container for the summary.
		 * If the summary is destined for the anchor apply a special ID to the container
		 */
		var getSummaryContainer = function(){
			var params = {};
			if (isAnchor){
				params.id = "ionRatingAnchor";
			}
			
			return Template.createEl('div',params);
		};
		
		var getThumbsSummary = function(){
			var baseString;
			//number of positive ratings
			var nrYes = (typeof Instance.thumbsUpCount == 'number')? Instance.thumbsUpCount:0;
			
			//total number of ratings (positive+negative)
			var count = (typeof Instance.ratingCount !== "number")? 0 : Instance.ratingCount;
			
			if (count === 0){
				baseString = "0";
			}
			else{
				//add number of positive ratings and number of total ratings to localized summary string
				baseString = ionLang.label.summaryThumbs.replace(/\{proRatingCount\}/g, nrYes).replace(/\{ratingCount\}/g, count);
			}
			
			var container = Template.createEl('span',{
				//populate container with string for number of people that found this helpful
				text:baseString,
				className:"ionSummary"
			});
			
			return container;
		};
		
		/**
		 * Build and return a DOM element as the ratings label
		 * if isAnchor is true the return is an anchor with a link to the rating control
		 * if isAnchor is false the return is a plain inline element
		 */
		var getRatingsLabel = function(){
			var label, type; 
			var params = {};
			params.text = ionLang.label.ratingPlural + ":";
			
			if (isAnchor){
				type = 'a';
				params.href = getAnchorTarget();
			}
			else{
				type = 'strong';
			}
			//build and return the ratings label element
			return Template.createEl(type,params);
		};
		
		
		//build the summary container 
		var cont = getSummaryContainer();
		
		if (opt.ratingType == 2){
			//thumbs rating summary
			var ratingsLabel = getRatingsLabel();
			var summary = getThumbsSummary();
			
			cont.appendChild(ratingsLabel);
			cont.appendChild(summary);
		}
		else{
			//stars rating summary
			var anchorTarget = getAnchorTarget();
			var ratingStars = Template.getStaticStarRating(Instance.avgRating, 'small');
			var nrRatingsEl = Template.getRatingCountElement('a',{href:anchorTarget});
			
			//get a inline wrapper element so that ratings and stars appear on one line
			var wrapper = Template.getInlineWrapper();
			wrapper.appendChild(ratingStars);
			
			cont.appendChild(wrapper);
			cont.appendChild(nrRatingsEl);
		}
		
		return cont;
		
	};
	
	/**
	 * Reset the add comment textarea to the default styling and legend message (call to action)
	 * Remove any messages that might have been triggered 
	 * :(comment null, comment overflow, comment limit in place)
	 */
	Template.resetTextarea = function(){
		//Set the legend-type styling
		Template.commentTextarea.className = 'ionComLegend';
		
		//Add the default text to the comment form textarea
		Template.commentTextarea.value = Template.defaultCommentText;
	};
	
	/**
	 * Reset all the input elements on the add form to their original state
	 * reset textarea, reset rating, 
	 * show add comment button, hide preview and comment input form
	 */
	Template.resetAddForm = function(){
		
		//TODO-PREVIEW Util.hide(Template.commentPreview);
		Util.hide(Template.commentForm);
		Util.show(Template.butAdd);
		Util.show(Template.ratingModule);
		Util.show(Template.addForm);
		
		//remove any commenting form messages that might have been triggered	
		Msg.remove('NULL_COMM');			
		Msg.remove('LONG_COMM');
		Msg.remove('LIMIT_COMM');
		Msg.remove('ADD_COMM');
		
		//Bring the add comment textarea to the initial state
		Template.resetTextarea();
		
		//Reset the rating UI and remove any stored values
		if (opt.rating){
			Core.resetRating();
		}
	};
	
	/**
	 * Set the default text in the comment textarea in a variable 
	 * according to the instance type (comment + rating: thumbs rating, star rating; comment)
	 * 
	 * We'll use this value to:
	 * 		check if the user has entered a comment
	 * 		populate the textarea if the user erases everything
	 */
	Template.setDefaultCommentText = function(){
		//Comment + rating badge
		if (Instance.type == 1){
			Template.defaultCommentText = ionLang.support.commentDefaultText;
		}
		else{
			//Comment badge
			Template.defaultCommentText = ionLang.support.commentDefaultText;
		}
	};

	
	
	
	/**
	 * Container for callback methods used by the SWF Proxy after GET / POST transactions
	 * Object will be exposed publicly so it can be called via ExternalInterface in ActionScript 3 with parameters.
	 * 
	 * REASON FOR MAKING THIS OBJECT PUBLIC:
	 * "Private" JavaScript methods can be referenced to ActionScript 3 via ExternalInterface 
	 * but AS3 can't call them with parameters. All expected parameters in JS will return undefined.
	 */
	var ionResponseOLD = {
		error: null,		//placeholder for any error message thrown by the server
		queue:[],			//container for triggered server requests. used to check if the response has come back
				
		
		/**
		 * Push a new request to the triggered resuqests queue.
		 * The queue is used to keep track of server responses that return / fail
		 * 
		 * @param {Object} reqId id of the request to the server
		 */
		queueRequest : function(reqId){
			if (!reqId || typeof reqId !== 'string'){
				throw new Error("ionResponse.addRequestToQueue: missing request id");
			}
			
			//add this request id to the queue and reset it
			this.queue[reqId] = null;
		},
		
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
		parse: function(JSONString){
			var obj = (typeof JSONString == 'string')? eval('(' + JSONString + ')'):null;
			return obj;
		},
		
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
		deliverResponse : function(respText, param2, param3, responseId){
			if (this.queue[responseId] === null){
				this.queue[responseId] = this.parse(respText);
			}
		},

		/**
		 * Method called by the SWF Proxy 
		 * when the server throws an unexpected error code
		 * 
		 * @param {String} errorMsg error message sent by the server.
		 */
		deliverError: function(errorMsg){
			this.error = errorMsg;
		}
	};
	
	
	/**
	 * Simple CSS-like selector by ID or className
	 * Return a DOM object identified by the selector
	 * 
	 * @param {String} selector CSS-like selector: #elementId or .elementClass
	 * @return {Object}
	 */
	var $ = function(selector){
		var domObj;

		if (!selector){
			return null;
		}
		
		//check if the selector is actually a valid DOM Object
		if (typeof selector == 'object' && selector.parentNode){
			domObj = selector;
		}
		else if (typeof selector == 'string'){
			switch (selector.substring(0,1)){
				//the selector is requesting by ID
				case '#':
					domObj = document.getElementById(selector.substring(1));
				break;
				//the selector is requesting by class name
				case '.':
					
				break;
			} 
		}
		
		return domObj;
	};
	
	
var ionComProxy = {
	createSWF:function(attObj, parObj, id) {
		var SHOCKWAVE_FLASH = "Shockwave Flash";
		var SHOCKWAVE_FLASH_AX = "ShockwaveFlash.ShockwaveFlash";
		var FLASH_MIME_TYPE = "application/x-shockwave-flash";
		var UNDEF = "undefined";
		
		var ua ={};
		ua.ie  = (navigator.appVersion.indexOf("MSIE") != -1) ? true : false;
		ua.win = (navigator.appVersion.toLowerCase().indexOf("win") != -1) ? true : false;
		var isOpera = (navigator.userAgent.indexOf("Opera") != -1) ? true : false;
		
		var u = navigator.userAgent.toLowerCase();
		ua.webkit = /webkit/.test(u) ? parseFloat(u.replace(/^.*webkit\/(\d+(\.\d+)?).*$/, "$1")) : false; // returns either the webkit version or false if not webkit
		
		var r, el = document.getElementById(id);
		
		if (el) {
			if (typeof attObj.id == UNDEF) { // if no 'id' is defined for the object element, it will inherit the 'id' from the alternative content
				attObj.id = id;
			}
			if (ua.ie && ua.win) { // IE, the object element and W3C DOM methods do not combine: fall back to outerHTML
				var att = "";
				for (var i in attObj) {
					if (attObj[i] != Object.prototype[i]) { // Filter out prototype additions from other potential libraries, like Object.prototype.toJSONString = function() {}
						if (i.toLowerCase() == "data") {
							parObj.movie = attObj[i];
						}
						else if (i.toLowerCase() == "styleclass") { // 'class' is an ECMA4 reserved keyword
							att += ' class="' + attObj[i] + '"';
						}
						else if (i.toLowerCase() != "classid") {
							att += ' ' + i + '="' + attObj[i] + '"';
						}
					}
				}
				var par = "";
				for (var j in parObj) {
					if (parObj[j] != Object.prototype[j]) { // Filter out prototype additions from other potential libraries
						par += '<param name="' + j + '" value="' + parObj[j] + '" />';
					}
				}
				el.outerHTML = '<object classid="clsid:D27CDB6E-AE6D-11cf-96B8-444553540000"' + att + '>' + par + '</object>';
				r = document.getElementById(attObj.id);	
			}
			else if (ua.webkit && ua.webkit < 312) { // Older webkit engines ignore the object element's nested param elements: fall back to the proprietary embed element
				var e = createElement("embed");
				e.setAttribute("type", FLASH_MIME_TYPE);
				for (var k in attObj) {
					if (attObj[k] != Object.prototype[k]) { // Filter out prototype additions from other potential libraries
						if (k.toLowerCase() == "data") {
							e.setAttribute("src", attObj[k]);
						}
						else if (k.toLowerCase() == "styleclass") { // 'class' is an ECMA4 reserved keyword
							e.setAttribute("class", attObj[k]);
						}
						else if (k.toLowerCase() != "classid") { // Filter out IE specific attribute
							e.setAttribute(k, attObj[k]);
						}
					}
				}
				for (var l in parObj) {
					if (parObj[l] != Object.prototype[l]) { // Filter out prototype additions from other potential libraries
						if (l.toLowerCase() != "movie") { // Filter out IE specific param element
							e.setAttribute(l, parObj[l]);
						}
					}
				}
				el.parentNode.replaceChild(e, el);
				r = e;
			}
			else { // Well-behaving browsers
				var o = document.createElement("object");
				o.setAttribute("type", FLASH_MIME_TYPE);
				for (var m in attObj) {
					if (attObj[m] != Object.prototype[m]) { // Filter out prototype additions from other potential libraries
						if (m.toLowerCase() == "styleclass") { // 'class' is an ECMA4 reserved keyword
							o.setAttribute("class", attObj[m]);
						}
						else if (m.toLowerCase() != "classid") { // Filter out IE specific attribute
							o.setAttribute(m, attObj[m]);
						}
					}
				}
				for (var n in parObj) {
					if (parObj[n] != Object.prototype[n] && n.toLowerCase() != "movie") { // Filter out prototype additions from other potential libraries and IE specific param element
						ionComProxy.createObjParam(o, n, parObj[n]);
					}
				}
				el.parentNode.replaceChild(o, el);
				r = o;
			}
		}
		return r;
	},
	
	createObjParam:function(el, pName, pValue) {
		var p = document.createElement("param");
		p.setAttribute("name", pName);	
		p.setAttribute("value", pValue);
		el.appendChild(p);
	},
	
	AC_Generateobj:function(objAttrs, params, embedAttrs){
		 
		var isIE  = (navigator.appVersion.indexOf("MSIE") != -1) ? true : false;
		var isWin = (navigator.appVersion.toLowerCase().indexOf("win") != -1) ? true : false;
		var isOpera = (navigator.userAgent.indexOf("Opera") != -1) ? true : false;
		
	  var str = '';
	  if (isIE && isWin && !isOpera) {
	    str += '<object ';
	    for (var i in objAttrs){
	      str += i + '="' + objAttrs[i] + '" ';
	    }
	    str += '>';
	    for (var i in params){
	      str += '<param name="' + i + '" value="' + params[i] + '" /> ';
	    }
	    str += '</object>';
	  }
	  else{
	    str += '<embed ';
	    for (var i in embedAttrs){
	      str += i + '="' + embedAttrs[i] + '" ';
	    }
	    str += '> </embed>';
	  }
	  return str;
	},
	
	AC_FL_RunContent:function(){
	  var now = new Date();		
	  var cacheControl = Date.parse(now);
	  var ret = this.AC_GetArgs(  arguments, ".swf?cc="+cacheControl, "movie", "clsid:d27cdb6e-ae6d-11cf-96b8-444553540000", "application/x-shockwave-flash");
	  return this.AC_Generateobj(ret.objAttrs, ret.params, ret.embedAttrs);
	},
	
	AC_GetArgs:function(args, ext, srcParamName, classid, mimeType){
	  var ret = [];
	  ret.embedAttrs = [];
	  ret.params = [];
	  ret.objAttrs = [];
	  for (var i=0; i < args.length; i=i+2){
	    var currArg = args[i].toLowerCase();    
	
	    switch (currArg){	
	      case "classid":
	        break;
	      case "pluginspage":
	        ret.embedAttrs[args[i]] = args[i+1];
	        break;
	      case "src":
	      case "movie":	
	        args[i+1] = this.AC_AddExtension(args[i+1], ext);
	        ret.embedAttrs["src"] = args[i+1];
	        ret.params[srcParamName] = args[i+1];
	        break;
	      case "onclick":
	      case "onload":
	      case "type":
	      case "codebase":
	        ret.objAttrs[args[i]] = args[i+1];
	        break;
	      case "id":
	      case "width":
	      case "height":
	      case "name":
	      case "tabindex":
	        ret.embedAttrs[args[i]] = ret.objAttrs[args[i]] = args[i+1];
	        break;
	      default:
	        ret.embedAttrs[args[i]] = ret.params[args[i]] = args[i+1];
	    }
	  }
	  ret.objAttrs["classid"] = classid;
	  if (mimeType) {
	  	ret.embedAttrs["type"] = mimeType;
	  }
	  return ret;
	},
	
	getPlayerVersion:function(){
		var PlayerVersion = new ionComProxy.PlayerVersion([0,0,0]);
		if(navigator.plugins && navigator.mimeTypes.length){
			var x = navigator.plugins["Shockwave Flash"];
			if(x && x.description) {
				PlayerVersion = new ionComProxy.PlayerVersion(x.description.replace(/([a-z]|[A-Z]|\s)+/, "").replace(/(\s+r|\s+b[0-9]+)/, ".").split("."));
			}
		}else{
			try{
				var axo = new ActiveXObject("ShockwaveFlash.ShockwaveFlash");
				for (var i=3; axo!==null; i++) {
					axo = new ActiveXObject("ShockwaveFlash.ShockwaveFlash."+i);
					PlayerVersion = new ionComProxy.PlayerVersion([i,0,0]);
				}
			}catch(e){}
			if (PlayerVersion.major != 6) {
				try{
					PlayerVersion = new ionComProxy.PlayerVersion(axo.GetVariable("$version").split(" ")[1].split(","));
				}catch(e){}
			}
		}
		return PlayerVersion;
	},
	
	PlayerVersion:function(arrVersion){
		this.major = parseInt(arrVersion[0],10) !== null ? parseInt(arrVersion[0],10) : 0;
		this.minor = parseInt(arrVersion[1],10) || 0;
		this.rev = parseInt(arrVersion[2],10) || 0;
	},
	
	embedSWF: function(swfUrlStr, replaceElemIdStr, widthStr, heightStr, swfVersionStr, xiSwfUrlStr, flashvarsObj, parObj, attObj) {
			if (!swfUrlStr || !replaceElemIdStr || !widthStr || !heightStr || !swfVersionStr) {
				return;
			}
			
			var OBJECT = "object";
			widthStr += ""; // Auto-convert to string
			heightStr += "";

				var att = {};
				if (attObj && typeof attObj === OBJECT) {
					for (var i in attObj) {
						if (attObj[i] != Object.prototype[i]) { // Filter out prototype additions from other potential libraries
							att[i] = attObj[i];
						}
					}
				}
				att.data = swfUrlStr;
				att.width = widthStr;
				att.height = heightStr;
				var par = {}; 
				if (parObj && typeof parObj === OBJECT) {
					for (var j in parObj) {
						if (parObj[j] != Object.prototype[j]) { // Filter out prototype additions from other potential libraries
							par[j] = parObj[j];
						}
					}
				}
				if (flashvarsObj && typeof flashvarsObj === OBJECT) {
					for (var k in flashvarsObj) {
						if (flashvarsObj[k] != Object.prototype[k]) { // Filter out prototype additions from other potential libraries
							if (typeof par.flashvars != UNDEF) {
								par.flashvars += "&" + k + "=" + flashvarsObj[k];
							}
							else {
								par.flashvars = k + "=" + flashvarsObj[k];
							}
						}
					}
				}
				
			ionComProxy.createSWF(att, par, replaceElemIdStr);
	
		},
		
	embedProxy:function(proxyId, proxyFile){

		var proxyContainer = document.createElement('div');
		proxyContainer.id = proxyId;
		document.body.appendChild(proxyContainer);

		var file =config.proxyFile+".swf";
		var flvars = {};
		var params = {
			allowscriptaccess:'always'
		};
		
		ionComProxy.embedSWF(file, config.proxyId, "1", "1", "9.0.0",'',flvars,params);
	}	
};

	
	
	return  {
		
		load: function(){
			//get the resource url
			if (this.url && typeof this.url == 'string') {
				var safeURL = Util.trim(this.url);
			}
			
			var _url = (safeURL && safeURL.length > 1) ? safeURL : window.location.toString();
			var _mcl = this.maxCommentLength;
			var _hash = window.location.hash.toString();
			
			opt.hash = _hash.substring(1);
			opt.url = Util.cleanURL(_url);
			opt.locale = (this.locale && typeof this.locale == 'string') ? this.locale : "en_US";
			opt.container = (typeof this.container == 'object') ? this.container : document.body;
			opt.anchor = (typeof this.anchor == 'object') ? this.anchor : null;
			opt.commenting = (this.commenting === false) ? false : true;
			opt.rating = (this.rating === false) ? false : true;
			opt.ratingType = (this.ratingType == 'thumbs') ? 2 : 1; //1: stars, 2: thumbs
			opt.siteArea = this.siteArea || null;
			opt.productLabel = this.productLabel || null;
			opt.timeOutDelay = (typeof this.timeOutDelay == 'number') ? this.timeOutDelay : 30000;
			opt.maxComLength = (typeof _mcl == 'number' && _mcl < 1000) ? _mcl : 1000;
			opt.ratingCallbackQueue = this.ratingCallbackQueue || null;
			
			Core.setup();

			//Set default fallbacks to the output settings object
			this.commenting = opt.commenting;
			this.rating = true;
			this.ratingType = "thumbs";
			this.locale = opt.locale;
			this.siteArea = opt.siteArea;
			this.productLabel = opt.productLabel;
			this.ratingCallbackQueue = opt.ratingCallbackQueue;
			this.maxCommentLength = opt.maxComLength;
			this.url = (this.url && typeof this.url == 'string') ? this.url : window.location.toString();
		},
		
		getSetupParams: function() {
			return (typeof opt.url !== 'undefined')
				? opt
				: null;
		}
	};
};


/**
 * Hash functionality for base64 enconding.
 */
var Hasher = {
	
	// private property
	_keyStr: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",
	
	// hash maker.
	grind: function() {
		return Hasher._encode(Math.random().toString());
	},
	
	// public method for encoding
	_encode: function(input){
		var output = "";
		var chr1, chr2, chr3, enc1, enc2, enc3, enc4;
		var i = 0;
		input = Hasher._utf8_encode(input);
		while (i < input.length) {
			chr1 = input.charCodeAt(i++);
			chr2 = input.charCodeAt(i++);
			chr3 = input.charCodeAt(i++);
			enc1 = chr1 >> 2;
			enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
			enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
			enc4 = chr3 & 63;
			if (isNaN(chr2)) {
				enc3 = enc4 = 64;
			}
			else 
				if (isNaN(chr3)) {
					enc4 = 64;
				}
			output = output +
			this._keyStr.charAt(enc1) +
			this._keyStr.charAt(enc2) +
			this._keyStr.charAt(enc3) +
			this._keyStr.charAt(enc4);
		}
		return output;
	},
	// private method for UTF-8 encoding
	_utf8_encode : function (string) {
		string = string.replace(/\r\n/g,"\n");
		var utftext = "";
		for (var n = 0; n < string.length; n++) {
			var c = string.charCodeAt(n);
			if (c < 128) {
				utftext += String.fromCharCode(c);
			}
			else if((c > 127) && (c < 2048)) {
				utftext += String.fromCharCode((c >> 6) | 192);
				utftext += String.fromCharCode((c & 63) | 128);
			}
			else {
				utftext += String.fromCharCode((c >> 12) | 224);
				utftext += String.fromCharCode(((c >> 6) & 63) | 128);
				utftext += String.fromCharCode((c & 63) | 128);
			}
		}
		return utftext;
	}
};
