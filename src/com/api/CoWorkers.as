package com.api{
	import com.adobe.serialization.json.JSON;
	import com.adobe.utils.ArrayUtil;
	
	import flash.events.Event;
	
	import mx.collections.ArrayCollection;
	import mx.controls.Alert;

	
	public class CoWorkers{
		
		private var coWorkersObj:Array = new Array();
			
		public function getCoWorkers(callBackFunc:Function):void {
			ProjectPlaceWall.apirequest.getCoWorkers(
				function(e:Event):void{
					coWorkersReadSuccess(e, callBackFunc)
				}, 
				function(e:Event):void{
					coWorkersReadFailed(e, callBackFunc)
				}
			)
		}
		
		private function coWorkersReadSuccess(event:Event, callBackFunc:Function):void {
			coWorkersObj = (JSON.decode(event.target.data) as Array);
			UserInfo.getUserObj().coWorkers = new ArrayCollection(coWorkersObj);
			ProjectPlaceWall.apirequest.getProjectGroups(
				function(e:Event):void{
					projectGroupsReadSuccess(e, callBackFunc)
				}, 
				function(e:Event):void{
					coWorkersReadFailed(e, callBackFunc)
				}
			)
			
			//callBackFunc(coWorkersObj);
		}
		
		private function coWorkersReadFailed(e:Event, callBackFunc:Function):void {
			callBackFunc(null, true);
		}
		
		private function projectGroupsReadSuccess(event:Event, callBackFunc:Function):void {
			var projectGroups:Array = (JSON.decode(event.target.data) as Array);	
			var allObjects:Array = ArrayUtil.createUniqueCopy(coWorkersObj.concat(projectGroups)); // result: ["a", "b", "c", "x", "y"]
			for (var index:int = 0; index < allObjects.length; index++)
			{
				if (allObjects[index]['sort_name'])
					allObjects[index]['input_name'] = "@" + allObjects[index]['sort_name'].replace(/ /g, "_")
				else
					allObjects[index]['input_name'] = "@" + allObjects[index]['name'].replace(/ /g, "_")
						
			}
			UserInfo.getUserObj().coWorkers = new ArrayCollection(allObjects);
			callBackFunc(coWorkersObj);

		}
		
		
	}
}