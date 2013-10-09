package com.components
{
	
	import com.api.UserProjects;
	import com.view.renderers.SelectProjectsRenderer;
	
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

	
	public class SelectProjectsPopUp
	{
		
		private var textBuffer:String = "";
		private var popUp:TitleWindow;
		private  var popUpList:List;
		private var popUpTextInput:TextInput;
		public var projects:ArrayCollection;
		public var callBackFunc:Function
		
				
		public function SelectProjectsPopUp(parentObject:DisplayObject, callBack:Function)
		{
			callBackFunc = callBack;
			
			popUp = new TitleWindow();
			popUp.title = "Select a project";
			popUp.autoLayout = true;
			popUp.minWidth= 300;
			popUp.showCloseButton = true;
			
			populateWindow();
			PopUpManager.addPopUp(popUp, parentObject, true);
			popUp.mx_internal::closeButton.addEventListener(MouseEvent.CLICK, removePopUp);
			popUp.addEventListener(FlexMouseEvent.MOUSE_DOWN_OUTSIDE, removePopUp);
			PopUpManager.centerPopUp(popUp);
			popUpTextInput.setFocus();		
		}

		private function populateWindow():void
		{
			popUpTextInput = new TextInput();
			popUpTextInput.percentWidth = 100;
			popUpTextInput.addEventListener(KeyboardEvent.KEY_UP, handleKeyUp);
			popUpTextInput.text = textBuffer;
			popUp.addChild(popUpTextInput);
			
			popUpList = new List();
			popUpList.minWidth = 300;
			popUpList.minHeight = 0;
			popUpList.addEventListener(ItemClickEvent.ITEM_CLICK, submitData); 
			popUpList.itemRenderer = new ClassFactory(com.view.renderers.NotifyUsersRenderer);
			popUp.addChild(popUpList);
		
			
			
			projects = UserProjects.getProjects();
			projects.filterFunction = filterArrayCollection;
			setDataProvider();
		}
		
		private function setDataProvider():void
		{
			textBuffer = popUpTextInput.text;
			projects.refresh();
			popUpList.dataProvider = new ArrayCollection(projects.toArray().slice(0, 5));
			popUpList.callLater(function():void{popUpList.selectedIndex = 0});
		}
		
		private function filterArrayCollection(item:Object):Boolean {
			var itemName:String = (item.name as String).toLowerCase();
			return itemName.indexOf(textBuffer.toLowerCase()) > -1;
		}

		private function handleKeyUp(pEvent : KeyboardEvent) : void
		{
			if(pEvent.keyCode == Keyboard.DOWN)
			{
				if (popUpList.selectedIndex < popUpList.dataProvider.length)
					popUpList.selectedIndex = popUpList.selectedIndex + 1;
				popUpTextInput.selectRange(popUpTextInput.text.length, popUpTextInput.text.length);
				return;
			}
			else if(pEvent.keyCode == Keyboard.UP)
			{
				if (popUpList.selectedIndex > 0)
					popUpList.selectedIndex = popUpList.selectedIndex - 1;
				popUpTextInput.selectRange(popUpTextInput.text.length, popUpTextInput.text.length);
				return;	
			}
			
			if (pEvent.charCode == Keyboard.ENTER) 
				submitData(pEvent);
			else if (pEvent.charCode == 27) //escape 
				removePopUp(pEvent);
			else
				setDataProvider();
		}

		private function submitData(event:Event):void {
			callBackFunc(popUpList.selectedItem);
			removePopUp(event);
		}
		
		/* Cancel button click event listener. */
		private function removePopUp(event:Event):void {
			PopUpManager.removePopUp(popUp);
		}

	}
}