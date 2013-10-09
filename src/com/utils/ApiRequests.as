package com.utils{
	import com.api.UserInfo;
	import com.hurlant.math.BigInteger;
	import com.ppstatic.Config;
	
	import flash.events.Event;
	import flash.events.HTTPStatusEvent;
	import flash.events.IOErrorEvent;
	import flash.filesystem.File;
	import flash.filesystem.FileMode;
	import flash.filesystem.FileStream;
	import flash.net.URLLoader;
	import flash.net.URLLoaderDataFormat;
	import flash.net.URLRequest;
	import flash.net.URLRequestHeader;
	import flash.net.URLRequestMethod;
	import flash.net.URLVariables;
	import flash.utils.ByteArray;
	
	import mx.controls.Alert;
	import mx.utils.StringUtil;
	import mx.utils.UIDUtil;
	
	import org.flaircode.oauth.IOAuth;
	import org.flaircode.oauth.OAuth;
	import org.iotashan.oauth.OAuthToken;
	
	public class ApiRequests {
		
		private var oauth:IOAuth;
		private var accessToken:OAuthToken;
		
		private const USER_INFO_API:String = "user/me/profile.json";
		
		public function ApiRequests(oauth:IOAuth, accessToken:OAuthToken) {
			this.oauth = oauth;
			this.accessToken = accessToken;
		}
		
		public function getAccessToken():OAuthToken{
			return accessToken;
		}
		
		public function doServiceCall(request:URLRequest, successCallback:Function, errorCallback:Function):void {		
			try {
				var loader:URLLoader = new URLLoader();
				loader.addEventListener(Event.COMPLETE, successCallback);
				loader.dataFormat = URLLoaderDataFormat.BINARY;
				loader.addEventListener(IOErrorEvent.IO_ERROR, errorCallback);
				loader.load(request);
			} catch(e:Error) {}
		}
		
		public function getUserInfo(successCallback:Function, errorCallback:Function):void {
			var request:URLRequest = oauth.buildRequest(URLRequestMethod.GET, Config.getUserInfoUrl(USER_INFO_API), accessToken, {});
			doServiceCall(request, successCallback, errorCallback);
		}
		
		public function getUserProjectInfo(successCallback:Function, errorCallback:Function):void {
			var request:URLRequest = oauth.buildRequest(URLRequestMethod.GET, Config.getUserProjects(), accessToken, {});
			doServiceCall(request, successCallback, errorCallback);
		}
		
				
		public function getMyPosts(successCallback:Function, errorCallback:Function):void {
			var request:URLRequest;
			request = oauth.buildRequest(URLRequestMethod.GET, Config.getMyPostsUrl(), 
														accessToken, {count:30});
			doServiceCall(request, successCallback, errorCallback);
		}
		
		public function getUpdates(successCallback:Function, errorCallback:Function, loadedTime:Number):void {
			var request:URLRequest;
			request = oauth.buildRequest(URLRequestMethod.GET, Config.getUpdatesUrl(), 
				accessToken, {ts:loadedTime});
			doServiceCall(request, successCallback, errorCallback);
		}

		public function getCoWorkers(successCallback:Function, errorCallback:Function):void {
			var request:URLRequest = this.oauth.buildRequest(URLRequestMethod.GET,
				Config.getCoWorkersUrl(), accessToken, {});
			doServiceCall(request, successCallback, errorCallback);
		}

		
		public function getProjectGroups(successCallback:Function, errorCallback:Function):void {
			var request:URLRequest = oauth.buildRequest(URLRequestMethod.GET,
				Config.getProjectGroupsUrl(), accessToken, {});
			doServiceCall(request, successCallback, errorCallback);
		}

		// POST SECTION
		/*public function getPost(successCallback:Function, errorCallback:Function, converId:String):void {
			var request:URLRequest = oauth.buildRequest(URLRequestMethod.GET, Config.getPostUrl(converId), accessToken, {});
			doServiceCall(request, successCallback, errorCallback);
		}*/
		
		public function addPost(projectId:String, text:String, at_reference:Array, successCallback:Function, errorCallback:Function):void {
			var request:URLRequest = oauth.buildRequest(URLRequestMethod.POST, Config.getAddPostUrl(projectId),
				accessToken, {text: text, at_reference: at_reference});
			request.contentType = "application/x-www-form-urlencoded";
			doServiceCall(request, successCallback, errorCallback);
		}

		public function addPostWithAttachment(successCallback:Function, errorCallback:Function, projectId:String, file:File, comment:String, atReferenceIds:Array):void{
			var url:String = Config.getAddPostUrl(projectId);
			
			var fs:FileStream = new FileStream();
			fs.open(file, FileMode.READ);
			var byteArray:ByteArray = new ByteArray();
			fs.readBytes(byteArray, 0, fs.bytesAvailable);
			fs.close();
			
			var request:URLRequest = oauth.buildRequest(URLRequestMethod.PUT, url, this.accessToken,
				{text:comment, name: file.name, at_reference: atReferenceIds});
			var header:URLRequestHeader = new URLRequestHeader('Content-Length', byteArray.length.toString());
			request.contentType = "application/x-binary";
			request.requestHeaders.push(header);
			request.data = byteArray;
			
			doServiceCall(request, successCallback, errorCallback);
		}
		
		public function deletePost(successCallback:Function, errorCallback:Function, postId:Number):void {
			var request:URLRequest = oauth.buildRequest(URLRequestMethod.POST, Config.getDeletePost(String(postId)),
														accessToken, {});
			request.contentType = "application/x-www-form-urlencoded";
			doServiceCall(request, successCallback, errorCallback);
		}
		
		// COMMENT SECTION
		/*
		public function getComment(successCallback:Function, errorCallback:Function,
								   converId:String, postId:String):void {
			var request:URLRequest = oauth.buildRequest(URLRequestMethod.GET,
				Config.getCommentUrl(converId, postId),
				accessToken, {});
			request.contentType = "application/x-www-form-urlencoded";
			doServiceCall(request, successCallback, errorCallback);
		}*/
		
		public function addComment(successCallback:Function, errorCallback:Function,
								   converId:String, comment:String, atReferenceIds:Array):void {
			var request:URLRequest = oauth.buildRequest(URLRequestMethod.POST, Config.getAddCommentUrl(converId),
														accessToken, {text:comment, at_reference:atReferenceIds});
			request.contentType = "application/x-www-form-urlencoded";
			doServiceCall(request, successCallback, errorCallback);
		}
				
		public function addCommentWithAttachment(successCallback:Function, errorCallback:Function, 
												 converId:String,
												 comment:String, atReferenceIds:Array, file:File):void{
			var url:String = Config.getAddCommentUrl(converId);
			
			var fs:FileStream = new FileStream();
			fs.open(file, FileMode.READ);
			var byteArray:ByteArray = new ByteArray();
			fs.readBytes(byteArray, 0, fs.bytesAvailable);
			fs.close();
			
			var request:URLRequest = oauth.buildRequest(URLRequestMethod.PUT, url,
												this.accessToken,
												{text:comment, name: file.name, at_reference: atReferenceIds});
			var header:URLRequestHeader = new URLRequestHeader('Content-Length', byteArray.length.toString())
			request.contentType = "application/x-binary";
			request.requestHeaders.push(header);
			request.data = byteArray;
			
			doServiceCall(request, successCallback, errorCallback);
		}
		
		public function deleteComment(successCallback:Function, errorCallback:Function, postId:Number, commentId:Number):void {
			var request:URLRequest = oauth.buildRequest(URLRequestMethod.POST, Config.getDeleteCommentUrl(postId, commentId),
				accessToken, {});
			request.contentType = "application/x-www-form-urlencoded";
			doServiceCall(request, successCallback, errorCallback);
		}
		
		public function doDownload(successCallback:Function, errorCallback:Function, documentId:String):void {
			var url:String = Config.getDocumentDownloadUrl(documentId);
			var request:URLRequest = oauth.buildRequest(URLRequestMethod.GET, url, accessToken, {});			
			doServiceCall(request, successCallback, errorCallback);
		}
		
		// LIKE SECTION
		public function getLikePost(successCallback:Function, errorCallback:Function, postId:Number, userId:Number):void {
			var request:URLRequest = oauth.buildRequest(URLRequestMethod.GET,
				Config.getLikePostUrl(postId, userId), accessToken, {});
			request.contentType = "application/x-www-form-urlencoded";
			doServiceCall(request, successCallback, errorCallback);
		}
		
		public function toggleLikePost(successCallback:Function, errorCallback:Function,
									   postId:Number, userId:Number, isLike:Boolean = true):void {
			var request:URLRequest;
			if (isLike){
				request = oauth.buildRequest(URLRequestMethod.POST,
						Config.getLikePostUrl(postId, userId), accessToken, {});
			}
			else{
				request = oauth.buildRequest(URLRequestMethod.POST,
						Config.getUnlikePostUrl(postId, userId), accessToken, {});
			}
			
			request.contentType = "application/x-www-form-urlencoded";
			doServiceCall(request, successCallback, errorCallback);
		}

	}
}
