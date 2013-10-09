package com.ppstatic{
	import flash.filesystem.File;
	import flash.filesystem.FileMode;
	import flash.filesystem.FileStream;
	import flash.utils.ByteArray;
	
	import mx.utils.StringUtil;

	public class Config{
		
		//production keys
		public static var consumenrKey:String = "5c171f83f50c7e37cbe6d269a7715cd3";
		public static var consumenrSecret:String = "1ce9c91b65082eecd60f3df3448628060215419e";
		
		//public static const startUpserverName:String = 'api.projectplace.com'
		public static const startUpserverName:String = 'api-ram.next.in-dev.projectplace.com'
			
		public static var serverName:String =  startUpserverName
		private static var serviceUrl:String = "https://{0}/1/{1}";
		private static var fileStorageDir:File = File.documentsDirectory;		
		private static var ACCESS_TOKEN_LOCAL_STORAGE:String = "OAUTHACCESSTOKEN";

		private static var requestTokenUrl:String = "https://{0}/initiate";
		private static var accessTokenUrl:String = "https://{0}/token";
		private static var authorizeUrl:String = "https://{0}/authorize";
		private static var userImageUrl:String = "https://{0}/1/avatar/{1}/{2}";
		private static var conversationChannelUrl:String = "https://{0}/1/user/{1}/conversation/channel.json";
		//conversations/project/<proj_id>/updates.json
		private static var userProjectsUrl:String = "https://{0}/1/user/me/projects.json";
		private static var coWorkersUrl:String = "https://{0}/1/user/me/coworkers.json";
		private static var projectGroupsUrl:String = "https://{0}/1/user/me/project-groups.json";
		//private static var myPostsUrl:String = "https://{0}/1/user/me/conversations.json";
		private static var myPostsUrl:String = "https://{0}/1/conversation/user/me/posts.json";
		
		private static var myPostsUpdatesUrl:String = "https://{0}/1/conversation/user/me/updates.json";

		private static const documentDownloadUrl:String = "https://{0}/1/document/{1}";

		//private static var conversationUrl:String = "https://{0}/1/conversation/{1}/posts.json";
		private static var addPostUrl:String = "https://{0}/1/conversation/project/{1}/post/create.json";
		private static var deletePostUrl:String = "https://{0}/1/conversation/post/{1}/delete.json";		

		//private static var commentUrl:String = "https://{0}/1/post/{1}/properties.json";
		private static var addCommentUrl:String = "https://{0}/1/conversation/post/{1}/comment/create.json";
		private static var deleteCommentUrl:String = "https://{0}/1/conversation/post/{1}/comment/{2}/delete.json";

		private static var likePostUrl:String = "https://{0}/1/conversation/post/{1}/user/{2}/like.json"
		private static var unLikePostUrl:String = "https://{0}/1/conversation/post/{1}/user/{2}/unlike.json";
				
		public static function getServiceUrl():String{
			return StringUtil.substitute(serviceUrl, serverName)
		}
		
		public static function getRequestTokenUrl():String{
			return StringUtil.substitute(requestTokenUrl, serverName) 
		}
		
		public static function getAccessTokenUrl():String{
			return StringUtil.substitute(accessTokenUrl, serverName)
		}
		
		public static function getAuthorizeUrl():String{
			return StringUtil.substitute(authorizeUrl, serverName)
		}
		
		public static function getUserInfoUrl(url:String):String{
			return StringUtil.substitute(serviceUrl, serverName, url) 
		}
		
		public static function getUserImageUrl(userId:String):String{
			return StringUtil.substitute(userImageUrl, serverName, userId,
				ProjectPlaceWall.apirequest.getAccessToken().key)
		}
		
		/*public static function getConversationChannelUrl(userId:String):String{
			return StringUtil.substitute(conversationChannelUrl, serverName, userId) 
		}*/	

		public static function getUserProjects():String{
			return StringUtil.substitute(userProjectsUrl, serverName)
		}

		public static function getCoWorkersUrl():String{
			return StringUtil.substitute(coWorkersUrl, serverName)
		}

		
		public static function getProjectGroupsUrl():String{
			return StringUtil.substitute(projectGroupsUrl, serverName)
		}

		public static function getMyPostsUrl():String{
			return StringUtil.substitute(myPostsUrl, serverName)
		}

		public static function getUpdatesUrl():String{
			return StringUtil.substitute(myPostsUpdatesUrl, serverName)
		}
		
		public static function getDocumentDownloadUrl(documentId:String):String{
			return StringUtil.substitute(documentDownloadUrl, serverName, documentId)
		}
		
		public static function getFileStorageDir():File{
			var userDownloadedFile:File = fileStorageDir.resolvePath('PPConversationWall');			
			userDownloadedFile.createDirectory();			
			return userDownloadedFile
		}
		
		/*public static function getPostUrl(converId:String):String{
			return StringUtil.substitute(conversationUrl, serverName, converId)
		}*/
		
		public static function getAddPostUrl(projectId:String):String{
			return StringUtil.substitute(addPostUrl, serverName, projectId)
		}
		
		public static function getDeletePost(conversationId:String):String{
			return StringUtil.substitute(deletePostUrl, serverName, conversationId)
		}

		/*
		public static function getCommentUrl(converId:String, postId:String):String{
			return StringUtil.substitute(commentUrl, serverName, postId)
		}*/
		
		public static function getAddCommentUrl(converId:String):String{
			return StringUtil.substitute(addCommentUrl, serverName, converId)
		}
		
		public static function getDeleteCommentUrl(conversationId:Number, postId:Number):String{
			return StringUtil.substitute(deleteCommentUrl, serverName, conversationId, postId)
		}
		
		public static function getLikePostUrl(conversationId:Number, userId:Number):String{
			return StringUtil.substitute(likePostUrl, serverName, conversationId, userId)
		}
		
		public static function getUnlikePostUrl(conversationId:Number, userId:Number):String{
			return StringUtil.substitute(unLikePostUrl, serverName, conversationId, userId)
		}			
	}

}
