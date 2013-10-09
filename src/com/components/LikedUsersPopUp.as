package com.components
{
	import com.api.CoWorkers;
	import com.api.UserInfo;
	import com.view.renderers.NotifyUsersRenderer;
	
	import flash.display.DisplayObject;
	import flash.events.Event;
	import flash.events.KeyboardEvent;
	import flash.events.MouseEvent;
	import flash.ui.Keyboard;
	
	import mx.collections.ArrayCollection;
	import mx.containers.TitleWindow;
	import mx.controls.Alert;
	import mx.core.ClassFactory;
	import mx.core.mx_internal;
	import mx.events.FlexMouseEvent;
	import mx.events.ItemClickEvent;
	import mx.managers.PopUpManager;
	
	import spark.components.List;
	import spark.components.TextInput;
	import spark.layouts.VerticalLayout;
	
	
	
	public class LikedUsersPopUp
	{	
		private static var inputTextArea:DynamicTextArea;
		private static var coWorkers:ArrayCollection = new ArrayCollection();	
		private  var popUpList:List;
		private var popUp:TitleWindow;
		private var likedBy:Object;
		
		public function LikedUsersPopUp(parentObject:DisplayObject, liked:Object)
		{
			likedBy = liked;
			
			popUp = new TitleWindow();
			popUp.title = "Likes";
			popUp.autoLayout = true;
			popUp.minWidth= 300;
			popUp.showCloseButton = true;
			
			populateWindow();
			
			//PopUpManager.createPopUp(parentObject, popUp, true, null);
			PopUpManager.addPopUp(popUp, parentObject, true);
			popUp.mx_internal::closeButton.addEventListener(MouseEvent.CLICK, removePopUp);
			popUp.addEventListener(FlexMouseEvent.MOUSE_DOWN_OUTSIDE, removePopUp);
			PopUpManager.centerPopUp(popUp);
			popUpList.setFocus();
		
			popUp.addEventListener(KeyboardEvent.KEY_UP, handleKeyUp);
		}
		
		
		
		private function populateWindow():void
		{
			popUpList = new List();
			popUpList.minWidth = 300;
			popUpList.height = 200;
			popUpList.itemRenderer = new ClassFactory(com.view.renderers.NotifyUsersRenderer);
			popUp.addChild(popUpList);
			setDataProvider();
		}
		
		private function setDataProvider():void
		{
			coWorkers = UserInfo.getUserObj().coWorkers;
			coWorkers.refresh();
			var showLikedUsers:ArrayCollection = new ArrayCollection([]);
			for each(var liked:Object in likedBy)
			{
				for (var index:Number = 0; index < coWorkers.length; index++)
				{
					if (coWorkers[index].id == liked.user_id)
					{
						showLikedUsers.addItem({"sort_name": coWorkers[index].sort_name, "id": coWorkers[index].id });
					}
				}
				if (liked.user_id == UserInfo.getUserObj().id)
				{
					showLikedUsers.addItem({"sort_name": "You", "id": UserInfo.getUserObj().id });
				}
			}
			
			popUpList.dataProvider = showLikedUsers;
			popUpList.callLater(function():void{popUpList.selectedIndex = 0});
		}
		
		private function handleKeyUp(pEvent : KeyboardEvent) : void
		{
			if (pEvent.charCode == 27) //escape 
				removePopUp(pEvent);
		}
		
		/* Cancel button click event listener. */
		private function removePopUp(event:Event):void {
			PopUpManager.removePopUp(popUp);
		}
		
	}
}