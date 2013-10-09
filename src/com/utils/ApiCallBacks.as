package com.utils{
	import com.adobe.serialization.json.JSON;
	import com.objects.PostObject;
	
	import flash.events.Event;
	import flash.filesystem.File;
	
	import mx.collections.ArrayList;
	import mx.controls.Alert;
	
	public class ApiCallBacks{
		
		private var postArray:ArrayList = new ArrayList();
		
		public function getMyPosts(callbackFun:Function):void{
			ProjectPlaceWall.apirequest.getMyPosts( 
				function(e:Event):void{
					myPostsSuccess(e, callbackFun)
				}
				, 
				function(e:Event):void{
					myPostsFail(e, callbackFun)
				});
		}
			
		private function myPostsSuccess(e:Event, callbackFun:Function):void
		{
			var posts:Array = (JSON.decode(e.target.data)).posts;
			for each(var obj:Object in posts){
				var postObj:PostObject = Utils.createPostObj(obj);
				if (postObj != null){
					postArray.addItem(postObj)
				}
			}
			callbackFun(postArray);
		}
		
		
		private function myPostsFail(e:Event, callbackFun:Function):void{
			callbackFun(postArray);
		}
		
		/*
		private function getAllPostComments(tempPostArray:Array, callbackFun:Function):void{
			if (tempPostArray.length){
				var postObj:Object = tempPostArray.shift();
				getPost(postObj.id, function(postWithCommentsObj:Object):void{
					if (postWithCommentsObj != null){
						postArray.addItem(postWithCommentsObj)
					}
					getAllPostComments(tempPostArray, callbackFun)
				});
			}
			else{
				callbackFun(postArray);
			}
		}
		*/
	
		/*private function createCommentObject(commentsArray:ArrayCollection):Object{
			var commentObj:Object = new Object()
			var visiblity:Boolean = false
			var commentHeight:Number = 0
			var lastCommentObj:Object
			if (commentsArray.length){
				visiblity = true;
				commentHeight = 40;
				lastCommentObj = commentsArray.getItemAt(commentsArray.length-1);
			}
			commentObj.last_post = lastCommentObj;
			commentObj.lastCommentVisible = visiblity;
			commentObj.showCommentSelected = false;
			commentObj.height = commentHeight;
			commentObj.posts = commentsArray;
			return commentObj;
		}
		*/
		
		/*public function getPost(conversationId:String, callbackFun:Function):void{
			ProjectPlaceWall.apirequest.getPost(
				function(e:Event):void{
					getPostSuccess(e, callbackFun)
				}, 
				function(e:Event):void{
					getPostFail(e, callbackFun)
				},
				conversationId);
		}
		
		private function getPostSuccess(e:Event, callbackFun:Function):void{
			var object:Object = (JSON.decode(e.target.data) as Object);
			var postObj:PostObject = createNewPostObj(object);
			callbackFun(postObj);
		}
		
		private function getPostFail(e:Event, callbackFun:Function):void{ callbackFun(null)}
		*/
		
		public function addPost(projectId:String, postText:String, atReferenceIds:Array, newConSuccessCallback:Function):void{
			ProjectPlaceWall.apirequest.addPost(projectId, postText, atReferenceIds ,
				function(e:Event):void{
					addPostSuccess(e,newConSuccessCallback)
				}, 
				function(e:Event):void{
					addPostFail(e, newConSuccessCallback)
				});
		}
		
		public function addPostWithAttachment(projectId:String, postText:String, atReferenceIds:Array, 
											  newConSuccessCallback:Function, file:File):void
		{
			ProjectPlaceWall.apirequest.addPostWithAttachment(
				function(e:Event):void{
					addPostSuccess(e, newConSuccessCallback)
				}, 
				function(e:Event):void{
					addPostFail(e, newConSuccessCallback)
				},
				projectId, file, postText, atReferenceIds);
		}
		
		private function addPostSuccess(e:Event, newConSuccessCallback:Function):void
		{
			var object:Object = (JSON.decode(e.target.data) as Object);
			newConSuccessCallback(object);
		}
		
		private function addPostFail(e:Event, newConSuccessCallback:Function):void{newConSuccessCallback(null);}
		
		public function deletePost(postId:Number, newConSuccessCallback:Function):void{
			ProjectPlaceWall.apirequest.deletePost(
				function(e:Event):void{
					var response:Object = (JSON.decode(e.target.data) as Object);
					if (response.status == 1){
						newConSuccessCallback(response);
					}
				}, 
				function(e:Event):void{
					var response:Object = (JSON.decode(e.target.data) as Object);
					if (response.hasOwnProperty('error_code')){
						Alert.show(response.description);
					}
					else{
						Alert.show(e.target.data);
					}
				},
				postId);
		}
		
		/*
		public function getComment(projectId:String, conversationId:String, postId:String, callbackFunction:Function):void{
			ProjectPlaceWall.apirequest.getComment(
				function(e:Event):void{
					commentSuccess(e, conversationId, projectId, callbackFunction)
				}, 
				function(e:Event):void{
					commentFail(e, callbackFunction)
				},
				conversationId, postId);
		}*/
		
		public function addComment(conversationId:String, text:String, atReferenceIds:Array, callbackFun:Function):void{
			ProjectPlaceWall.apirequest.addComment(
				function(e:Event):void{
					commentSuccess(e, conversationId, callbackFun)
				}, 
				function(e:Event):void{
					commentFail(e, callbackFun)
				},
				conversationId, text, atReferenceIds);
		}
		
		public function addCommentWithAttachment(conversationId:String, text:String,
												 atReferenceIds:Array, callbackFun:Function, file:File):void
		{
			ProjectPlaceWall.apirequest.addCommentWithAttachment(
				function(e:Event):void{
					commentSuccess(e, conversationId, callbackFun)
				}, 
				function(e:Event):void{
					commentFail(e, callbackFun)
				},
				conversationId, text, atReferenceIds, file);
		}
				
		public function deleteComment(postId:Number, commentId:Number, callback:Function):void{
			ProjectPlaceWall.apirequest.deleteComment(
				function(e:Event):void{
					var response:Object = (JSON.decode(e.target.data) as Object);
					if (response.status == 1){
						callback(response);
					}
				}, 
				function(e:Event):void{
					var response:Object = (JSON.decode(e.target.data) as Object);
					if (response.hasOwnProperty('error_code')){
						Alert.show(response.description);
					}
					else{
						Alert.show(e.target.data);
					}
				},
				postId, commentId);
		}
		
		private function commentSuccess(e:Event, conversationId:String, callbackFun:Function):void{
			var object:Object = (JSON.decode(e.target.data) as Object);
			//object.main_post_id = conversationId;
			callbackFun(object);
		}
		
		private function commentFail(e:Event, callbackFun:Function):void{
			callbackFun(null);
		}

		public function getLikePost(postId:Number, userId:Number, callbackFun:Function):void{
			ProjectPlaceWall.apirequest.getLikePost(
				function(e:Event):void{
					likePostSuccess(e, callbackFun)
				}, 
				function(e:Event):void{
					likePostFail(e, callbackFun)
				},
				postId, userId);
		}
		
		public function toggleLikePost(postId:Number, userId:Number, isLike:Boolean, callbackFun:Function):void{
			ProjectPlaceWall.apirequest.toggleLikePost(
				function(e:Event):void{
					likePostSuccess(e, callbackFun)
				}, 
				function(e:Event):void{
					likePostFail(e, callbackFun)
				},
				postId, userId, isLike);
		}
		
		private function likePostSuccess(e:Event, callbackFun:Function):void{
			var likedByObj:Object = (JSON.decode(e.target.data) as Object);
			callbackFun(likedByObj);
		}
		
		private function likePostFail(e:Event, callbackFun:Function):void{ callbackFun(new Object)}
	}
}