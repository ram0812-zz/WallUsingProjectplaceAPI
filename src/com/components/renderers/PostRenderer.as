package com.components.renderers
{
	import mx.controls.listClasses.IListItemRenderer;
	import mx.core.UIComponent;
	import mx.events.FlexEvent;
	
	import mx.controls.Label;
	
	public class PostRenderer extends UIComponent implements IListItemRenderer
	{
		private var posLabel:Label; 
		private var negLabel:Label;
		
		public function PostRenderer()
		{
			super()
		}
		
		// Internal variable for the property value.
		
		private var _data:Object;
		// Make the data property bindable.
		
		[Bindable("dataChange")]
		// Define the getter method.
		
		public function get data():Object {
			
			return _data;
			
		}
		// Define the setter method, and dispatch an event when the property
		
		// changes to support data binding.
		
		
		public function set data(value:Object):void {
			_data = value;
			invalidateProperties();
			dispatchEvent(new FlexEvent(FlexEvent.DATA_CHANGE));
		}
		
		override protected function createChildren() : void        
		{                
			super.createChildren();
			posLabel = new Label();           
			posLabel.visible = true;      
			posLabel.setStyle("color", 0xFF0000);           
			addChild(posLabel);               
			negLabel = new Label();           
			negLabel.visible = true;             
			negLabel.setStyle("color", 0xFF0000);           
			addChild(negLabel);       
		}
		override protected function commitProperties():void           
		{                
			super.commitProperties();
			posLabel.text = "123";
			negLabel.text = "12345";    
			posLabel.visible = true;//Number(data.price) > 0;     
			negLabel.visible = true;//Number(data.price) < 0;           
		}
		
		override protected function updateDisplayList(unscaledWidth:Number, unscaledHeight:Number ) : void
		{        
			super.updateDisplayList(unscaledWidth, unscaledHeight);         
		}
	}
}