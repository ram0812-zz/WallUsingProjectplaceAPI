package com.objects{
	import com.view.renderers.PostRenderer;
	
	import mx.collections.ArrayCollection;
	import mx.controls.Alert;
	
	public class CommentObject extends Object{
		
		/*private var _posts:ArrayCollection = new ArrayCollection();
		private var _last_post:Object;
		private var _height:Number = 0;
		public var showCommentSelected:Boolean = false;
		private var _showAllCommentsView:Boolean = false;
		private var _main_post_id:Number = 0;
		private var _newComment:Boolean = false;
		[Bindable] public var id:String;
		[Bindable] public var author_id:String;
		
		[Bindable] public var created_time:String;
		[Bindable] public var attachment:String;
		
		public function CommentObject():void{
			_posts = new ArrayCollection([]);
		}
		
		public function get comments():ArrayCollection{
			var newArray:Array = _posts.toArray();
			return new ArrayCollection(newArray);
		}
		
		public function set comments(value:ArrayCollection):void{
			_posts = value;
			if (value.length >=1)
				last_post = _posts[_posts.length - 1]
		}
		
		public function get newComment():Boolean
		{
			return _newComment;
		}
		
		public function set newComment(value:Boolean):void
		{
			_newComment = value;
		}
		
		public function get main_post_id():Number
		{
			return _main_post_id;
		}
		public function set main_post_id(value:Number):void
		{
			_main_post_id = value;
		}
		
		public function addComment(value:Object):void{
			_posts.addItem(value);
			last_post = value; 
		}
		
		public function set last_post(value:Object):void{
			_last_post = value;
		}
		
		public function get last_post():Object{
			return _last_post;
		}
			
		public function get showAllCommentsView():Boolean{
			return _showAllCommentsView;
		}
		
		public function set showAllCommentsView(value:Boolean):void{
			_showAllCommentsView = value;
		}
		*/
		
		private var _id:Number;
		private var _post_id:Number;
		private var _message:String;
		private var _created_by:Object;
		private var _created_time:String = "";
		private var _attachment:Object;
		private var _references:Array;
		private var _tags:Array;
		private var _incoming_new_comment:Boolean = false;

		
		private var _showAllCommentsView:Boolean = false;
		
		public function CommentObject(id:Number):void{
			//this._commentObj = new CommentObject();
			this._id = id;
		}
		
		public function get id():Number{
			return _id;
		}
		public function set id(value:Number):void{
			_id = value;
		}
		
		public function get post_id():Number{
			return _post_id;
		}
		public function set post_id(value:Number):void{
			_post_id = value;
		}
		
		public function get main_post_id():Number{
			return _post_id;
		}
		public function set main_post_id(value:Number):void{
			_post_id = value;
		}
		
		public function get message():String{
			return _message;
		}
		public function set message(value:String):void{
			_message = value;
		}
		
		public function get createdByObj():Object{
			return _created_by;
		}
		public function set createdByObj(value:Object):void{
			_created_by = value;
		}
		
		public function get createdTime():String{
			return _created_time;
		}
		public function set createdTime(value:String):void{
			_created_time = value;
		}
		
		public function get attachmentObj():Object{
			return _attachment;
		}
		public function set attachmentObj(value:Object):void{
			_attachment = value;
		}
		
		public function get references():Array{
			return _references;
		}
		public function set references(value:Array):void{
			_references = value;
		}
		
		public function get tags():Array{
			return _tags;
		}
		public function set tags(value:Array):void{
			_tags = value;
		}
		
		public function get showAllCommentsView():Boolean{
			return _showAllCommentsView;
		}		
		public function set showAllCommentsView(value:Boolean):void{
			_showAllCommentsView = value;
		}

		public function get incomingNewComment():Boolean{
			return _incoming_new_comment;
		}		
		public function set incomingNewComment(value:Boolean):void{
			_incoming_new_comment = value;
		}

	}
}