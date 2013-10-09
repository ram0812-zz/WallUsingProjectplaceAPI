package com.components
{
	import com.api.CoWorkers;
	import com.api.UserInfo;
	import com.view.MainContainer;
	import com.view.renderers.NotifyUsersRenderer;
	
	import flash.events.Event;
	import flash.events.KeyboardEvent;
	import flash.events.MouseEvent;
	import flash.geom.Point;
	import flash.text.TextField;
	import flash.ui.Keyboard;
	import flash.display.NativeWindow;
	import flash.display.NativeWindowInitOptions;
	import flash.display.NativeWindowSystemChrome;
	import flash.display.NativeWindowType;

	
	import mx.collections.ArrayCollection;
	import mx.controls.Alert;
	import mx.controls.textClasses.TextRange;
	import mx.core.ClassFactory;
	import mx.core.UIComponent;
	import mx.core.mx_internal;
	import mx.events.ItemClickEvent;
	
	import spark.components.List;
	import spark.layouts.VerticalLayout;
	
	public class AtRefSelector
	{
		private static var inputTextArea:DynamicTextArea;
		private static var popUpList:List;
		private static var atRefSearchString:String;
		private static var atRefFlag:Boolean;
		private static var atRefStartIndex:int;
		private static var atReferenceObjects:ArrayCollection;
		private static var coWorkers:ArrayCollection;	
		private var popupWindow:ExtendedNativeWindow;

		
		public function AtRefSelector(iText:DynamicTextArea)
		{
			inputTextArea = iText;
			atRefSearchString = "";
			atRefFlag = false;
			atRefStartIndex = 0;
			atReferenceObjects = new ArrayCollection();
			coWorkers = new ArrayCollection();
			var tempCoWorkers:ArrayCollection = UserInfo.getUserObj().coWorkers;
			if (tempCoWorkers)
			{
				coWorkers = new ArrayCollection(tempCoWorkers.toArray().slice(0, tempCoWorkers.length));
				coWorkers.filterFunction = filterArrayCollection;
			}
			if (inputTextArea.parentApplication.parent.getChildByName("atRef") == null)
			{
				popUpList = new List();
				//(popUpList.layout as VerticalLayout).gap = 3;
				popUpList.name = "atRef";
				popUpList.minWidth = 300;
				
				popUpList.itemRenderer = new ClassFactory(com.view.renderers.NotifyUsersRenderer);
				popUpList.includeInLayout = popUpList.visible = false;
				popUpList.addEventListener(ItemClickEvent.ITEM_CLICK, addSelectedItem);
				popUpList.addEventListener(KeyboardEvent.KEY_DOWN, listHandleKeyDown);

				inputTextArea.addEventListener(KeyboardEvent.KEY_UP, checkToPopup);
				inputTextArea.parentApplication.parent.addChild(popUpList);
				inputTextArea.parentApplication.addEventListener(MouseEvent.CLICK, removePopUp);
			}
			else
			{
				inputTextArea.addEventListener(KeyboardEvent.KEY_UP, checkToPopup);	
				popUpList = inputTextArea.parentApplication.parent.getChildByName("atRef");
			
			}	
		}

		private function onWindowDeactivate(event:Event):void {
			popupWindow.close();
		}
		
		private function onWindowActivate(event:Event):void {
			//popupWindow.alwaysInFront=true;
		}

		private function filterArrayCollection(item:Object):Boolean {
			var itemName:String = "";
			if (item.input_name)
			itemName = (item.input_name as String).toLowerCase();
			return itemName.indexOf(atRefSearchString.toLowerCase()) > -1;
		}
		
		private function checkToPopup(pEvent : KeyboardEvent):void
		{
			var cursorIndex:int;
			var tf:TextField;
			var word:String = "";
			var tempIndex:int;
			var filterText:TextRange;
			var inputCharCode:Number = pEvent.charCode;
			
			if(inputCharCode == 50 && atRefFlag == false) 
			{	
				tf = inputTextArea.mx_internal::getTextField();
				cursorIndex = tf.caretIndex;
				atRefStartIndex = cursorIndex - 1;	
				filterText = new TextRange(inputTextArea, false, atRefStartIndex - 1, atRefStartIndex);
				if (filterText.text == " " || filterText.text == "\r" || filterText.text == "")
					atRefFlag = true;
			}
			else if (atRefFlag == true && (inputCharCode == 32 || inputCharCode == 27 || inputCharCode == 13))
			{
				atRefFlag = false;					
				atRefSearchString = "";
				atRefStartIndex = 0;
				popUpList.includeInLayout = popUpList.visible = false;
			}
			if (atRefFlag)
			{
				tf = inputTextArea.mx_internal::getTextField();
				cursorIndex = tf.caretIndex;
				filterText = new TextRange(inputTextArea, false, atRefStartIndex, cursorIndex);
				atRefSearchString =  filterText.text;
				if (atRefSearchString.length > 2)
				{
					coWorkers.refresh();
					var pt:Point = new Point(inputTextArea.x, inputTextArea.y);
					pt = inputTextArea.localToGlobal(pt);
					
					popUpList.dataProvider = coWorkers;
					if (coWorkers.length > 0)
					{
						popUpList.selectedIndex = 0;
						popUpList.x = pt.x;
						popUpList.y = pt.y + inputTextArea.height;
						popUpList.includeInLayout = popUpList.visible = true;	
						popUpList.setFocus();
						
//						popupWindow.x = pt.x + inputTextArea.parentApplication.x;
//						popupWindow.y = pt.y + inputTextArea.height + inputTextArea.parentApplication.y;
			
						/*var options:NativeWindowInitOptions = new NativeWindowInitOptions();
						options.type = NativeWindowType.UTILITY;
						options.systemChrome = NativeWindowSystemChrome.NONE;
						options.transparent = true;
						
						
						popupWindow = new ExtendedNativeWindow(options);
						popupWindow.alwaysInFront = false;
						
						popupWindow.addChildControls(popUpList);
						popupWindow.addEventListener(Event.ACTIVATE, onWindowActivate);
						popupWindow.addEventListener(Event.DEACTIVATE, onWindowDeactivate);
						
						popupWindow.activate();
						
						popUpList.setFocus();
						inputTextArea.setSelection(atRefStartIndex, atRefStartIndex);
						inputTextArea.setFocus();
						*/
						
					}
					else
						popUpList.includeInLayout = popUpList.visible = false;	

				}
			}
		}
		
		private function addSelectedItem(event:Event):void {
			var textRangeEndIndex:int;
			var selectionEndIndex:int;
			var insertionText:String = (popUpList.selectedItem.input_name as String) + " ";
		
			atReferenceObjects.addItem(popUpList.selectedItem);
			textRangeEndIndex = atRefStartIndex + atRefSearchString.length;
			selectionEndIndex = atRefStartIndex + insertionText.length;
			
			var autoTextRange : TextRange = new TextRange(inputTextArea, false, atRefStartIndex, textRangeEndIndex);
			autoTextRange.text = insertionText;
			
			inputTextArea.setSelection(selectionEndIndex, selectionEndIndex);
			inputTextArea.setFocus();
			removePopUp(event);
		}
		
		private function listHandleKeyDown(pEvent : KeyboardEvent) : void
		{
			if(pEvent.charCode == Keyboard.ENTER) 
			{
				addSelectedItem(pEvent);
				return; 
			}
			else if(pEvent.charCode == 0 || pEvent.charCode == Keyboard.UP || pEvent.charCode == Keyboard.DOWN)
				return;
			else if(pEvent.charCode == 27)
				removePopUp(pEvent)
			else
				inputTextArea.setFocus();
		}

		private function removePopUp(pEvent : Event) : void
		{
			atRefSearchString = "";
			atRefFlag = false;
			popUpList.includeInLayout = popUpList.visible = false;	
		}
		
		public function getAtRefObjects():ArrayCollection
		{
			return atReferenceObjects;
		}

	}
}