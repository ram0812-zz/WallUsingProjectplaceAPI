package com.pages
{
	import com.adobe.serialization.json.JSON;
	import com.api.UserInfo;
	import com.api.UserProjects;
	import com.objects.CommentObject;
	import com.objects.PostObject;
	import com.utils.ApiCallBacks;
	import com.utils.HandleUpdates;
	import com.utils.Utils;
	import com.view.MainContainer;
	
	import flash.filesystem.File;
	
	import mx.collections.ArrayList;
	import mx.controls.Alert;
	import mx.core.IFactory;
	import mx.events.CollectionEvent;
	import mx.messaging.channels.StreamingAMFChannel;
	
	
	public class MainPage extends MainContainer
	{
		public static var Container:Number;
		private var callBackFunc:Function;
		private var interval:Number;
		public var updates:HandleUpdates;
		private var apicallback:ApiCallBacks = new ApiCallBacks();
		
		public function MainPage():void
		{
			updates = new HandleUpdates(this);
		}

		public function showAllPosts(callBack:Function):void{
			this.callBackFunc = callBack;
			apicallback.getMyPosts(getAllPostsSuccess);
		}
					
		public function getRecentUpdatesSuccess(posts:ArrayList):void
		{
		/*	for (var index:int=0; index < posts.length; index++)
			{
				if (posts[index].main_post.created_time > lastLoadedTime/1000)
				{
					posts[index].incomingNewPost = true;
					handleNewPost(posts[index]);
				}
				else
				{
					for (var commentIndex:int=0; commentIndex < posts[index].commentObj.comments.length; commentIndex++)
					{
						if (posts[index].commentObj.comments[commentIndex].created_time > lastLoadedTime/1000)
							handleNewComment(posts[index], posts[index].id, posts[index].commentObj.comments[commentIndex].id, true);
					}
											
				}
			}	
			var now:Date = new Date();
			lastLoadedTime = now.getTime();
			*/
		}
		
		public function getAllPostsSuccess(posts:ArrayList):void{
			//globalpostList = posts;
			visible = true;
			postList.dataProvider = posts;
			updates.setTimer();
		}
		
		public function addPost(projectId:String, text:String, atReferenceIds:Array, 
					file:File, attachment:Boolean, addPostResponse:Function):void
		{
			if (attachment)
			{
				apicallback.addPostWithAttachment(projectId, text, atReferenceIds,
					function(postObj:Object):void{addPostResponse(postObj)}, file)

			}
			else
			{
				apicallback.addPost(projectId, text, atReferenceIds, function(postObj:Object):void{addPostResponse(postObj)})
			}
		}
		
		public function addComment(postId:String, text:String, atReferenceIds:Array, 
								file:File, attachment:Boolean, addCommentResponse:Function):void
		{
			if (attachment)
			{
				apicallback.addCommentWithAttachment(postId, text, atReferenceIds,
					function(commentObj:Object):void{addCommentResponse(commentObj)}, file);	
			}
			else
			{
				apicallback.addComment(postId, text,
					atReferenceIds, function(commentObj:Object):void{addCommentResponse(commentObj)});			
			}
		}
		
		public function addPostToContainer(obj:Object, projectId:Number, text:String):void{
			
			var user:Object = UserInfo.getUserObj();
			var postObj:PostObject = new PostObject(obj.id);

			postObj.message = text
			postObj.createdByObj = new Object();
			postObj.createdByObj.id = user.id;
			postObj.createdByObj.name = user.sort_name;
			postObj.projectObj = new Object();
			postObj.projectObj.name =  UserProjects.getProjectName(String(projectId));
			postObj.projectObj.id =  projectId;
			postObj.attachmentObj = obj.attachment;
			postList.dataProvider.addItemAt(postObj, 0);
			this.updates.setTimer();
		}
		
		public function addCommentToContainer(obj:Object, postId:Number, text:String):void
		{
			for (var i:Number=0; i<postList.dataProvider.length; i++)
			{   
				if (postList.dataProvider.getItemAt(i).id == postId)
				{
					var oldObject:Object = postList.dataProvider.getItemAt(i);
					oldObject.numberOfComments = oldObject.numberOfComments + 1;
					var user:Object = UserInfo.getUserObj();
					
					var commentObj:Object = new CommentObject(obj.id);
					commentObj.post_id = postId;
					commentObj.message = text;
					commentObj.createdByObj = new Object();
					commentObj.createdByObj.id = user.id;
					commentObj.createdByObj.name = user.sort_name;
					commentObj.attachmentObj = obj.attachment;
					//oldObject.comments.addItem(commentObj);
					var postObj:Object = postList.dataProvider.getItemAt(i);
					postObj.comments.addItemAt(commentObj, postObj.comments.length);// = oldObject;
					break;
				}
			}
			this.updates.setTimer();
		}
		
		public function deletePost(postId:Number):void
		{
			apicallback.deletePost(postId, function(response:Object):void{ deletePostCallBack(response, postId)});	
		}
		public function deletePostCallBack(response:Object, postId:Number):void
		{
			if (response && response.status == true)
			{
				for (var i:Number = 0; i < postList.dataProvider.length; i++){
					if (postList.dataProvider.getItemAt(i).id == postId){
						var elem:Object = postList.dataProvider.getItemAt(i);
						elem = null;
						postList.dataProvider.removeItemAt(i);
						//globalpostList.removeItemAt(i);
						break;
					}
				}
			}
		}
		
		public function deleteComment(postId:Number, commentId:Number):void
		{
			apicallback.deleteComment(postId, commentId, 
				function(response:Object):void{ deleteCommentCallBack(response, postId, commentId)});
		}
	
		public function deleteCommentCallBack(response:Object, postId:Number, commentId:Number):void
		{
			if (response && response.status == true)
			{
				for (var i:Number=0; i<postList.dataProvider.length; i++)
				{
					if (postList.dataProvider.getItemAt(i).id == postId)
					{
						var oldObject:Object = postList.dataProvider.getItemAt(i);
						var tempComments:ArrayList = new ArrayList(oldObject.comments.toArray().slice(0));
						for (var j:Number = 0; j < oldObject.comments.length; j++)
						{
							if (tempComments.getItemAt(j).id == commentId)
							{
								oldObject.numberOfComments = oldObject.numberOfComments - 1;
								var elem:Object = tempComments.getItemAt(i);
								elem = null;
								tempComments.removeItemAt(j);
								oldObject.comments = tempComments;
								//globalpostList[i] = oldObject;
								postList.dataProvider.setItemAt(oldObject, i);// = oldObject;
								break;
							}
						}
					}
				}	
			}
		}

		
		public function toggleLikePost(postId:Number, userId:Number, isLiked:Boolean):void
		{
			apicallback.toggleLikePost(postId, userId, isLiked, function(response:Object):void{likeCallBack(response, postId, isLiked)})
		}
		
		protected function likeCallBack(response:Object, postId:Number, isLiked:Boolean):void
		{
			if (response && response.status)
			{

				for (var i:Number=0; i<postList.dataProvider.length; i++)
				{   
					if (postList.dataProvider.getItemAt(i).id == postId)
					{
						var user:Object = UserInfo.getUserObj();
						var postObj:Object = postList.dataProvider.getItemAt(i);
						var likedObj:Array = postObj.likedByObj;
						
						if (isLiked)
						{
							var newLikedUser:Object = new Object();
							newLikedUser.user_id = user.id;
							postObj.likedByObj[postObj.likedByObj.length] = newLikedUser;
							postList.dataProvider.setItemAt(postObj, i);
							
						}
						else
						{
							 for (var  index:int = 0; index < likedObj.length; index++)
							 {
								 if (likedObj[index].user_id == user.id)
								 {
									 likedObj.splice(index, index+1);	 
									 postObj.likedByObj = likedObj;
									 postList.dataProvider.setItemAt(postObj, i);
									 break;
								 }
							 }
						}
					}
				}
			}
			
			/*		
			if (likedByArr && likedByArr.liked_by)
			{
				data.liked_by = likedByArr.liked_by;
				likedCount.visible = true;
				likedCountText.text = data.liked_by.length;
				var likeText:String = "Like"
				for each(var obj:Object in data.likedByObj)
				{
					if (obj.id == user.id){
						likeText = "Unlike";
						break;
					}
				}
				likePost.text = likeText;
			}
			else
			{
				data.likedByObj = null;
				likedCount.visible = false;
				likePost.text = "Like";		
			}*/
		}
		
		/*
		public function handleNewComment(postObj:Object, postId:String, commentId:String, incoming:Boolean = false):void
		{	
			var oldPostObjIndex:Number = -1; 
			
			// Find the existing post
			for (var i:Number=0; i<globalpostList.length; i++)
			{   
				if (globalpostList[i].id == postId)
				{
					oldPostObjIndex = i;
					break;
				}
			}	
			
			if (oldPostObjIndex != -1)
			{
				var oldPostObj:Object = globalpostList[oldPostObjIndex];
				
				// Retain the skin of old comments
				for (var k:Number=0; k<oldPostObj.commentObj.comments.length; k++)
				{
					postObj.commentObj.comments[k].incomingNewComment = oldPostObj.commentObj.comments[k].incomingNewComment;
				}
				// Update the new comment in the post with a different skin
				for (var j:Number=0; j<postObj.commentObj.comments.length; j++)
				{
					if (postObj.commentObj.comments[j].id == commentId)
					{
						postObj.commentObj.comments[j].incomingNewComment = true;
						break;
					}
				}
				// If post exist (normal case)
				if (oldPostObjIndex >= 0)
				{
					postObj.newCommentText = oldPostObj.newCommentText;
					postObj.atRef = oldPostObj.atRef;
					postObj.showAllComments = oldPostObj.showAllComments;
					postObj.incomingNewPost = oldPostObj.incomingNewPost;
					if (incoming && postObj.newCommentText == "") // Try to move the poast to the top for incoming updates, 
						// only if the user is not trying to add a comment in between
					{
						globalpostList.removeItemAt(oldPostObjIndex);
						globalpostList.addItemAt(postObj, 0);
					}
					else
					{
						//globalpostList[oldPostObjIndex].commentObj.comments = postObj.commentObj.comments;
						//globalpostList.refresh();
						//oldPostObj.commentObj.comments = postObj.commentObj.comments;
						globalpostList[oldPostObjIndex] = postObj;
					}
				}
			}
			else // If post does not exist add the new post
			{
				postObj.incomingNewPost = true;
				globalpostList.addItemAt(postObj, 0);
			}
		}
		
		public function handleIncomingDelete(postObj:Object, postId:String):void
		{
			if (postObj == null)
			{
				for (var i:Number = 0; i < globalpostList.length; i++)
				{
					if (globalpostList[i].id == postId){
						globalpostList.removeItemAt(i);
						break;
					}
				}
			}
			else
			{
				for (var j:Number=0; j<globalpostList.length; j++)
				{   
					if (globalpostList[j].id == postId)
					{
						var oldObject:Object = globalpostList[j];
						postObj.showAllComments = oldObject.showAllComments;
						globalpostList[j] = postObj;
						break;
					}
				}
			}
		}
		
		public function updateLikeNumber(postObj:Object, postId:String, liked_by:Array,
										 incoming:Boolean = false):void
		{
			if (!liked_by || !liked_by.length)
				liked_by = null;
			var oldPostObjIndex:Number = -1; 
			

			// Find the existing post
			for (var k:Number=0; k<globalpostList.length; k++)
			{   
				if (globalpostList[k].id == postId)
				{
					oldPostObjIndex = k;
					break;
				}
			}	
			
			if (oldPostObjIndex != -1)
			{
				for (var i:Number=0; i<globalpostList.length; i++)
				{
					if (globalpostList[i].id == postId)
					{
						var oldObject:Object = globalpostList[i];
						oldObject.liked_by = liked_by;
						if (incoming)
							oldObject.incomingLikePost = true;
						if (incoming && oldObject.newCommentText == "") // Try to move the past to the top for incoming updates, 
							// only if the user is not trying to add a comment in between
						{
							globalpostList.removeItemAt(i);
							globalpostList.addItemAt(oldObject, 0);
						}
						else
							globalpostList[i] = oldObject;
						break;
					}
				}
			}	
			else // If post does not exist add the new post
			{
				globalpostList.addItemAt(postObj, 0);
			}
		}*/
	}
}

