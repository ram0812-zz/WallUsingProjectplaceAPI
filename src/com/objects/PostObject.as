package com.objects{
	import com.api.UserProjects;
	import com.utils.Utils;
	
	import mx.collections.ArrayCollection;
	import mx.collections.ArrayList;
	import mx.controls.Alert;
	
	public class PostObject extends Object{

		/*
		private var _posts:Array;
		private var _comments:ArrayCollection;
		private var _project_id:String;
		private var _main_post:Object;
		public var _commentObj:CommentObject;
		private var _post_count:Number = 0;
		private var _last_post_time:Number;
		private var _id:Number;
		private var _show_all_comments:Boolean;
		private var _isPostTextTruncated:Boolean = false;
		private var _incomingNewPost:Boolean = false;
		private var _incoming_like_post:Boolean = false;
		private var _new_comment_text:String = "";
		private var _atRef:ArrayCollection = new ArrayCollection();
		private var _comment_box_height:Number = 30;
		
		private var _attachment:Object = {name: ""};
		private var _message:String = "";
		private var _created_time:String = "";
		private var _liked_by:Array = [];
		private var _author_id:Number = 0;
		*/
		
		private var _id:Number;
		private var _message:String;
		private var _created_by:Object;
		private var _project:Object = new ArrayCollection();;
		private var _created_time:String;
		private var _number_of_comments:Number = 0;
		private var _comments:ArrayList = new ArrayList();
		private var _attachment:Object;
		private var _references:Array;
		private var _number_of_likes:Number;
		private var _tags:Array;
		private var _liked_by:Array = new Array();
		private var _new_comment_text:String = "";
		private var _atRef:ArrayCollection = new ArrayCollection();
		private var _comment_box_height:Number = 30;
		private var _likes:Object;
		private var _show_all_comments:Boolean = false;
		private var _incoming_like_post:Boolean = false;		
		private var _incoming_new_post:Boolean = false;		
		
		
		public function PostObject(id:Number):void{
			this._id = id;
		}
		
		
		public function set id(value:Number):void{
			_id = value;
		}
		public function get id():Number{
			return _id;
		}
		
		public function set message(value:String):void{
			_message = value;
		}
		public function get message():String{
			return _message;
		}
		
		public function set createdByObj(value:Object):void{
			_created_by = value;
		}
		public function get createdByObj():Object{
			return _created_by;
		}
		
		public function set projectObj(value:Object):void{
			_project = value;
		}
		public function get projectObj():Object{
			return _project;
		}
		
		public function set createdTime(value:String):void{
			_created_time = value;
		}
		public function get createdTime():String{
			return _created_time;
		}
		
		public function set numberOfComments(value:Number):void{
			_number_of_comments = value;
		}
		public function get numberOfComments():Number{
			return _number_of_comments;
		}
		
		public function setCommentsObj(cmts:Object):void{
			var commentsList:ArrayList = new ArrayList();
			for each(var obj:Object in cmts)
			{				
				var c:CommentObject = Utils.createCommentObj(obj);
				commentsList.addItem(c);				
			}
			comments = commentsList;
		}
		
		public function get comments():ArrayList
		{
			return _comments
		}
		
		public function set comments(cmts:ArrayList):void
		{
			_comments = cmts;
		}
		
		
		
		public function set attachmentObj(value:Object):void
		{
			_attachment = value;
		}
		public function get attachmentObj():Object{
			return _attachment;
		}
		
		public function set references(value:Array):void{
			_references = value;
		}
		public function get references():Array{
			return _references;
		}
		
		public function set numberOfLikes(value:Number):void{
			_number_of_likes = value;
		}
		public function get numberOfLikes():Number{
			return _number_of_likes;
		}
		
		public function get tags():Array{
			return _tags;
		}
		public function set tags(value:Array):void{
			_tags = value;
		}
		
		public function get likedByObj():Array{
			return _liked_by;
		}
		public function set likedByObj(value:Array):void{
			_liked_by = value;
		}
		
		public function addComment(value:Object):void{
			this.comments.addItem(value);
		}
		
		public function get newCommentText():String
		{
			return _new_comment_text;
		}
		public function set newCommentText(value:String):void
		{
			_new_comment_text = value;
		}
		
		
		
		public function set commentBoxHeight(value:Number):void
		{
			_comment_box_height = value;
		}
		public function get commentBoxHeight():Number
		{
			return _comment_box_height;
		}
		
		public function set showAllComments(value:Boolean):void{
			_show_all_comments = value;
		}
		public function get showAllComments():Boolean{
			return _show_all_comments;
		}
		
		public function set incomingLikePost(liked:Boolean):void
		{
			_incoming_like_post = liked;
		}
		public function get incomingLikePost():Boolean
		{
			return _incoming_like_post;
		}
		
		public function set incomingNewPost(liked:Boolean):void
		{
			_incoming_new_post = liked;
		}
		public function get incomingNewPost():Boolean
		{
			return _incoming_new_post;
		}
		/*
		
		
		
		public function set attachment(value:Object):void{
			_attachment = value;
		}

		
		public function get attachment():Object{
			return _attachment;
		}
		
		public function set message(value:String):void{
			_message = value;
		}
		
		public function get message():String{
			return _message;
		}
		
		public function set created_time(value:String):void{
			_created_time = value;
		}
		
		public function get created_time():String{
			return _created_time;
		}
		
		public function get liked_by():Array{
			return _liked_by;
		}
		
		public function set liked_by(value:Array):void{
			_liked_by = value;
		}
		
		public function get author_id():Number{
			return _author_id;
		}
		
		public function set author_id(value:Number):void{
			_author_id = value;
		}
			
		
		public function set id(value:Number):void{
			_id = value;
		}
		
		public function get id():Number{
			return _id;
		}
		
		public function get incomingNewPost():Boolean // is this a new post added from another client
		{
			return _incomingNewPost;
		}
		
		public function set incomingNewPost(value:Boolean):void
		{
			_incomingNewPost = value;
		}
		
		public function get incomingLikePost():Boolean // is this a new post added from another client
		{
			return _incoming_like_post;
		}
		
		public function set incomingLikePost(value:Boolean):void
		{
			_incoming_like_post = value;
		}
		
		public function get newCommentText():String
		{
			return _new_comment_text;
		}
		
		public function set newCommentText(value:String):void
		{
			_new_comment_text = value;
		}
		
		public function get atRef():ArrayCollection
		{
			return _atRef;
		}
		
		public function set atRef(value:ArrayCollection):void
		{
			_atRef = value;
		}
		public function get commentBoxHeight():Number
		{
			return _comment_box_height;
		}
		
		public function set commentBoxHeight(value:Number):void
		{
			_comment_box_height = value;
		}
		
		public function get main_post():Object{
			return _main_post;
		}
		
		public function set main_post(value:Object):void{
			_main_post = value;
		}
		
		public function set posts(value:Array):void{
			_posts = value;
			this._main_post = _posts[0];
			_posts.shift();
			this.main_post.commentObj = new CommentObject();
			if (_posts.length)
			{
				this.main_post.comments = new ArrayCollection(_posts);
				for (var i:int = 0; i < _main_post.comments.length; i++)
				{
					main_post.comments[i].main_post_id = this.id;
				}
			}
			else
				this.main_post.comments = new ArrayCollection();
			
			_show_all_comments = false;

		}
		
		public function get posts():Array{
			return _posts;
		}
		
		public function set comments(value:ArrayCollection):void{
		
			if (_posts.length)
			{
				this.main_post._comments = new ArrayCollection(_posts);
			}	
		}
		
		public function get comments():ArrayCollection{
			return _comments;
		}
				
		public function set project_id(value:String):void{
			_project_id = value;
		}
		
		public function get project_id():String{
			return _project_id;
		}
		
		public function set post_count(value:Number):void{
			_post_count = value;
		}
		
		public function get post_count():Number{
			return _post_count;
		}
		
		public function get last_post_time():Number{
			return _last_post_time;
		}
		
		public function set last_post_time(value:Number):void{
			_last_post_time = value;
		}
		
		public function set showAllComments(value:Boolean):void{
			_show_all_comments = value;
		}
		
		public function get showAllComments():Boolean{
			return _show_all_comments;
		}
		
		public function set isPostTextTruncated(value:Boolean):void{
			_isPostTextTruncated = value;
		}
		
		public function get isPostTextTruncated():Boolean{
			return _isPostTextTruncated;
		}
		
		
		
		public function project_name():String{
			return UserProjects.getProjectName(project_id);
		}
		
		public function addComment(value:Object):void{
			this.main_post.comments.addItem(value);
		}
		
//		private function get commentObj():CommentObject{
//			return _commentObj
//		}
//		
//		private function set commentObj(value:Array):void{
//			_commentObj.posts = value
//		}
	*/	
	}
}