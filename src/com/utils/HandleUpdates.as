package com.utils{
	import com.adobe.serialization.json.JSON;
	import com.hurlant.crypto.symmetric.NullPad;
	import com.objects.CommentObject;
	import com.objects.PostObject;
	import com.pages.MainPage;
	import com.utils.Utils;
	
	import flash.events.Event;
	import flash.utils.clearInterval;
	import flash.utils.setInterval;
	
	import mx.collections.ArrayCollection;
	import mx.collections.ArrayList;
	import mx.controls.Alert;
	import mx.core.INavigatorContent;
	import mx.events.CollectionEvent;
	
	public class HandleUpdates{
		
		private var container:MainPage = null;
		private var lst:ArrayCollection;
		private var lastLoadedTime:Number = 0;
		private var now:Date;
		private static var interval:Number = 0;
		private static var appActive:Boolean = true;	
		public function HandleUpdates(app:MainPage):void
		{
			now = new Date();
			lastLoadedTime = Math.round(now.getTime()/1000);
			container = app;
		}
	
		public function setTimer():void
		{
			if (interval)
				clearInterval(interval);
			interval = setInterval(getUpdates, 10000);
		}
		
		public function resetTimer(isActive:Boolean, forceClear:Boolean=false):void
		{
			if (forceClear)
				clearInterval(interval);
			else
				if (interval)
					clearInterval(interval);
				if (isActive)
				{
					getUpdates();
					interval = setInterval(getUpdates, 10000);
				}
				//else //passive polling
				//	interval = setInterval(getUpdates, 60000);
		}
		
		public static function setPolling(isActive:Boolean):void
		{
			appActive = isActive;
		}
	
		
		public function getUpdates():void
		{
			//lastLoadedTime = now.getTime();
			ProjectPlaceWall.apirequest.getUpdates( 
				function(e:Event):void{
					getUpdatesSuccess(e)
				}
				, 
				function(e:Event):void{
					getUpdatesFail(e)
				}, lastLoadedTime);
		}
		
		private function getUpdatesSuccess(e:Event):void
		{
			var updates:Object = JSON.decode(e.target.data);
			//Alert.show("updates = " + JSON.decode(e.target.data));
			var isUpdate:Boolean = false;
			if (updates.posts)
			{
				if (updates.posts.added)
					isUpdate = true;
				handleAddPosts(updates.posts.added)
			}
			if (updates.comments)
			{
				if (updates.comments.added)
				isUpdate = true;
				handleAddComments(updates.comments.added)
			}
			if (isUpdate)
				container.showUpdateBox();
			now = new Date();
			lastLoadedTime = Math.round(now.getTime()/1000);
			updates = null;
		}
		
		private function handleAddPosts(newPosts:Array):void
		{
			var tempPosts:ArrayList = new ArrayList(newPosts);
			var addedPosts:ArrayList = new ArrayList();
			
			for (var newIndex:Number = 0; newIndex < tempPosts.length; newIndex++)
			{
				var exists:Boolean = false;
				for (var oldIndex:Number = 0; oldIndex < container.postList.dataProvider.length; oldIndex++)
				{				
					if (container.postList.dataProvider.getItemAt(oldIndex).id == tempPosts.getItemAt(newIndex).id)
					{
						exists = true;
						break;
					}	
				}
				if (!exists)
				{
					var newPost:PostObject = Utils.createPostObj(tempPosts.getItemAt(newIndex));
					newPost.incomingNewPost = true;
					addedPosts.addItem(newPost);	
				}
			}
	
			for (var index:int = 0; index < addedPosts.length; index++)
			{
				container.postList.dataProvider.addItemAt(addedPosts.getItemAt(index), 0);
				//MainPage.postList.dataProvider.dispatchEvent(new CollectionEvent(CollectionEvent.COLLECTION_CHANGE));
			}
		}
		private function getUpdatesFail(e:Event):void
		{
			Alert.show("fail");
		}
	
		private function handleAddComments(newComments:Array):void
		{
			var tempComments:ArrayCollection = new ArrayCollection(newComments);
			var addedComments:ArrayCollection = new ArrayCollection();
			
			for (var newIndex:Number = 0; newIndex < tempComments.length; newIndex++)
			{
				var newCommentObj:Object = tempComments.getItemAt(newIndex);
				for (var oldIndex:Number = 0; oldIndex < container.postList.dataProvider.length; oldIndex++)
				{		
					var postObj:Object = container.postList.dataProvider.getItemAt(oldIndex);
					if (postObj.id == newCommentObj.post_id)
					{
						var exists:Boolean = false;
						for (var oldCommentIndex:Number = 0; oldCommentIndex < postObj.comments.length; oldCommentIndex++)
						{
							var oldCommentObj:Object = postObj.comments.getItemAt(oldCommentIndex);
							if (oldCommentObj.id == newCommentObj.id)
							{
								exists = true;
								break;
							}
						}
						if (!exists)
						{
							var newComment:CommentObject = Utils.createCommentObj(newCommentObj);
							newComment.incomingNewComment = true;
							postObj.comments.addItem(newComment);
							postObj.numberOfComments += 1;
							//MainPage.postList.dataProvider.removeItemAt(index);
							//MainPage.postList.dataProvider.addItemAt(postObj, 0);
							container.postList.dataProvider.setItemAt(postObj, postObj.comments.length-1);// = postObj;
						}
					}
				}
			}
		}
		
	}
}