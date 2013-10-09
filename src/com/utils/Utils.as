// ActionScript file
package com.utils{
	import com.api.UserInfo;
	import com.objects.CommentObject;
	import com.objects.PostObject;
	import com.ppstatic.Config;
	import com.utils.ISO8601Util;
	
	import flash.display.Bitmap;
	import flash.events.Event;
	import flash.events.MouseEvent;
	import flash.filesystem.File;
	import flash.filesystem.FileMode;
	import flash.filesystem.FileStream;
	import flash.utils.ByteArray;
	
	import mx.controls.Alert;
	import mx.core.IVisualElement;
	
	import spark.components.Image;
	import spark.components.SkinnableContainer;
	
	
	public class Utils{
		
		public static function setAvatar(i:Image, userId:String, size:Number=70):void {
			ImageCacheManager.getInstance().getImage(i, userId, size);
			//return i;
		}
		
		
		public static function createPostObj(obj:Object):PostObject{
			var postObject:PostObject = new PostObject(obj.id);
			for(var key:String in obj)
			{
				switch (key)
				{
					case "created_by": postObject["createdByObj"] = obj[key];break;
					case "project": postObject["projectObj"] = obj[key];break;
					case "comments": postObject.setCommentsObj(obj[key]);break;
					case "attachment": postObject["attachmentObj"] = obj[key];break;
					case "created_on": postObject["createdTime"] = obj[key];break;
					case "number_of_comments": postObject["numberOfComments"] = obj[key];break;
					case "number_of_likes": postObject["numberOfLikes"] = obj[key];break;
					case "likes": postObject["likedByObj"] = obj[key];break;
					default: postObject[key] = obj[key];
				}
			}
			return postObject;
		}
		
		
		public static function createCommentObj(obj:Object):CommentObject{
			var commentObj:CommentObject = new CommentObject(obj.id);
			for(var key:String in obj)
			{
				switch (key)
				{
					case "created_by": commentObj["createdByObj"] = obj[key];break;
					case "attachment": commentObj["attachmentObj"] = obj[key];break;
					case "created_on": commentObj["createdTime"] = obj[key];break;
					default: commentObj[key] = obj[key];
				}
			}
			return commentObj;
		}
		
		public static function convertTime(time:String):String {
			
			
			//time = time.replace(/\//g, "-")
			//time= time.replace(/ /g, "T")
			//time = time + "Z"
			var newDate:Date;
			var now:Date = new Date();
			
			var util:ISO8601Util = new ISO8601Util();
			// parse a date + time string into an AS3 Date  - takes either a basic or 
			// extended representation         
			if (time)
				newDate = util.parseDateTimeString( time );
			else
				newDate = new Date();
			var newTime:Number = newDate.time;
			//var newDate:Date = new Date(time*1000);
			
			var diff:Number = (now.time - newDate.time)/1000;
			
			if (diff <= 3600) {
				var mins:Number = Math.round(diff / 60);
				if (mins <= 1) {
					return "now";
				}
				return mins +" mins";
			} else if ((diff <= 86400) && (diff > 3600)) {
				var hours:Number = Math.round(diff / 3600);
				if (hours <= 1) {
					return "1 hour";
				}
				return hours+" hours";
			} else if (diff >= 86400) {
				var days:Number = Math.round(diff / 86400);
				if (days <= 1) {
					return "1 day";
				}
				else if(days >1 && days <=3){
					return days + " days";
				}
				else{
					var dateArray:Array = newDate.toLocaleDateString().split(' ')
					return dateArray[1] + ' ' + dateArray[2]
				}
			}
			return "unknown";
		}
		
		public static function getLikeText(likedBy:Array):String{
			var text:String = ''
			if (likedBy){
				for each(var id:String in likedBy){
					if (id == UserInfo.getUserObj().id){
						text += 'You'
					}
				}
				if (text && likedBy.length == 1)
					text += ' like this'
				else if(text)
					text += ' and ' + String(likedBy.length - 1) + ' like this'
				else
					text += likedBy.length + ' like this'
			}
			return text
		}
		
		public static function getLikeSource(liked_by:Array):String{
			var likeSource:String = 'assets/images/like.png'
			if (liked_by){
				for each(var id:String in liked_by){
					if (id == UserInfo.getUserObj().id){
						likeSource = 'assets/images/unlike.png'
					}
				}
			}
			return likeSource
		}
		
		public static function writeToFile(fileObj:File, data:ByteArray):void{
			var fileStream:FileStream = new FileStream();
			fileStream.open(fileObj, FileMode.WRITE);
			fileStream.writeBytes(data, 0, data.length);
			fileStream.close();			
		}
		
		public static function makeLinksOfUrls(message:String):String {
			var text:String = message.replace(/&/g, "&amp;")
				.replace(/</g, "&lt;")
				.replace(/>/g, "&gt;")
				.replace(/(\w+:\/\/\S+)/g, "<font color='#0198eb'><u><a href='$1'>$1</a></u></font>");
			return text;
		}
		
		public static function makeLinksOfUrls2(message:String):String {
			
			var protocol:String = "(((?:http|https|ftp)://)+(?:[\w-]+\.)+[\w-]+(?:/[\w-./?%&=]*)?)"; 
			var urlPart:String = "(?:[\w-]+\.)+[\w-]"; 
			var optionalUrlPart:String = "((?:/[\w-./?%&=]*)?"; 
			//var urlPattern:RegExp = new RegExp(protocol, "ig"); 
			var urlPattern:RegExp = new RegExp("/(?<!\S)(((f|ht){1}tp[s]?:\/\/|(?<!\S)www\.)[-a-zA-Z0-9@:%_\+.~#?&\/\/=]+)/", "ig");

			/*var text:String = message.replace(new RegExp("[<]", "g"), "&lt;");
			text = text.replace(new RegExp("[>]", "g"), "&gt;");	
			text = addAnchor(text);
			*/
			var text:String = message.replace(/&/g, "&amp;")
				.replace(/</g, "&lt;")
				.replace(/>/g, "&gt;")
				.replace(/(\w+:\/\/\S+)/g, "<font color=\"#0198eb\"><a href=\"$1\" target=\"_blank\"><u>$1</u></a></font>");
			text = text.replace(new RegExp("[\n\r]","g"),"<br/>");
			
			return text;
		}	
		
		public static function addAnchor(text:String):String{
			var result:String = '';
		    var pattern:RegExp = /(?<!\S)(((f|ht){1}tp[s]?:\/\/|(?<!\S)www\.)[-a-zA-Z0-9@:%_\+.~#?&\/\/=]+)/g;
		    while(pattern.test(text)) result = text.replace(pattern, "<font color=\"#0198eb\"><a href=\"$&\"><u>$&</u></a></font>");
		    if(result == '')//if there was nothing to replace 
				result = text;
			result = result.replace(new RegExp("[&]","g"),"&amp;");
			return result;
		}
		
		
		//format a number into specified number of decimal places
		public static function formatDecimals(num:Number, digits:Number):String {
			//round the number to specified decimal places
	        //e.g. 12.3456 to 3 digits (12.346) -> mult. by 1000, round, div. by 1000
	        var tenToPower:Number = Math.pow(10, digits);
	        var cropped:String = String(Math.round(num * tenToPower) / tenToPower);		
			
			//add decimal point if missing
	        if (cropped.indexOf(".") == -1) {
                cropped += ".0";  //e.g. 5 -> 5.0 (at least one zero is needed)
	        }
			
	        //finally, force correct number of zeroes; add some if necessary
	        var halves:Array = cropped.split("."); //grab numbers to the right of the decimal
	        //compare digits in right half of string to digits wanted
	        var zerosNeeded:Number = digits - halves[1].length; //number of zeros to add
	        for (var i:Number=1; i <= zerosNeeded; i++) {
	                cropped += "0";
	        }
	        return(cropped);
		}
		
		
		public static function deletePost(conversationId:String, callbackFunction:Function):void{	
		}
		
		public static function deleteComment(conversationId:String, commentId:String, callbackFunction:Function):void{
		}
		
		public static function toggleLikePost(conversationId:String, userId:String, isLike:Boolean, callback:Function):void{
			//var likeByArr:Array = new Array();
			var apicallback:ApiCallBacks = new ApiCallBacks()
			
		}
	}
}