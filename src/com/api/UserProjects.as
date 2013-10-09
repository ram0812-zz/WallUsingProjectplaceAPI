package com.api{
	import com.adobe.serialization.json.JSON;
	
	import flash.events.Event;
	
	import mx.collections.ArrayCollection;
	import mx.controls.Alert;
	
	public class UserProjects{
		
		private static var projectsArray:Array;
			
		public function getUserProjects(callbackFun:Function):void {
			ProjectPlaceWall.apirequest.getUserProjectInfo(
				function(e:Event):void{ 
					userProjectsSuccess(e, callbackFun)
				}, 
				function(e:Event):void{
					userProjectsFail(e, callbackFun)
				}
			);
		}
		
		private function userProjectsSuccess(e:Event, callbackFun:Function):void {
			projectsArray = (JSON.decode(e.target.data) as Array);
			callbackFun(JSON.decode(e.target.data) as Array)
		}	
		
		private function userProjectsFail(e:Event, callbackFun:Function):void {
			callbackFun(new Array())
		}
		
		public static function getProjects():ArrayCollection{
			return new ArrayCollection(projectsArray)
		}
		
		public static function getProjectName(projectId:String):String{
			var projectName:String = ''
			for each( var projectObj:Object in projectsArray){
				if (projectObj.id == projectId)
					projectName = projectObj.name
			}
			return projectName
		}
		
	}
}