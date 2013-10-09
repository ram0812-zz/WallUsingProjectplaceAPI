package com.utils
{
	import com.ppstatic.Config;
	
	import flash.display.Bitmap;
	import flash.display.BitmapData;
	import flash.display.DisplayObject;
	import flash.display.Loader;
	import flash.events.Event;
	import flash.geom.Matrix;
	import flash.net.URLRequest;
	import flash.utils.Dictionary;
	
	import mx.controls.Alert;
	
	import spark.components.Image;



	public class ImageCacheManager
	{
		private static var imageCache:Dictionary = new Dictionary();
		private static const DEFAULT_PIC:String = "assets/images/no_pic.png";
		private static var instance:ImageCacheManager;
		        
        public function ImageCacheManager()
        {
	    }

	public static function getInstance():ImageCacheManager
	{
		if (instance == null)
		{
			instance = new ImageCacheManager();
		}
	
		return instance;	
	}

	public function getImage(i:Image, userId:String, size:Number, defaultImageUrl:String = DEFAULT_PIC):void 
	{
		var imageUrl:String  = Config.getUserImageUrl(userId)
		//var i:PPAvatarImage = new PPAvatarImage();
		var b:Bitmap;
		var scaledBitmap:Bitmap;

		if(imageCache.hasOwnProperty(imageUrl) && imageCache[imageUrl]) {
			scaledBitmap = new Bitmap(imageCache[imageUrl]);
			i.source = scaledBitmap;
			//i.source = getNiceBitmap(imageCache[imageUrl], size);
		}
		else
		
		{
			var _loader:Loader = new Loader(); 
			_loader.contentLoaderInfo.addEventListener(Event.COMPLETE,
				function(e:Event):void
				{ 
					/*var dobj:DisplayObject = e.currentTarget.content as DisplayObject; 
					var bitmapData : BitmapData = new BitmapData(dobj.width, dobj.height, true);
					bitmapData.draw (dobj);
					imageCache[imageUrl] = bitmapData;*/
					var bmp:Bitmap = e.target.content as Bitmap;
					var bitmapData:BitmapData = scaleImage(bmp.bitmapData, size, size);
					
					scaledBitmap = new Bitmap(bitmapData);
					i.source = scaledBitmap;
					i.width = bitmapData.width;
					i.height = bitmapData.height;
					imageCache[imageUrl] = bitmapData;
					
				}
				); 
				i.source = defaultImageUrl;
				imageCache[imageUrl] = null;
				try 
				{
					_loader.load(new URLRequest(encodeURI(imageUrl))); 
				}
				catch (err:Error) {}
			}
			
			i.cacheAsBitmap = true;
			i.cachePolicy = "on";
			//i.smoothBitmapContent = true;
			i.width = i.height = size;
			//i.imageUrl = imageUrl;
					
			//return b;
		}
		
		private function getNiceBitmap(bd:BitmapData, size:Number):Bitmap
		{
			var bitMap:Bitmap = new Bitmap(bd)
			bitMap.height = size;
			bitMap.width = size;
			return bitMap
		}
		
		protected function scaleImage(bitmapData:BitmapData, width:Number, height:Number):BitmapData 
		{
			// Calculate the scaled size.
			var scale:Number;
			var scaledWidth:Number;
			var scaledHeight:Number;
			
			scale = Math.min(width/(bitmapData.width as Number), height/(bitmapData.height as Number))
			
			scaledHeight = width;//Math.round(bitmapData.height * scale);
			scaledWidth = Math.round(bitmapData.width * scale);
			
			var scalingMatrix:Matrix = new Matrix();
			scalingMatrix.scale(scale, scale);
			
			// Scale the image.
			var scaledImage:BitmapData = new BitmapData(scaledWidth, scaledHeight, true, 0x00000000);
			scaledImage.draw(bitmapData, scalingMatrix, null, null, null, true);
			
			bitmapData.dispose();
			
			return scaledImage;
		}
	}
}