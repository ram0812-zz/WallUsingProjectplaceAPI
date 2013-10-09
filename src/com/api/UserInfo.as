package com.api{
	import com.adobe.serialization.json.JSON;
	
	import flash.events.Event;
	
	import mx.collections.ArrayCollection;
	import mx.controls.Alert;
	
	public class UserInfo{
		
		private static var userObj:Object = new Object();
		private static var _coWorkers:ArrayCollection = new ArrayCollection([]);
		private static var _projects:ArrayCollection = new ArrayCollection([]);

		public function getUserInfo(callbackFun:Function):void {
			ProjectPlaceWall.apirequest.getUserInfo(
				function(e:Event):void{
					userReadSuccess(e, callbackFun)
				}, 
				function(e:Event):void{
					userReadFailed(e, callbackFun)
				}
			)
		}
		
		public function userReadSuccess(event:Event, callbackFun:Function):void {
			userObj = (JSON.decode(event.target.data) as Object);
			callbackFun(userObj)
		}
		
		public function userReadFailed(e:Event, callbackFun:Function):void {
			ProjectPlaceWall.oAuthLogin.logout();
			callbackFun(userObj, true);
		}
		
		public static function getUserObj():Object{
			return userObj
		}
		
		public function set coWorkers(value:ArrayCollection):void{
		
			_coWorkers = value;
		}
		
		public function get coWorkers():ArrayCollection{
			return _coWorkers;
		}
		
		public function set projects(value:ArrayCollection):void{
			
			_projects = value;
		}
		
		public function get projects():ArrayCollection{
			return _projects;
		}
	}
}