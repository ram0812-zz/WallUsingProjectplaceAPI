/**
 * @author rcaliman@adobe.com
 * 
 * Term Conventions:
 * 		Comment: Data for a text comment to be listed or added
 * 		Review: Data for a text comment + rating value to be listed or added
 * 
 * Instance Type Conventions:
 * 		Type 0: badge without commenting and without rating - silent shutdown.
 * 		Type 1: badge with commenting and rating enabled
 * 		Type 2: badge with only commenting enabled
 * 		Type 3: badge with only rating enabled 
 */
var ionBadge = function(){
	//private
	var opt = {};				//public options for the badge - set by the user
	var config = {};			//private options for the badge - set by the dev (server root, api urls, etc.)
	var Util = {}; 				//object with helper / misc functions
	var Instance = {};			//wrapper for this badge's instance related flags and methods
	var User = {};				//wrapper for this user's settings and permissions for this badge/url combo
	var Core = {};				//wrapper for badge framework
	var Template = {};			//wrapper for badge DOM elements, template generating methods, element behaviors
	var reqModule = {};			//container  for required modules to complete loading before the badge can be deployed
	var loginURL = [];			//container for login urls (Adobe Dev Center has different url. Expecting others to request this)
	var Msg = null;				//wrapper for error / prompt message handling mechanism
	var Feedback = {};			//container for user input data to be sent to the server (rating, comment body)
	
	Instance.flag = []; 		//container for this badge's instance flags (connection started/ended)
	User.flag = [];				//container for this user's settings and permissions for this badge/url combo
		
	var serverRoot = location.protocol+'//community.adobe.com/help/';

	config = {
		
		managerKey: null,
		
		//SWF Proxy config
		proxyId : 'ionProxyContrib',							//DOM id element for the embeded SWF proxy
		proxyFile : serverRoot + 'badge/v3/proxy.v3',	//Source file of the embeded SWF proxy
		
		//Acceptable locale strings
		validLocale : ["da_DK","de_DE","en_US","es_ES","fi_FI","fr_FR","it_IT","ja_JP","ko_KR","nb_NO","nl_NL","pt_BR","ro_RO","sv_SE","zh_CN","zh_TW"],
		
		//Core badge config
		retryDelay : 200, 									//Delay between operation retries: loading proxy, loading external js files
		langFolder : serverRoot+'badge/lang/',				//Location of the language pack files
		
		//Environment config
		getReviewsURL: serverRoot+'api/v1/commenting/lrev.html',			//API URL path for getting comments
		getCommentsURL: serverRoot+'api/v1/commenting/lcomm.html',			//API URL path for getting comments
		postCommentsURL: serverRoot+'api/v1/commenting/acomm.html',			//API URL path for adding comments
		starRatingURL: serverRoot+'api/v1/rating/arate.html',				//API URL path for adding star ratings
		thumbsUpRatingURL: serverRoot+'api/v1/thumbs/thumb-up.html',		//API URL path for adding thumbs up ratings
		thumbsDownRatingURL: serverRoot+'api/v1/thumbs/thumb-down.html',	//API URL path for adding thumbs down ratings
		getAvgStarRatingURL: serverRoot+'api/v1/rating/avgrate.html',		//API URL path for getting the average stars rating
		getAvgThumbRatingURL: serverRoot+'api/v1/thumbs/avgthumb.html',		//API URL path for getting the average thumbs rating
		profileServer : serverRoot+"profile/index.html",					//URL of the profile page
		updateUserURL: serverRoot+'api/v1/admin/updateMe.html',				//API URL path for updating the user's screen name
		commentsFeedURL: serverRoot + 'rss/comments.html',
		
		recoveryCookieName : "ach-badge-recovery",		// name of the cookie used to store temporary comment data on post faliure
		screenNameCookieName: "ach-scr",				// name of the user's ion+ screen name
		
		CHCUserAgent: "Community Help Client",	/* Community Help AIR Client User Agent used to deactivate the badge when loading pages. 
														 * This prevents duplicate commenting controls in the same view.
														 */
		
		//Service config
		sSkyApp:'ion',				//Name of the SocialSky application
		sSkyBucket:'url',			//Name of th SocialSky data bucket
		sSkyFormat:'json',			//Format for the data from SocialSky
		comPerPage:50				//Number of comments shown per page
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
				text: Template.getLoginString(),
				canReplace: ["LOAD_COMM","ADD_COMM","ADD_RATING","NO_LOGIN"],
				cssClass: CSS_MESSAGE
			},
			
			"LOGIN_EXPIRED": {
				text: ionLang.prompt.loginExpired,
				canReplace: ["LOAD_COMM","ADD_COMM","ADD_RATING"],
				cssClass: CSS_NOTICE
			},
			
			"NO_SCREENNAME": {
				text: Template.getNoScreenNameString(),
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
	
	/**
	 * Begin badge setup procedures.
	 * Load required files, check for flash version
	 */
	Core.setup = function(){	
	
		//Check for Community Help AIR client userAgent and stop badge if matched
		//This is required so there aren't two commenting components in the same view
		var ua = Util.getUserAgent();
		if (ua && ua.indexOf(config.CHCUserAgent) != -1){
			Core.stopBadge();
			return false;
		}
		
		// register badge instance to ion proxy manager.
		Core.registerToManager();
		
		//setup the default badge flags
		Core.setFlags();
		
		//load language pack
		Core.loadLocale();
		
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
	 * Build basic badge HTML template: header, comment list container, add Button
	 */
	Template.buildBase = function(){
		
		var base = document.createElement('div');
		base.id = 'ionCom';
		
		//Append the base element to the badge container specified by the setup
		opt.container.appendChild(base);
		
		//set a reference to the badge's base DOM element
		Template.base = $('#ionCom');
		
		//Don't apply to rating only badge. 
		//This is a common base template for comment & comment+rating badge
		if (Instance.type !== 3){
			Template.buildHeader();
			Template.buildList();				
		}	
		
		//Create the container where notifications / errors wil be shown
		var msgContainer = document.createElement('div');
		msgContainer.id = 'ionMessageContainer';
		
		Template.base.appendChild(msgContainer);
		Template.msgContainer = $('#ionMessageContainer');	
		
		return base;
	};
	
	/**
	 * Build an empty list that will hold comments / reviews
	 */
	Template.buildList = function(){
		//create an empty comment list for future items (comments/reviews)
		var commentsList = document.createElement('ul');
		commentsList.id = 'ionComList';	
		
		//append the empty comment list to the badge container
		Template.base.appendChild(commentsList);
		
		//set a reference to the comment list DOM object
		Template.comList = $('#ionComList');
	};
	
	/**
	 * Build the comments / ratings header at the top of the comments list
	 */
	Template.buildHeader = function(){
		Template.buildHeaderContainer();
		
		//build the comments heading + container
		Template.buildCommentsHeading();
		
		if (opt.ratingType == 2){
			//build the thumbs rating heading + container
			Template.buildRatingHeading();
		}
		
		//build the comments RSS feed link + container
		Template.buildFeedHeading();
		
		//Autodiscovery link for RSS that the browser highlights in the address bar
		Template.buildFeedAutodiscovery();
		
		//header containers are floated - apply a clearFix CSS hack to clear the container
		var floatFix = Template.getClearFix();
		Template.comHeader.appendChild(floatFix);
	};
	
	/**
	 * Build and attach the DOM element with the RSS feed link for the commenting badge header 
	 * 
	 * @return {void}
	 */
	Template.buildFeedHeading = function(){
		//build a DIV container for the comments feed link
		var feedContainer = Template.createEl('div',{
			id:"ionSummary-feed",
			className:"inline-right"
		});
		
		//build the comments feed link
		var feedLink = Template.getFeedLink();
		
		//appent the comments feed link to its container for the badge header
		feedContainer.appendChild(feedLink);
		
		//append the feed link container to the badge header
		Template.comHeader.appendChild(feedContainer);
	};
	
	/**
	 * Build a comments RSS autodiscovery link and attach it to the document 
	 * so that the browser can consume it
	 * 
	 * @return {void}
	 */
	Template.buildFeedAutodiscovery = function(){
		var url = Core.getFeedURL();
		var title = ionLang.label.commentPlural + ' - '+ document.title.toString();
		
		Util.setRSSAutodiscovery(url, title);
	};
	
	/**
	 * Build the rating heading in the badge header
	 */
	Template.buildRatingHeading = function(){
		var ratingHeading = Template.createEl('div',{
			id:"ionSummary-ratings",
			className:"inline-left"
		});
		
		//yes/no rating badge: build rating summary in header
		var ratingSummary = Template.getRatingSummary(false);
		
		//append the rating summary to its container for the badge header
		ratingHeading.appendChild(ratingSummary);
		
		//append rating heading to the badge header
		Template.comHeader.appendChild(ratingHeading);
		
		//set a reference to the rating heading as a DOM object
		Template.ratingHeading = ratingHeading;
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
	 * Build the DIV element at the top of the comments list. 
	 * This holds the number of comments, rating summary and comments RSS link
	 */
	Template.buildHeaderContainer = function(){
		var header = Template.createEl('div',{id:"ionComHeader"});
		Template.base.appendChild(header);
		
		//set a reference to the badge header container DOM object
		Template.comHeader = header;
	};
	
	/**
	 * Build the badge heading according to the instance: Comments / Reviews
	 */
	Template.buildCommentsHeading = function(){
		//comments heading container with item count (comments/reviews)
		var headingContainer = Template.createEl('div',{
			id:"ionSummary-comments",
			className:"inline-left"
		});
		
		//comments heading with item count (comments/reviews)
		var headingEl = Template.createEl('strong',{
			id:"ionComHeading",
			className:"ionIcon ionIconComment",
			text:Template.getHeadingCountString()
		});
		
		//append the comment summary element to its container
		headingContainer.appendChild(headingEl);
		
		//append the badge heading to the badge container
		Template.comHeader.appendChild(headingContainer);
		
		//set a reference to the badge heading DOM object
		Template.comHeading = $('#ionComHeading');	
	};
	
	/**
	 * Update the comment heading at the top of the comment list
	 * with the number of comments
	 */
	Template.updateHeadingCount = function(){
		Template.comHeading.innerHTML = Template.getHeadingCountString(Instance.commentCount);
	};
	
	/**
	 * Build and return a HTML link element to the RSS feed 
	 * with the comments for this resource. 
	 * The output RSS is localized based on the locale sent from the badge
	 * 
	 * @return {Object} hyperlink
	 */
	Template.getFeedLink = function(){
		var feedLink = Template.createEl('a',{
			className: "ionIcon ionIconFeed",
			title: ionLang.label.commentFeedTitle,
			text: ionLang.label.commentPlural,
			href: Core.getFeedURL()
		});
		return feedLink;
	};
	
	/**
	 * Get the URL for the comments RSS feed
	 * @return {String}
	 */
	Core.getFeedURL = function(){
		return config.commentsFeedURL + "?resource_id=" + opt.url + "&hl=" +opt.locale;
	};
	
	/**
	 * Build call to action controls:
	 * "Add comment" button / Rating control
	 */
	Template.buildCallToAction = function(){
		Template.buildAddForm();
		
		//badge has commenting
		if (Instance.type !== 3){
			Template.buildAddButton();
		}
		
		//badge has rating
		if (Instance.type !== 2){
			//Build the rating module container (this will be flushed after the used has rated)
			Template.buildRatingContainer();
			
			//Build the rating module content: label and controls
			Template.buildRatingModule();
		}

		var fix = Template.getClearFix();
		Template.addForm.appendChild(fix);
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
		var lang = ionLang.label;
		//Comment + rating badge
		if (Instance.type == 1){
			Template.defaultCommentText = lang.ratingDefaultText;
		}
		else{
			//Comment badge
			Template.defaultCommentText = lang.commentDefaultText;
		}
	};
	
	/**
	 * Wrapper for comment form elements event behaviors (click, focus, blur)
	 */
	Template.behavior = {
		onCancel: function(){
			Template.resetAddForm();
		},
		
		onPreview: function(){	
			var hasComment = Core.isValidComment();
			if (!hasComment){
				//the comment is null, default of just whitespace. throw empty comment error
				Msg.show("NULL_COMM");
			}
			else{
				//build or show the comment preview container
				Core.showCommentPreview();

				var previewEl = document.createElement('div');
				var contentEl = document.createElement('p');
				var content = Template.commentTextarea.value;
				
				contentEl.innerHTML = Util.formatText(content);
				
				Template.commentPreviewArea.innerHTML = '';
						
				//Decide and show the rating preview
				if (typeof Feedback.rating == 'number'){
					var ratingPreview = Template.getStaticRating(opt.ratingType, Feedback.rating);
					
					//append the rating preview
					previewEl.appendChild(ratingPreview);
					Template.commentPreviewArea.appendChild(previewEl);
				}
				
				//append the formatted content body
				Template.commentPreviewArea.appendChild(contentEl); 
				
				Msg.remove("NULL_COMM");
				Util.hide(Template.commentForm);
				Util.hide(Template.ratingModule);
			}
		},
		
		onEdit: function(){
			Util.hide(Template.commentPreview);
			Util.show(Template.commentForm);
			Util.show(Template.ratingModule);
		},
		
		onSubmit: function(){
			var hasComment = Core.isValidComment();
			if (!hasComment){
				if (Instance.type == 1 && typeof Feedback.rating == 'number'){
					//commenting + rating badge accepts empty rating with no comment
					Core.postRating();
					
					Util.hide(Template.addForm);
					Util.hide(Template.commentPreview);
				}
				else{
					//the comment is null, default of just whitespace. throw empty comment error
					Msg.show("NULL_COMM");
				}
			}
			else{
				Msg.show('ADD_COMM');
				Core.postComment();
				
				Util.hide(Template.addForm);
				Util.hide(Template.commentPreview);
			}
		},
		
		onAppendComment: function(){	
			 	
			if (typeof Feedback.rating ==  'number'){
				//get the average rating for this article
				Core.getAvgRating(Core.updateAvgRating);
				
				//remove the internal stored rating calue
				Core.deleteRating();
			}
			
			//reset the add comment form to its initial state
			Template.resetAddForm();
			
			if (typeof User.flag['rating'] == 'number'){
				//update the UI with new rating data
				Template.rebuildRatingUI();
			}
			
			//update the comment count
			Template.refreshAnchor();
			
			//update the rating heading in the badge header
			Template.updateRatingHeading();
			
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
		
		onFocusTextarea: function(){
			if (Template.commentTextarea.className !== 'ionComLegend'){
				return;
			}
			else{
				Template.commentTextarea.value = '';
				Template.commentTextarea.className = '';
			}		
				
//				if (globalSettings.options.comLimit){
//
//					if (!this.comLimitMsg){					
//						comLimitString = ionLang.prompt.comLimit.replace(/{maxComLength}/g, globalSettings.options.maxComLength);
//						this.comLimitMsg = ionComMessage.create('li', comLimitString, 'ionComLimit', 'ionComMessage');
//						this.comLimitMsg.style.display = 'none';
//						this.comList.appendChild(this.comLimitMsg);	
//					}
//
//					this.maxLengthListener(globalSettings.options.maxComLength, this.addTextArea, this.onMaxLengthOver, this.onMaxLengthUnder)
//				}
		},
		
		onBlurTextarea: function(){
			if (Template.commentTextarea.value === ''){
				Template.resetTextarea();
				return;
			}
		}
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
		Util.hide(Template.commentPreview);
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
	 * Build and return the comment form DOM object so the user can add his comment
	 * 
	 * @return {Object}
	 */
	Template.getCommentForm = function(){
		//set the default comment textarea content to an internal Template property
		Template.setDefaultCommentText();
		
		//comment textarea and button wrapper
		var addBlock = document.createElement('div');
		addBlock.id = 'ionComAdd';
		
		//comment input element
		var textArea = document.createElement('textarea');
		textArea.rows = '6';
		textArea.cols = '50';
		textArea.id = 'ionComTextArea';
		textArea.className = 'ionComLegend';
		textArea.innerHTML = Template.defaultCommentText;
		
		Util.setEventListener(textArea, 'focus', Template.behavior.onFocusTextarea, false);
		Util.setEventListener(textArea, 'blur', Template.behavior.onBlurTextarea, false);
		
		//Set a reference to the comment textarea for future manipulation / reset
		Template.commentTextarea = textArea;
		
		var controls = document.createElement('fieldset');

		var butSubmit = Template.getButton(ionLang.label.butSubmit, Template.behavior.onSubmit);
		var butPreview = Template.getButton(ionLang.label.butPreview, Template.behavior.onPreview);	
		var butCancel = Template.getButton(ionLang.label.butCancel, Template.behavior.onCancel);
		
		controls.appendChild(butSubmit);
		controls.appendChild(butPreview);
		controls.appendChild(butCancel);
		
		addBlock.appendChild(textArea);
		addBlock.appendChild(controls);
		
		return addBlock;
	};
		
	/**
	 * Build and return the comment preview block
	 * This shows a preview of the user's formatted comment
	 * 
	 * @return {Object}
	 */
	Template.getCommentPreview = function(){
		var previewBlock  = document.createElement('div');
		previewBlock.id = 'ionComPreview';
			
		var previewHeading = document.createElement('h4');
		previewHeading.innerHTML = ionLang.label.previewComment;
		
		var previewTextArea = document.createElement('div');
		previewTextArea.id='ionComPreviewTextArea';
		
		var controls = document.createElement('fieldset');
		
		var butCancel = Template.getButton(ionLang.label.butCancel, Template.behavior.onCancel);
		var butEdit = Template.getButton(ionLang.label.butEdit, Template.behavior.onEdit);
		var butSubmit = Template.getButton(ionLang.label.butSubmit, Template.behavior.onSubmit);
		
		controls.appendChild(butSubmit);
		controls.appendChild(butEdit);
		controls.appendChild(butCancel);
		
		previewBlock.appendChild(previewHeading);
		previewBlock.appendChild(previewTextArea);
		previewBlock.appendChild(controls);
		
		Template.commentPreviewArea = previewTextArea;
			
		return previewBlock;
	};
	
	/**
	 * Build the rating module container and append to the add form
	 */
	Template.buildRatingContainer = function(){
		var module = document.createElement('div');
		module.id = 'ionComRating';
		
		//append the rating container to the add form
		Template.addForm.appendChild(module);
		
		//get a DOM reference to the rating module from the page
		Template.ratingModule = $('#ionComRating');
	};
	
	/**
	 * Decide which kind of rating to build (5star/thumbs) 
	 * and build the rating prompt + controls
	 */
	Template.buildRatingModule = function(){
		Template.buildRatingLabel();
		Template.buildRatingControl();
	};
	
	/**
	 * Build the rating module label DOM element
	 */
	Template.buildRatingLabel =  function(){
		var label =  document.createElement('span');
		label.className = 'ionLabel';
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
			
			if (opt.ratingType == 2) {
				//thumbs label
				ratedStr = (User.flag['rating'] === 0)? ionLang.label.ratingLabelNotHelpful:ionLang.label.ratingLabelHelpful;
			}
			else{
				//stars label
				ratedStr = ionLang.label.ratingLabelRated;			
			}
			
			return ratedStr;
		};
		
		/**
		 * get the rating label if the user has not rated before on this badge
		 */
		var getUnRatedString = function(){
			var unRatedStr;
			
			if (opt.ratingType == 2) {
				//thumbs label
				unRatedStr = ionLang.label.ratingLabelThumbs;
			}
			else{
				//stars label
				unRatedStr = ionLang.label.ratingLabelStars;			
			}
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
	
	Template.getInlineWrapper = function(){
		var inline = document.createElement('span');
		inline.className = "inline-block";
		
		return inline;
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
			
			var container = document.createElement('span');
			container.id = 'ionThumbRatingGroup';
			
			var yesLabel = document.createElement('label');	
			var noLabel = document.createElement('label');
			var yesInput = getActiveThumb('ionThumbsRating', 1);
			var noInput = getActiveThumb('ionThumbsRating', 0);
			
			yesLabel.innerHTML = ionLang.label.labelYes;
			noLabel.innerHTML = ionLang.label.labelNo;
			
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
			
			container.appendChild(yesInput);
			container.appendChild(yesLabel);
			container.appendChild(noInput);
			container.appendChild(noLabel);
			
			Template.ratingModule.appendChild(container);
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
	 * Build and return a DOM element that contains the localized string representation
	 * of the number of ratings for a resource: (nrRatings + "Rating/Ratings");
	 * 
	 * There are 2 usecases for this: 
	 * SPAN element or hyperlink with href to the rating container
	 * 
	 * @param {String} type 
	 * 				   DOM element type ('span','a','div', etc..);
	 * @param {Object} params 
	 * 				   DOM element specific parameters. 
	 * 				   (!)The innerHTML paramenter will always be overwritten by the localized string
	 */
	Template.getRatingCountElement = function(type, params){
		var count = (typeof Instance.ratingCount !== "number")? 0 : Instance.ratingCount;
		params = params || {};
		params.text = Template.getRatingCountString(count);
		
		var el = Template.createEl(type, params);
		return el;
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
	 * Build the sidebar anchor DOM element with a summary of comments and avg rating.
	 * This element contains internal page links to the rating and comments list.
	 */
	Template.getAnchorElement = function(){
		/**
		 * Get an anchor with an internal link to the commeting list.
		 * Text of the link is "Comment" + number of comments on this article
		 * 
		 * @return{Object}
		 */
		var getCommentAnchor = function(){
			var commentAnchor = document.createElement('a');
			if(Template.comHeading){
				commentAnchor.href = "#"+Template.comHeading.id;
			}
			
			if(typeof Instance.commentCount == 'number'){
				//there is a total number of comments
				commentAnchor.innerHTML = Template.getHeadingCountString(Instance.commentCount);
			}
			else{
				//default zero comments
				commentAnchor.innerHTML = Template.getHeadingCountString(0);
			}
			
			commentAnchor.className = "ionIcon ionIconComment";
			return commentAnchor;
		};
		
		//wrapper for comment / rating anchors
		var anchorEl = document.createElement('ul');
		anchorEl.className = "ionAnchor";
		
		//container for anchor elements (comment count, rating count, comment rss feed)
		var anchorChildren = [];
		
		switch (Instance.type){
			case 1:
				//comment + rating badge
				anchorChildren.push(getCommentAnchor());
				anchorChildren.push(Template.getRatingSummary(true));
			break;
			case 2:
				//comment badge
				anchorChildren.push(getCommentAnchor());
			break;
			case 3:
				//rating badge
				anchorChildren.push(Template.getRatingSummary(true));
			break;
		}
		
		//bulild the anchor element with links
		for (var i=0; i<anchorChildren.length; i++){
			var li = document.createElement('li');
			li.appendChild(anchorChildren[i]);
			anchorEl.appendChild(li);
		}
		
		return anchorEl;
	};
	
	/**
	 * Use the instance variables and update the avg rating and comment count UI
	 */
	Template.refreshAnchor = function(){
		//no anchor specified. Ignore building
		if (!opt.anchor || typeof opt.anchor !== 'object'){
			return;
		}

		var newAnchor = Template.getAnchorElement();
		
		if (newAnchor){
			opt.anchor.innerHTML = '';	
			opt.anchor.appendChild(newAnchor);		
		}
	};
	
	/**
	 * Get a localized string with the number of ratings
	 * 
	 * @param {Object} count number of ratings
	 */
	Template.getRatingCountString = function(count){
		if (typeof count != "number"){
			throw new Error("Template.getRatingCountString() Incorect parameter: count Expected: number, got: "+ typeof count);
		}
		
		//get correct plural / singular string for "rating" based on number of ratings
		var baseString = (count === 1)? ionLang.label.ratingSingular:ionLang.label.ratingPlural;
		
		//build rating count string
		var str = "("+count+" "+ baseString+")";
		
		return str;
	};
	
	/**
	 * Build and return a DOM object with the static rating interface.
	 * Used for comment previews and for appending to comment items on list
	 * 
	 * @param {Number} ratingType 1:stars / 2:thumbs
	 * @param {Number} rating numeric value of the user's rating
	 */
	Template.getStaticRating = function(ratingType, rating){
		var el = null;

		if(!isNaN(ratingType) && typeof ratingType == 'number' && ratingType !== 0 && typeof rating == 'number'){
			el = (ratingType == 2)? Template.getThumbsOpinion(rating):Template.getStaticStarRating(rating, 'small');
		}
		
		return el;
	};
	
	/**
	 * Build and return a DOM element with an inactive rating control set to a specific number of stars
	 * The star rating comes in two sizes: regular, small
	 * 
	 * 		regular: on the add form
	 * 		small: along comments as part of a review item (comment+rating)
	 * 
	 * @param {Object} value	numeric value of the rating
	 * @param {Object} size		proportion name of the rating list (small)
	 */
	Template.getStaticStarRating = function(value, size){
		var starList = Template.getStarRatingList(size);
		var starRating = Template.getStarRating(value);
		
		starList.appendChild(starRating);
	
		return starList;
	};
	
	/**
	 * Get the string with the user's opinion based on the user's opinion on the thumbs rating: (helpful/not helpful)
	 * Wraps the string with a SPAN and attaches a css class related to the tone of the opinion (green/red)
	 * 
	 * @param {Object} value user's rating value (1/0)
	 * @return {Object}
	 */
	Template.getThumbsOpinion = function(value){
		var opinion = document.createElement('span');

		if (value === 0){			
			//not helpful
			opinion.innerHTML = ionLang.label.helpfulNo;
			opinion.className = "ionNegative";
		}
		else{
			// helpful
			opinion.innerHTML = ionLang.label.helpfulYes;
			opinion.className = "ionPositive";
		}
		
		return opinion;
	};
	
	/**
	 * Build and return the base template for the star rating list
	 * The star rating comes in two sizes: 
	 * 		small: for displaying along the comment as part of a review
	 * 		regular: for the add form
	 * 
	 * @param {String} size name of the proportion to build the base (small)
	 * @return {Object}
	 */
	Template.getStarRatingList = function(size){
		//stars container
		var list = document.createElement('ul');
		list.className = (size && size === "small")? "ionStarRating small-star":"ionStarRating";
		
		return list;
	};
	
	/**
	 * Get a List element that shows a rating value in stars count
	 * 
	 * @param {Number} value numeric value of the rating
	 * @return {Object}
	 */
	Template.getStarRating = function(value){
		//create the current rating object
		var rate = document.createElement('li');
		rate.className = "current-rating";	
		rate.style.width = (typeof value == 'number')? Core.calculateRatingPercent(value)+"%":"0%";
		
		return rate;
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
	 * Build "Add Comment" button with behavior
	 */
	Template.buildAddButton = function(){
		//get a functional styled button that shows the comment form
		var addBut = Template.getButton(ionLang.label.butAdd, Core.showCommentForm, "ionComButAdd");	
			
		//append the add comment button to the add comment form
		Template.addForm.appendChild(addBut);		
		
		//keep a reference to the add button for future handling
		Template.butAdd = $('#ionComButAdd');
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
	 * Build the pagination controller for multiple page comment badge
	 *  
	 * @param {Object} selectedPageNr number of the page that is currently in view
	 */
	Template.buildPagination = function(selectedPageNr){
		/**
		 * Build a page DOM element with attached behavior for triggering a getComments operation.
		 * 
		 * @param {Object} pageNumber number of the page item
		 */	
		var getPageItem = function(pageNumber){
			var li = document.createElement('li');
			var page;
			
			if (pageNumber  === selectedPageNr){
				page = document.createElement('strong');
			}
			else{
				page = document.createElement('a');
				page.href = "#";
			
				Util.setEventListener(page, 'click', function(evt){
					Util.stopBehavior(evt);
					Core.getPage(pageNumber, true);
				},false);
			}
			
			//attach the UI number
			page.innerHTML = pageNumber;
		
			li.appendChild(page);
			
			return li;
		};
		
		var buildPaginationControl = function(){
			var pagBase = document.createElement('ul');
			pagBase.id ="ionComPagination";
		
			//build the "Page" label
			var pagLabel = document.createElement('li');
			pagLabel.innerHTML = ionLang.label.pageName;
		
			pagBase.appendChild(pagLabel);
		
			for (var i=1; i<nrPages+1; i++){
			var item = getPageItem(i);
			pagBase.appendChild(item);
			}
	
			Template.base.insertBefore(pagBase, Template.msgContainer);
			
			//set a reference to the pagination container
			Template.pagination = pagBase;
		};
		
		var nrPages = Math.ceil(Instance.commentCount / config.comPerPage);
		
		//only build pagination if there are more than one pages
		if (nrPages > 1){
			buildPaginationControl();
		}
	};
	
	/**
	* Get a list of comments for the requested page and cache the current page 
	* Flush the comment list and append the new list.
	* Show appropriate loading messages.
	* 
	* Rebuild pagination with the requested page as selected
	* @param {Number} pageNumber number of the requested page
	* @param {Boolean} fromCache 
	* 						true: the page can be read from cache if it exists
	* 						false: make a new request to the server regardless if the page is in the cache
	* 							   we use this when the user adds a new comment from another page than the last one.
	* 							   we need to append his comment to the last page of comments before we can cache it.
	*/
	Core.getPage = function(pageNumber, fromCache){	
		/**
		 * Attempt to get comment list for the requested page from cache
		 * @param {Number} pagNr comments page number
		 */
		var getCachedPage = function(pagNr){
			if(Instance.pageCache[pagNr]){
				//get comment list from internal cache
				Core.listCommentsFromCache(pagNr);
			}
			else{
				//page is not in cahce, get it from the server
				getFreshPage(pagNr);
			}
		};
		
		/**
		 * Make a call to the server for the comments on the requested page
		 * @param {Number} pagNr comments page number
		 */
		var getFreshPage = function(pagNr){
			//get the comment list from the server
			Core.getComments(pagNr);
				
			//Show the "loading comments" message
			Msg.show("LOAD_COMM");
		};
		
		//cache the current comment list HTML and clear the comment list.
		Template.flushCommentList();
		
		//remove the old pagination. we need to draw a new one
		if (Template.pagination){
			Template.base.removeChild(Template.pagination);
			delete Template.pagination;
		}
		
		// Where to get the comments page from? Server or Cache	
		var operation = (fromCache === false)? getFreshPage:getCachedPage;
		operation(pageNumber);
	};
	
	/**
	 * Retrieve the comment list for a page number from the internal cache.
	 * Avoid doing another trip to the server.
	 * 
	 * @param {Number} pageNumber page for which to get comments list out of the cache
	 */
	Core.listCommentsFromCache = function(pageNumber){
		if (Instance.pageCache[pageNumber]){
			
			//Switch the instance current page to this one
			Instance.currPage = pageNumber;
			
			//empty the comment list and take the comments from the cache
			Template.comList.innerHTML = '';		
			Template.comList.innerHTML = Instance.pageCache[pageNumber];
			
			//refresh the pagination
			Template.buildPagination(pageNumber);
		}
	};
	
	/**
	 * Chech if the URL has a custom hash (page anchor) set by this badge 
	 * and run any actions related to the given hash.
	 * The hash represents the name of the action
	 * ex: http://adobe.com/index.html#hashActionName
	 * 
	 * When the page loads, we check for the action name after #
	 * If there is a match, run the associated action
	 * Hash related actions are asynchronus.
	 * 
	 * @param {String} hash url anchor, name of the action to run
	 */
	Core.checkHashAction = function(){
		var action = null;
		
		switch (opt.hash){
			case "ach-setscr":	
				//hash comes when a user returns from the Adobe.com "set a screen name" page
				
				//get the set ion screenname cookie action
				action = Core.hashActions[opt.hash];
			break; 
		}
		
		//if there is an action for the specified hash, run it
		if (typeof action == 'function'){
			action.call();
		}
	};
	
	/**
	 * Wrapper for actions triggered by custom url hashes (#actionName)
	 */
	Core.hashActions = {
		/**
		 * Set the ion screen name as the Adobe.com Screen name 
		 * and call the ion server with the update
		 */
		"ach-setscr":function(){
			
			//get the Adobe.com set screen name cookie
			var adobeSNCookie = Util.getCookie("SCREENNAME");
			if (typeof adobeSNCookie == 'string'){
				
				//set the ion screen name cookie as the one set by Adobe.com
				Util.setCookie(config.screenNameCookieName, adobeSNCookie, 365);
				
				//read again the user's screen name
				User.flag['screenName'] = User.hasScreenName();
				
				//Call to ionserver with screenname update
				var request = new ServerRequest();
				request.url = config.updateUserURL;
				request.method = "GET";
				request.id = "ach-setscr";
				request.onSuccess = function(){};
				request.onError = function(){};
				request.send();	
			}
		}
	};
		
	/**
	 * Store the current comments page content in a cache object 
	 * and empty the comment list DOM element
	 */
	Template.flushCommentList = function(){
		//cache the current page contents
		Instance.pageCache[Instance.currPage] = Template.comList.innerHTML;
		
		//flush the comment list
		Template.comList.innerHTML = '';
	};

	/**
	 * Get the string for the login prompt message. 
	 * 
	 * Overwrite login url with custom link if there is a match for it by opt.system. 
	 * Adobe Dev Center requests a different login link from the Adobe.com one
	 * 
	 * Use the localized url from the language pack if no overwrite is requested.
	 * 
	 * @return {String}
	 */
	Template.getLoginString = function(){		
		//Get a custom login link, if set for the system, or use the localized link for adobe.com
		var url = (typeof loginURL[opt.system] == 'string')? loginURL[opt.system] : ionLang.prompt.signInLinkPrefix;
					
		var loginLink = '<a';
		loginLink += ' href="'+ url + encodeURIComponent(window.location) +'"';
		loginLink += ' title="'+ ionLang.prompt.signInLinkTitle +'">';
		loginLink += ionLang.prompt.signInLink +'</a>';
		
		var template = null;
		
		switch (Instance.type){
			case 1:
				template = ionLang.prompt.anonymusUserReview;
			break;
			case 2:
				template = ionLang.prompt.anonymusUserComment;
			break;
			case 3:
				template = ionLang.prompt.anonymusUserRating;
			break;
		}
		
		var loginString = (template !== null)? template.replace(/\{signInLink\}/g, loginLink): "Login to adobe.com";
		return loginString;			
	};
	
	/**
	 * Get the message with link for the users with no screen name. 
	 * 
	 * @return {String}
	 */
	Template.getNoScreenNameString = function(){		
		var url = ionLang.prompt.setScreenNameUrl;
		
		//Return to this badge URL and set an action name to run when it comes back
		var returnURl = window.location.toString();
		returnURl += "#ach-setscr";
					
		var snLink = '<a';
		snLink += ' href="'+ url + encodeURIComponent(returnURl) +'"';
		snLink += ' title="'+ ionLang.prompt.setScreenNameTitle +'">';
		snLink += ionLang.prompt.setScreenNameLink +'</a>';
						
		var snString =  ionLang.prompt.setScreenName.replace(/\{setScreenNameLink\}/g, snLink);
		
		return snString;
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
	 * Build the HTML markup for a comment item
	 * 
	 * @param {Object} comData container for comment item data: 
	 * 				   user name, role, adobe staff, date, comment text, rating -optional
	 */
	Template.getCommentItem = function(comData){
		if (!comData || typeof comData !== 'object'){
			return;
		}
		
		var comItem = document.createElement('li');
		var comItemMeta = document.createElement('div');
		comItemMeta.className = 'ionComMetaData';
		
		var authorBlock = document.createElement('span');
		authorBlock.className = 'ionComAuthor';
		
		var authorAnchor = document.createElement('a');		
		authorAnchor.className = (comData.adobeEmployee == 1) ? 'ionIcon ionIconAdobe':'';			
		authorAnchor.target = "_blank";
		authorAnchor.href = config.profileServer+"?id="+ encodeURIComponent(comData.authorId);
		authorAnchor.innerHTML = Util.cleanInput(comData.authorName);
		authorBlock.appendChild(authorAnchor);
		
		var roleLabel;
		switch (comData.authorRole.toString()){
			//User role is Administrator
			case '1':
				roleLabel = ionLang.label.administratorRole;
			break;
			
			//User role is Moderator
			case '2':
				roleLabel = ionLang.label.moderatorRole;
			break;
		}
		
		if (roleLabel){
			authorBlock.appendChild(document.createTextNode('('+ roleLabel + ')'));
		}
		
		var dateBlock = document.createElement('span');
		dateBlock.className = 'ionComPostDate';							
		dateBlock.innerHTML = comData.createdOn;	
		
		var commentBlock = document.createElement('p');			
		commentBlock.innerHTML = comData.content;	
		
		comItemMeta.appendChild(authorBlock);
		comItemMeta.appendChild(dateBlock);
		comItemMeta.appendChild(document.createElement('br'));
				
		comItem.appendChild(comItemMeta);
		
		//get a rating UI for this comment
		var ratingBlock = Template.getStaticRating(comData.ratingType, comData.rating);
					
		//if a rating element has been returned, append it to the comment HTML
		if (ratingBlock){
			comItem.appendChild(ratingBlock);
		}
		
		comItem.appendChild(commentBlock);
		
		return comItem;
	};
	
	/**
	 * Build the form that will contain user interaction modules:
	 * add comment button, add comment form, rating control
	 */
	Template.buildAddForm = function(){
		var addForm = document.createElement('form');
		addForm.id = 'ionComAddForm';
		addForm.method = 'POST';
		addForm.action = '#';
		
		//append the add form to the base template
		Template.base.appendChild(addForm);
		
		//set a reference to the add form
		Template.addForm = $('#ionComAddForm');
	};
	
	/**
	 * Increment the internal counter for comments
	 * Update the headin UI with the new total comment count
	 */
	Template.incrementHeadingCount = function(){
		//increment the total number of comments and update the UI
		Instance.commentCount++;
		Template.updateHeadingCount();
	};
	
	
	/**
	 * Check a number times (attempts) if all the required modules have completed loading. 
	 * If everything is ok, continue with badge deployment. 
	 * Else stop the badge and show error messages accordingly.
	 * 
	 * @param {Number} attempt number of attemps to retry the check for required modules.
	 */
	Core.checkRequiredModules = function(attempt){
		
		//Timeout! Required modules have still not loaded.
		//Throw error messages and stop the badge.
		if (attempt < 1){
			Core.stopBadge();
			return;
		}

		//counter for modules not yet loaded
		var pendingModules = 0;
			
		for (var i in reqModule){
			if (reqModule[i] === false){
				++pendingModules;
			}
		}
		
		//some modules are not loaded yet
		if (pendingModules > 0){
			//Retry the check and decrement the attempts number
			setTimeout(function(){
				Core.checkRequiredModules(attempt-1);
			},config.retryDelay);
		}
		else {
			//all required modules are loaded
			Core.deployBadge();
		}
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
	 * Embed the SWF proxy object into the document 
	 * Check at regular intervals if it has loaded and set flags accordingly
	 */
	Core.deployProxy = function(){
		//Embed SWFProxy
		ionComProxy.embedProxy(config.proxyId, config.proxyFile);
	
		//Run delayed checks to see if the SWFProxy is fully loaded and parsed
		//number of attempts = number of millisecons for overall delay / number of milliseconds between retrys
		setTimeout(function(){
			//give the proxy embedding function some time before punding it with checks.
			//keeps IE6 and Safari from freezing the proxy download.
			Core.checkProxy(opt.timeOutDelay / config.retryDelay);		
		}, 1500);
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
		if (attempt < 1){
			return;
		}

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
	 * Set the default flags for the badge
	 */
	Core.setFlags = function (){
		reqModule.locale = false;		//language pack is not loaded
		reqModule.proxy = false;		//proxy is not loaded
		
		//custom login link for applications authenticating through Adobe Dev Center (Cookbooks does this)
		loginURL['adc'] = "https://www.adobe.com/cfusion/entitlement/index.cfm?e=adc&returnurl="; 
		
		//set the flags for the default user rating status
		User.flag['canRate'] = true; 		//false if user has rated this before
		User.flag['rating'] = null;			//rating value of this user if he rated before. null for no rating
		
		User.flag['login'] = false;			//user is not logged in
		
		Instance.flag['hasComments'] = false;		//check for empty badge [comments]
		Instance.flag['hasRatings'] = false; 		//check for empty badge [ratings]
		Instance.flag['loadedData'] = false; 		//switch and check when requesting comments/rating crossdomain
		Instance.currPage = null;					//current page number of comments
		Instance.pageCache = [];					//container for cached comment pages
	};

	/**
	 * Return the code for the badge instance type. Depending on the instance type the workflow changes. 
	 * Ex: in comment+rating instance the comment is optional
	 * 
	 * 1 = comments + rating
	 * 2 = only comments
	 * 3 = only ratings
	 * 
	 * @return {Number}
	 */
	Core.getBadgeInstance =  function(){
		var inst = 0;
		switch (opt.commenting){
			case true:
				if (opt.rating === false){
					inst = 2;
				}
				else{
					inst = 1;
				}
			break;
			
			case false:
				if (opt.rating === false){
					inst = 0;
				}
				else{
					inst = 3;
				}
			break;
		}
		return inst;
	};
	
	Core.deployBadge = function(){
		//setup the badge instance (comment+rating, comment or rating) 
		//used for setting up appropriate template and behavior 
		Instance.type = Core.getBadgeInstance();
		
		//Both commenting and rating have been set to false
		//We're dealing with Dr. Evil or an idiot
		if (Instance.type === 0){
			Core.stopBadge();
			return;
		}
		
		//Setup the message handling mechanism (errors/prompts)
		Msg = new Message();
		
		//Set the logged in status of the user 
		User.flag['login'] = User.isLoggedIn();
		
		//Build the basic badge HTML template and append it to the document
		Template.buildBase();
		
		//Need to expose publicly some callback methods for the SWF proxy responses
//		window.ionResponse = ionResponse;
		
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
				
				//Get the comments data from the server
				Core.getComments(1);
				
				//get the average rating for this article
				Core.getAvgRating(Core.updateAvgRating);
				
				//Show the "loading comments" message
				Msg.show("LOAD_COMM");
			break;
			
			case 2:
				//comment badge
				
				//Get the comments data from the server
				Core.getComments(1);
				
				//Show the "loading comments" message
				Msg.show("LOAD_COMM");
			break;
			
			case 3:
				//rating badge. 
				
				//show average and add rating controls
				Core.getAvgRating(Core.setAvgRating);
			break;
		}
	};
	
	/**
	 * Shutdown the badge deployment and hide any visible UI.
	 */
	Core.stopBadge = function(){
//		debug('silent stop');
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
	 * Get the object form the server with comments (or ratings) 
	 * and use it to build comment items in the badge
	 * 
	 * Set the listeners for the getComments operation and handle errors that occur
	 * 
	 * @param {Object} pageNr page of comments. Default is 1
	 */
	Core.getComments = function(pageNr){
		if (!pageNr) {
			pageNr = 1;
		}
	
		//get the product labels paramters for the socialSky call
		var pLabelsString = Core.getProductLabelsString();
		
		//Get the baseline paramteres for generic socialSky calls
		var parameters = Core.getBasicServiceParams();
		
		//Append extra paramters for the get comments / reviews call
		parameters.push(['page_size', config.comPerPage]);
		parameters.push(['page', pageNr]);
		parameters.push(['fields', 'content,ion.author_role,author,ion.adbe,ion.rating,ion.rating_type,ion.author_id,created']);
		parameters.push(['where', 'ion.language:'+opt.locale +',resource_id:'+opt.url+',ion.visible:true']);
		
		//request review listing with thumbs rating
		if (opt.ratingType == 2){
			parameters.push(['thumbs', true]);
		}
		
		//request id used to keep track of the response from the server
		var request = new ServerRequest();
		request.url = (Instance.type === 1)? config.getReviewsURL:config.getCommentsURL;
		request.method = "GET";
		request.params = parameters;
//		request.id = "lcomm";
		request.id = Hasher.grind().toString();
		request.onSuccess = Core.listComments;
		request.send();	
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
		
		//TODO move badge-specific params (lang, sitearea, prod label) to a generic getter function
		//if there is a product label specified, append it to the paramteres array
		if (opt.productLabel){
			var labelValue = '';
			
			if (typeof opt.productLabel == 'string'){
				labelValue = opt.productLabel;
			}
			else if(typeof opt.productLabel !== 'string' && opt.productLabel.length){				
				labelValue =  Util.arrayToString(opt.productLabel);
			}
			
			parameters.push(['ion..label', labelValue]);
		}
		
		//if siteArea is specified append it to the paramters array
		if (opt.siteArea && typeof opt.siteArea == "string"){
			parameters.push(['ion.site', opt.siteArea]);
		}
		
		//if there is a rating set append it to the paramters array
		if (typeof Feedback.rating == 'number'){
			parameters.push(['ion.rating',Feedback.rating]);
			parameters.push(['ion.rating_type',opt.ratingType]);
		}
		
		//request id used to keep track of the response from the server
		var request = new ServerRequest();
		request.url = config.postCommentsURL;
		request.method = "POST";
		request.params = parameters;
//		request.id = "acomm";
		request.id = Hasher.grind().toString();
		request.onSuccess = Core.appendComment;
		request.onError = function(){
			Msg.show("POST_ERROR");
			Template.behavior.onAddCommentError();
		};
		request.send();	
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
		
		//TODO move badge-specific params (lang, sitearea, prod label) to a generic getter function
		//if there is a product label specified, append it to the paramteres array
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
		
		//if siteArea is specified append it to the paramters array
		if (opt.siteArea && typeof opt.siteArea == "string"){
			parameters.push(['ion.site', opt.siteArea]);
		}
		
		var request = new ServerRequest();
		request.url = Core.getRatingUrl();
		request.method = "GET";
		request.params = parameters;
//		request.id = "arate";
		request.id = Hasher.grind().toString();
		request.onSuccess = Core.updateRating;
		request.onError = function(){
			Msg.show("ADD_RATING_ERROR");
		};
		request.send();
		
		Msg.show('ADD_RATING');
	};
	
	/**
	 * Return the correct add rating url according to the rating type and the rating value
	 * 
	 * @return{String}
	 */
	Core.getRatingUrl = function(){
		var url = null;
		
		if (opt.ratingType === 2){
			//thumbs rating
			url = (Feedback.rating === 0)? config.thumbsDownRatingURL:config.thumbsUpRatingURL;
		}
		else{
			//stars rating
			url = config.starRatingURL;
		}
		
		return url;
	};
	
	/**
	 * Get the average rating object for this url from the server.
	 * Set event listeners for the server response and handle any errors that occur.
	 * 
	 * When the user is logged in, the response will include 
	 * his previous rating if he has voted on this url
	 * 
	 * @param{Function} callback method to run with the server response if it is valid 
	 */
	Core.getAvgRating = function(callback){
		//Build the server call and trigger it
		var request = new ServerRequest();
		
		//Get the baseline paramteres for generic socialSky calls
		var parameters = Core.getBasicServiceParams();
		parameters.push(['where','resource_id:'+opt.url]);
		
		if (opt.ratingType === 2) {
			//thumbs rating
			
			request.url = config.getAvgThumbRatingURL;
			
			//request specific return parameters from SocialSky API
			parameters.push(['fields','up,down,content,count']);
		}
		else {
			//star rating
			request.url = config.getAvgStarRatingURL;
		}
		
		request.url = (opt.ratingType === 2)? config.getAvgThumbRatingURL:config.getAvgStarRatingURL;
		request.method = "GET";
		request.params = parameters;
//		request.id = "avgrate";
		request.id = Hasher.grind().toString();
		request.onSuccess = callback || Core.updateAvgRating;
		request.onError = function(){
			Msg.show("AVG_RATING_ERROR");
		};
		request.send();
	};
	
	/**
	 * Build and get the product label string paramteres for the social sky call.
	 * Multiple product labels come as an array.
	 * Single product label paramter comes as string
	 * 
	 * @return {String}
	 */
	Core.getProductLabelsString = function(){
		var string ='';
				
		//No product label specified
		if (!opt.productLabel){
			return string;
		}
		
		//there is only one product label
		if (typeof opt.productLabel == 'string'){
			string = 'ion..label:'+opt.productLabel + ',';
		}
		
		//productLabel is an array / object
		if (opt.productLabel.length && typeof opt.productLabel !== 'string'){
			for (var i=0; i<opt.productLabel.length; i++){					
				string = string + 'ion..label:'+opt.productLabel[i]+',';
			}	
		}
		
		return string;
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
		//mentainig correct 'this' reference		
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
		 * Retrys the valid and error condition at regular intervas set by self.delay;
		 */
		var doRetry = function(){
			//ran out of retrys. run errorHandler and stop
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
	}
	
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
//			ionResponse.queueRequest(self.id);
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
//			var isValid = (typeof ionResponse.queue[self.id] !== 'object' || ionResponse.queue[self.id] === null)? false:true;
//			return isValid;
			return ionResponse.checkForRequest(config.managerKey, self.id);
		};
		
		/**
		 * Check the server response for service error codes.
		 * Show errors if any, or handle the response with the onSuccess specified method.
		 */
		var checkForErrors = function(){
//			Core.checkForServiceErros(ionResponse.queue[self.id], self.onSuccess);
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
	}

	/**
	 * Show a service / server error when the connection hangs or 
	 * the server response is not valid.
	 */
	Core.showServerError = function(){
		//The server has thrown an error
//		if(ionResponse.error !== null){
//			debug('server error: '+ ionResponse.error);
//		}
		
		Msg.show("SERVICE_ERROR");
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
		
		//Show the comment form if this is not a rating only badge
		if(Instance.type !== 3){
			Core.showCommentForm();
		}
		else{
			//This is a rating badge. post the rating as soon as it comes
			Core.postRating();
			Util.hide(Template.addForm);
		}
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
		
		if(Template.commentForm){
			//we have the comment form, show it
			Util.show(Template.commentForm);
		}
		else{	
			//get the comment form with textarea and buttons
			var form = Template.getCommentForm();
			
			//check if there is a comment recovery cookie set and populate the form with its contents
			var recoveryCookie = Util.getCookie(config.recoveryCookieName);
			if (recoveryCookie){
				Core.recoverComment(recoveryCookie);
			}
			
			Template.addForm.appendChild(form);
			Template.commentForm = form;
		}
	};
	
	/**
	 * Decide if to show the comment preview panel or to build it from scratch
	 */
	Core.showCommentPreview = function(){
		if (Template.commentPreview){
			Util.show(Template.commentPreview);
		}
		else{
			var comPreview = Template.getCommentPreview();
			Template.addForm.appendChild(comPreview);
			Template.commentPreview = comPreview;
		}
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
		
		switch(opt.ratingType){
			case 1:
				//reset star rating UI
				Template.updateUserRatingUI(0);
			break;
			
			case 2:
				//reset thumbs rating UI
				resetThumbs();
			break;
		}
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
	 * Calculate the coverage percentage of the star rating control
	 */
	Core.calculateRatingPercent = function(value){
		var coverage = value * 20;
		return coverage;
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
		//Respone contains an error code.
		if (response.ion && response.ion.error){
			switch(response.ion.errorCode){
				case "LOGIN_REQUIRED":
					Msg.show("LOGIN_EXPIRED");
					Msg.show("NO_LOGIN");
					Template.behavior.onAddCommentError();
				break;
				
				case "FATAL_EXCEPTION":
					Msg.show("SERVICE_ERROR");
				break;
				
				default:
					Msg.show("SERVICE_ERROR");
			}
//			debug("ERROR: "+response.ion.errorCode);
			
			//if the crash didn't happen on rating badges, shor the comment form so the user can retry
			if (Instance.type !== 3){
				Template.behavior.onAddCommentError();
			}	
		}
		else{
			handleResponse(response);
		}
	};

	
	/**
	 * Interpret the comment list object form the server and display comments / reviews
	 * 
	 * @param {Object} responseBody container object for comments data & metadata (content, author, dates, etc..)
	 */
	Core.listComments = function(responseBody){		
		//Get the comments container (array) from the response 
		var comItems = responseBody.response[1];
		
		//check if the user has rated before
		if(typeof responseBody.userRating !== 'undefined'){
			var prevRating;
			
			if (opt.ratingType === 2){
				//thumb rating, decode the thumb value
				prevRating = Core.decodeThumbValue(responseBody.userRating);
			}
			else{
				//star rating, transform the string value of the number into a number
				prevRating = parseInt(responseBody.userRating,10);
			}
			
			//Update the internal variables
			if (!isNaN(prevRating)){
				User.setRatingFags(opt.ratingType, prevRating);
			}
		}
		
		//set the number of comments on this resource in the instance object so we can increment it later
		if(typeof Instance.commentCount !== 'number'){
			Instance.commentCount = parseInt(responseBody.response[0].total, 10);
		}
		
		//Store the pagenumber that the user is seeing. Used to handle results caching
		Instance.currPage = parseInt(responseBody.response[0].page, 10);
		
		if (comItems && comItems.length > 0){		
			for(var index=0; index<comItems.length; ++index){
				
				//Container for comment item data & metadata
				var comData = {};
				
				comData.adobeEmployee = comItems[index]["ion.adbe"];
				comData.authorId = comItems[index]["ion.author_id"];
				comData.authorName = comItems[index].author;
				comData.authorRole = comItems[index]["ion.author_role"];
				comData.createdOn = Util.formatDate('', Number(comItems[index].created) * 1000);
				comData.content = Util.formatText(comItems[index].content);
				comData.ratingType = comItems[index]["ion.rating_type"];
				comData.rating = comItems[index]["ion.rating"];
				
				var commentItem = Template.getCommentItem(comData);
				
				if (index % 2) {
					commentItem.className = 'even';
				}					
									
				Template.comList.appendChild(commentItem);		
			}
		}
		else if (comItems.length < 1){
			//there are no comments for this article.
			Core.showNoContentMessage();
		}
		
		//Build the pagination control
		Template.buildPagination(Instance.currPage);
		
		//remove the loading comments message
		Msg.remove("LOAD_COMM");
		
		//Check if the commenting / rating service is available
		var online = Core.getServiceStatus(responseBody.status);
		
		if (Instance.currPage === 1){
			//check and run any actions set in the url hash
			Core.checkHashAction();
			
			//Set the screen name status of the user
			User.flag['screenName'] = User.hasScreenName();
			
			if (online === true){
				//decide which interaction controls to show: add comment / login
				Core.handleInteractionControls();
			}
		
			//update the badge heading comments count with the value set by the response
			Template.updateHeadingCount();
			
			//update the rating heading in the badge header
			Template.updateRatingHeading();
		
			//build or update the sidebar anchor with the number of comments and average rating
			Template.refreshAnchor();
		}
	};
	
	/**
	 * Show a message for no comments / no reviews / no rating on this resource.
	 * Watch for the user's "Has Rated" state in review conditions. 
	 * He will not be able to rate again. Don't confuse him with the wrong message
	 */
	Core.showNoContentMessage = function(){
		switch (Instance.type){
			//comment + rating badge
			case 1:
				if(User.flag['canRate'] === false){
					//the user has rated but there are no comments on this article.
					Msg.show("NO_COMM");
				}
				else{
					//the user has not rated and there are no comments on this article.
					Msg.show("NO_REVIEW");
				}
			break;
			
			//comment badge
			case 2:
				Msg.show("NO_COMM");
			break;
			
			//rating badge
			case 3:
				Msg.show("NO_RATING");
			break;
		}
	};
	
	/**
	 * Take the response from the server for add comment operation 
	 * and populate a HTML template with the comment contents
	 */
	Core.appendComment = function(responseBody){
		//Get the comments container (array) from the response 
		var comItem = responseBody.ion.comments[0];

		//Container for comment item data & metadata
		var comData = {};
		comData.ratingType = parseInt(comItem["ion.rating_type"],10);
		comData.rating = parseInt(comItem["ion.rating"],10);
		
		//Update the user's rating flags if he has rated on this comment.
		//We do this so he can't rate again in this session
		User.setRatingFags(comData.ratingType, comData.rating);			
		
		//update the heading text with the correct total comments count
		Template.incrementHeadingCount();
		
		//get the new number of comment pages
		var nrPages = Math.ceil(Instance.commentCount / config.comPerPage);
		if (nrPages !== Instance.currPage){
			/**
			 * The number of max comments on this page has been reached
			 * or the user has posted a comment on a different page than the last one.
			 * Get the comment list for the last page
			 */
			Core.getPage(nrPages, false);
		}
		else{
			//get the response data params 
			comData.adobeEmployee = comItem["ion.adbe"];
			comData.authorId = comItem["ion.author_id"];
			comData.authorName = comItem.author;
			comData.authorRole = comItem["ion.author_role"];
			comData.createdOn = Util.formatDate('', Number(comItem.created) * 1000);
			comData.content = Util.formatText(comItem.content);
		
			//build a new comment item with comment metadata (author, rating, date) and comment text
			var commentItem = Template.getCommentItem(comData);	
			
			//apply zebra stripping if needed
			if (Instance.commentCount % 2 === 0){
				commentItem.className = 'even';
			}
			
			//Append the coment item to the comment list
			Template.comList.appendChild(commentItem);
			
			//show thank you message for posting this comment
			Template.showThanks();
		}
		
		//update the related UI and internal variables
		Template.behavior.onAppendComment();
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
		
		var comments = Template.comList.getElementsByTagName("li");
		var lastComm = comments[comments.length-1];
		
		//make sure the last comment is the last LI of the comments UL, not the stars
		if(lastComm.parentNode.className.indexOf("ionStarRating") !== -1){
			//use the parent LI not the stars UL
			lastComm = lastComm.parentNode.parentNode;
		}
		
		var thanks = (Template.thanks)? Template.thanks:getThanksMessage();
		
		if (lastComm){
			lastComm.appendChild(thanks);
			Template.thanks = thanks;
		}
	};
	
	/**
	 * Take the response from the server for adding a rating and 
	 * update the rating UI, badge instance so the user can't rate again
	 */
	Core.updateRating = function(responseBody){
		var userRating = null;
		
		if (responseBody.ion.ratings){
			//stars rating result
			 userRating = parseInt(responseBody.ion.ratings[0]["content"], 10);
		}
		
		if (responseBody.ion.thumbs){
			//thumbs rating result
			 userRating = Core.decodeThumbValue(responseBody.ion.thumbs[0].content);
		}
		
		if (typeof userRating == 'number'){
			User.flag["canRate"] = false;
			User.flag["rating"] = parseInt(userRating, 10);
		}
		
		//reset form view
		Util.hide(Template.commentForm);
		Util.show(Template.butAdd);
		Util.show(Template.ratingModule);
		Util.show(Template.addForm);

		//update the UI with new rating data
		Template.rebuildRatingUI();
		
		//update the rating summary in the badge header
		Template.updateRatingHeading();
		
		//remote the stored rating value
		Core.deleteRating();
		
		//recalculate the average rating and update the UI
		Core.getAvgRating(Core.updateAvgRating);
		
		Msg.remove('ADD_RATING');
	};
	
	/**
	 * Return a numeric value based on the rating type.
	 * Ratings come from the API as "up"/"down" strings
	 */
	Core.decodeThumbValue = function(thumb){
		if (!thumb || typeof thumb !== "string"){
			return null;
		}
		
		var val = (thumb == "down")? 0:1;
		return val;
	};
	
	/**
	 * Extracts average rating, bayesian rating and user rating (if user is logged in) for the current url.
	 * 
	 * @param {Object} responseBody response object from the server for the avg rating request
	 */
	Core.updateAvgRating = function(responseBody){
		//update the internal variables for rating value and average value
		Core.setRatingInstanceVariables(responseBody);
		
		//build or update the sidebar anchor with the number of comments and average rating
		Template.refreshAnchor();
		
		//Update the rating summary in the badge header
		Template.updateRatingHeading();
	};
	
	/**
	 * Method runs on rating badges on first run.
	 * Gets the avgrating and sets variables to the badge Instance
	 * Update the sidebar anchor / user rating (if logged in)
	 * 
	 * @param {Object} responseBody response object from the server for the avg rating request
	 */
	Core.setAvgRating =  function(responseBody){
		//update the internal variables for rating value and average value
		Core.setRatingInstanceVariables(responseBody);
		
		//show stars / thumbs rating control or login link
		Core.handleInteractionControls();
		
		//build or update the sidebar anchor with the number of comments and average rating
		Template.refreshAnchor();
		
		//no ratings yet. invite user to rate this article
		if (typeof Instance.avgRating !== 'number'){
			Core.showNoContentMessage();
		}
	};
	
	/**
	 * Update the instance raring variable for avg rating, rating value;
	 * These will be used to build the rating UI / sidebar anchor
	 * 
	 * @param {Object} responseBody response object from the server for the avg rating request
	 */
	Core.setRatingInstanceVariables = function(responseBody){
		//The user has rated on this badge instance before. set flags and disallow the user to rate again
		if(responseBody.userRating){
			var uRating = responseBody.userRating;
			User.flag["canRate"] = false;
			User.flag["rating"] = parseInt(uRating, 10);
		}
		
		if(responseBody.userThumb){
			User.flag["canRate"] = false;
			User.flag["rating"] = Core.decodeThumbValue(responseBody.userThumb);
		}
		
		//response block shortcut
		if(responseBody.response[1][0]){
			var resp = responseBody.response[1][0];
		}
		
		if (resp){	
			//set the instance parameters for this updated badge. Used in the sidebar anchor
			Instance.avgRating = (typeof resp.content !== "undefined")? parseInt(resp.content, 10):0;
			Instance.ratingCount = (typeof resp.count !== "undefined")? parseInt(resp.count, 10):0;
			
			Instance.thumbsUpCount = (typeof resp.up !== "undefined")? parseInt(resp.up, 10):0;
			Instance.thumbsDownCount = (typeof resp.down !== "undefined")? parseInt(resp.down, 10):0;
		}
	};
	
	/**
	 * Check if the user has permissions to post comments / ratings
	 */
	Core.handleInteractionControls = function(){
		//Check if the user has permissions to post from the badge and throw messages accordingly
		var validUser = User.canInteract();
		
		if(validUser === true){
			//Build call to action area:  add comment button / rating control
			Template.buildCallToAction();
		}
	};
	
	/**
	 * Check if the commenting service is available or not. 
	 * - display service unavailable message
	 * 
	 * @return {Boolean}
	 */
	Core.getServiceStatus = function(status){
		var serviceOn = true;
		
		if (!status || status !== 'ok'){	
			serviceOn = false;
			Msg.show("SERVICE_OFF");
		}
		
		return serviceOn;
	};
	
	/**
	 * Check the login status of the user by 
	 * looking at cookies set by the adobe.com authentication procedure.
	 * Returns true if login cookie is set, false otherwise.
	 * 
	 * @return {Boolean}
	 */
	User.isLoggedIn = function(){	
		var login = Util.getCookie('WCDServer');	
		if (!login) {
			return false;
		}
		else{
			return true;
		}
		
	};
	
	/**
	 * Check if the user has a screen name set by the adobe.com login procedure
	 * Look in the SCREENNAME cookie
	 * 
	 * Returns true if the cookie is set, false otherwise
	 * 
	 *@return {Boolean}
	 */
	User.hasScreenName = function(){		
		var sn = Util.getCookie(config.screenNameCookieName);
		if (typeof sn !== 'string' || sn.length < 1){
			return false;
		}
		else{
			return true;
		}
	};
	
	/**
	 * Check if the user is logged in and has a valid screen name
	 * so he can interact with the badge: add comments / ratings
	 * 
	 * @return {Boolean}
	 */
	User.canInteract = function(){
		var canInteract = true;
		
		//check if commenting + rating have been disabled for this resource
		if (opt.disableFeedback){
			Msg.show("FEEDBACK_OFF", opt.disableFeedbackMessage);
			
			return false
		}
		
		//check if the user is logged in so he can add comments / ratings
		if (User.flag['login'] !== true){
			canInteract = false;
			
			//prompt user to login
			Msg.show("NO_LOGIN");
			
		}
		//check if the badge accepts comment posting but the user doesn't have a screen name
		else if (Instance.type !== 3 && User.flag['screenName'] !== true){
			canInteract = false;
			
			//prompt user to set a screen name
			Msg.show("NO_SCREENNAME");
			
			//delete the default Adobe.com screen name cookie (this uses the First Name)
			Util.deleteCookie(config.screenNameCookieName);
		}
		
		return canInteract;
	};
	
	/**
	 * Set the user's flags if he can rate, or if he's rate before set the rating
	 * 
	 * @param {Object} ratingType
	 * @param {Object} rating
	 */
	User.setRatingFags =  function(ratingType, rating){
		//the user already posted a rating here, return
		if (User.flag['canRate'] === false){
			return;
		}
			
		if (typeof ratingType == 'number' && !isNaN(ratingType) && ratingType !== 0 && typeof rating == 'number'){
			User.flag['canRate'] = false;
			User.flag['rating'] = rating;
		}
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
	}
	
	
	/**
	 * Return the environment's userAgent value
	 * If the enviroment does not support userAgent 'null' is returned
	 * 
	 * return {String/Object}
	 */
	Util.getUserAgent =  function(){
		return (window.navigator && window.navigator.userAgent)
			? window.navigator.userAgent
			: null;
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
	 * Use the SWF proxy to do GET or POST requests
	 * 
	 * @arg {String} url URL to call
	 * @arg {String} method type of request GET or POST
	 * @arg {Array} params parameters to append to the request
	 * @arg {String} onLoad name of the callback method to run when the server responds ok
	 * @arg {String} onError name of the callback method to run when an error is thrown
	 * @arg {String} id id of the call to be sent out
	 */
	Util.URLRequest = function(){	
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
	 * Remove whitespace from the begining of a string and return the result
	 * 
	 * @param {Object} str
	 * 				   input string to be trimmed
	 * 
	 * @return {String}	
	 */
	Util.trim = function(str){
		if (typeof str !== 'string'){
			return null;
		}
		
		return str.replace(/^(\s)+/g,"");		
	};
	
	Util.cleanInput = function(input){
		if (!input){
			return;
		}
		else{
			var cleanInput = input.replace(/&/g,"&amp;");
			cleanInput = cleanInput.replace(/</g,"&lt;");
			cleanInput = cleanInput.replace(/>/g,"&gt;");
			return cleanInput;
		}	
	};
			
	Util.formatText = function(input){
		if (!input){
			return;
		}
		else{
			var text = Util.cleanInput(input);
			
			text = Util.URLToHyperlink(text);
			
			text = text.replace(/\n/g," <br /> ");
			text = text.replace(/(\s){2}/g,"&nbsp;&nbsp;");
			return text;
		}	
	};
			
	Util.URLToHyperlink = function(string){
		var pattern = /((https?:\/\/|www\.)[-A-Za-z0-9+&@#\/%?=~_()|!:,.;]*[A-Za-z0-9+&@#\/%=~_|])/g;
		var matches = string.match(pattern);
		
		if (matches){
			var result = string;
			for (var x=0; x<matches.length; ++x){	
				var validURL = '';
				
				if(matches[x].substr(0,4)!='http'){
					validURL = 'http://'+matches[x];
				}
				else{
					validURL = matches[x];
				}
				result = result.replace(matches[x], '<a href="'+validURL+'">'+matches[x]+'</a>');
			}
			return result;
		}
		else{
			return string;
		}
	};
			
		
	Util.formatDate = function(format, UTCString){
		var rawDate = null;
		
		if(UTCString){		
			rawDate = new Date(UTCString);	
		}					
		else{
			rawDate = new Date();
		}
						
		var monthNames="January,February,March,April,May,June,July,August,September,October,November,December";
		var month = monthNames.split(',');
					
		var monthName = month[rawDate.getMonth()];
		var fullYear = rawDate.getFullYear();
		var day = rawDate.getDate();
		
		if (!format){
			return monthName+ ' ' +	day+ ', '+fullYear;
		}	
	};
		
	/**
	 * Remove anchors (hashes) from url and encode the result.
	 * 
	 * @param {String} url 
	 * @return {String}
	 */
	Util.cleanURL = function(url){		
		//remove any hash / anchor references from the resource url
		url = url.replace(/#(.*)/,"");
		
		//replace multiple slashes in URL with single slashes but ignore http:// and https://
		url =  url.replace(/(https?:)?\/{2,}/g, function($0, $1){
			return $1 ? $0 : "/"; 
		})
		
		//encode the url for safe delivery over HTTP calls
		url = encodeURIComponent(url);
		return url;
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
	 * Get the value of a cookie.
	 * Returns null if the cookie doesn't exist.
	 * 
	 * @param {String} cookieName name of the cookie for which to get the value
	 * 
	 * @return {String}
	 * @return {Null}
	 */
	Util.getCookie = function(cookieName){
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
		document.cookie=cookieName+ "=" +escape(value)+((expiredays===null) ? "" : ";expires="+exdate.toGMTString());
	};
	
	/**
	 * Delete a set cookie by replacing it with one that expires in the past
	 * @param {Object} cookieName name of the cookie to be deleted
	 */
	Util.deleteCookie = function(cookieName){
		Util.setCookie(cookieName,"",-1);
	};
	
	/**
	 * Build an autodiscovery link for the rss feed and attach it 
	 * to the HEAD element so the browser cand handle it.
	 * 
	 * @param {String} rssFeed 
	 * 				   url of the RSS feed. The url should return valid XML
	 * 
	 * @param {String} title
	 * 				   Title of the RSS feed that will be shown in the browser controls
	 * 
	 * @return {void}
	 */
	Util.setRSSAutodiscovery = function(rssFeed, title){
		if (!rssFeed || typeof rssFeed !== "string" || !title || typeof title !== "string"){
			return;
		}
		
		//build the autodiscovery link element
		var autodiscovery = Template.createEl("link",{
			"rel":"alternate",
			"type":"application/rss+xml",
			"href":rssFeed,
			"title":title
		});
		
		//attach to the document HEAD and let the browser consume it
		document.getElementsByTagName('head')[0].appendChild(autodiscovery);
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

	return {
		/**
		 * Setup the badge with the user specified paramteres or use defaults.
		 * 
		 * @return {void}
		 */
		load:function(){
			//get the resource url
			if (this.url && typeof this.url == 'string') {
				var safeURL = Util.trim(this.url);
			}
			
			var _url = (safeURL && safeURL.length > 1)? safeURL: window.location.toString();
			var _mcl = this.maxCommentLength;
			var _hash = window.location.hash.toString();
			opt.hash = _hash.substring(1);
			opt.url = Util.cleanURL(_url);
			opt.locale = (this.locale && typeof this.locale == 'string')? this.locale : "en_US";
			opt.container = (typeof this.container == 'object')? this.container : document.body;
			opt.anchor = (typeof this.anchor == 'object')? this.anchor : null;
			opt.commenting = (this.commenting === false)? false : true;
			opt.rating = (this.rating === false)? false : true;
			opt.ratingType = (this.ratingType == 'thumbs')? 2 : 1; //1: stars, 2: thumbs
			opt.siteArea = this.siteArea || null;
			opt.productLabel = this.productLabel || null;
			opt.timeOutDelay = (typeof this.timeOutDelay == 'number')? this.timeOutDelay:30000;
			opt.maxComLength = (typeof _mcl == 'number' && _mcl < 5000)? _mcl:5000;
			opt.system = this.system || null;
			opt.disableFeedback = this.disableFeedback || false;
			opt.disableFeedbackMessage = this.disableFeedbackMessage || null;
					
			Core.setup();
			
			//Set default fallbacks to the output settings object
			this.commenting = opt.commenting;
			this.rating = opt.rating;
			this.ratingType = (opt.ratingType == 2)? "thumbs" : "stars";
			this.locale = opt.locale;
			this.siteArea = opt.siteArea;
			this.productLabel = opt.productLabel;
			this.url = (this.url && typeof this.url == 'string')? this.url : window.location.toString();
			
			window.ionBadgeBeacon = this;
			
			//CHC trigger for ionBadgeBeacon within Help Viewer AIR application 
			if (typeof badgeBeaconReady !== 'undefined'){
				badgeBeaconReady();
			}
		},
		
		/**
		 * Return an object with the badge setup parameters set by the user.
		 * If this function is called before load() it will return 'null'
		 * 
		 * @return {Object}
		 */
		getSetupParams: function(){
			return (typeof opt.url !== 'undefined')
				? opt
				: null;
		}
	};
};
