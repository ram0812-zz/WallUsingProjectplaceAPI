package com.utils
{
		import spark.components.Image;
		
		public class PPAvatarImage extends Image
		{
			private var _imageUrl:String = "";
			private var _imageUniqueId:String = "";
			
			
			public function PPAvatarImage()
			{
				super();
			}
			
			public function get imageUrl():String {
				return _imageUrl;
			}
			
			public function set imageUrl(v:String):void {
				_imageUrl = v;
			}
			
			public function get imageUniqueId():String {
				return _imageUniqueId;
			}
			
			public function set imageUniqueId(value:String):void {
				_imageUniqueId = value;
			}
		}
	
}