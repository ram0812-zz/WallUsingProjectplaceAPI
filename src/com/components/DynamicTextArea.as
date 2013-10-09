package com.components
{
	import com.hurlant.crypto.symmetric.NullPad;
	import com.view.MainContainer;
	
	import flash.events.Event;
	import flash.events.KeyboardEvent;
	import flash.text.TextField;
	import flash.text.TextFieldAutoSize;
	import flash.ui.Keyboard;
	
	import mx.controls.Alert;
	import mx.controls.TextArea;
	import mx.core.mx_internal;
	import mx.events.FlexEvent;
	
	public class DynamicTextArea extends TextArea
	{
		public function DynamicTextArea()
		{
			super();
			super.horizontalScrollPolicy = "off";
			super.verticalScrollPolicy = "off";
			this.setStyle("cornerRadius", 10);
			this.addEventListener(FlexEvent.CREATION_COMPLETE, creationComplete);
			this.addEventListener(FlexEvent.UPDATE_COMPLETE, updateComplete);
			this.addEventListener(Event.CHANGE, adjustHeightHandler);
			this.addEventListener(KeyboardEvent.KEY_DOWN, handleKeyDown);
		}
		
		private function creationComplete( event : FlexEvent ) : void {
			textField.autoSize = TextFieldAutoSize.LEFT;
			textField.wordWrap = true;
		} 
	
		private function handleKeyDown(event:KeyboardEvent):void
		{
			if (event.keyCode == Keyboard.DOWN || event.keyCode == Keyboard.UP)
				event.stopPropagation();
		}
		private function updateComplete( event : FlexEvent ) : void {
			if (super.height > super.minHeight && super.height != Math.floor( textField.height ) ) 
			{
				var newHeight:Number = textField.height;
				if (textField.height < super.minHeight)
					newHeight = super.minHeight
				super.height = newHeight;
			}
		} 
		
		private function getTextField():TextField
		{
			return super.mx_internal::getTextField();
		}
		
		private function adjustHeightHandler(event:Event):void
		{
			super.dispatchEvent( new FlexEvent( FlexEvent.UPDATE_COMPLETE ) );
			trace("textField.getLineMetrics(0).height: " + textField.getLineMetrics(0).height);
			if( height <= textField.textHeight + textField.getLineMetrics(0).height ) 
			{
				height = textField.textHeight + textField.getLineMetrics(0).height;
				validateNow(); 
				//this.verticalScrollPosition = this.maxVerticalScrollPosition;
			}
			/*
			if(height <= textField.textHeight + textField.getLineMetrics(0).height)
			{
				height = textField.textHeight;    
				validateNow();
			}*/
		}
		
		public function resetHeight(minHeight:Number):void
		{
			super.dispatchEvent( new FlexEvent( FlexEvent.UPDATE_COMPLETE ) );
		}

		override public function get text():String
		{
			return textField.text;
		}
		
		override public function set text(val:String):void
		{
			textField.text = val;
			validateNow();
			height = textField.textHeight;
			validateNow();
		}
		
		override public function set htmlText(val:String):void
		{
			textField.htmlText = val;
			validateNow();
			height = textField.textHeight;
			validateNow();
		}
		
		override public function set height(value:Number):void
		{
			if(textField == null)
			{
				if(height <= value)
				{
					super.height = value;
				}
			}
			else
			{      
				var currentHeight:uint = textField.textHeight + textField.getLineMetrics(0).height;
				if (currentHeight<= super.maxHeight)
				{
					if(textField.textHeight != textField.getLineMetrics(0).height)
					{
						super.height = currentHeight;
					}       
				}
				else
				{
					super.height = super.maxHeight;        
				} 
			}
		}
				
		override public function get htmlText():String
		{
			return textField.htmlText;
		}
		
		override public function set maxHeight(value:Number):void
		{
			super.maxHeight = value;
		}
	}
}


