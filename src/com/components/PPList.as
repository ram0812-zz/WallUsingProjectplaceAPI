package com.components
{
	import flash.events.KeyboardEvent;
	import flash.ui.Keyboard;
	
	import mx.controls.Alert;
	import mx.events.FlexEvent;
	
	import spark.components.List;
	import spark.layouts.VerticalLayout;


	public class PPList extends List 
	{
		public function PPList()
		{
			super();
			this.useVirtualLayout = true;
			this.addEventListener(FlexEvent.CREATION_COMPLETE, setLayout);
		}
	
		private function setLayout(e:FlexEvent):void
		{
			var v:VerticalLayout = VerticalLayout(this.layout);
			v.requestedRowCount = 3;
			v.horizontalAlign = "justify";
			v.gap = 12;
			v.paddingLeft = 16;
			v.paddingBottom = 20;
			this.scroller.verticalScrollBar.styleName = "iPhoneScroll";

		}
		
		override protected function keyDownHandler(e:KeyboardEvent):void 
		{
			if (e.keyCode == Keyboard.DOWN)
			{
				this.scroller.viewport.verticalScrollPosition += 30;
				e.stopPropagation();
				//callLater(this.setFocus);
			}
			else if (e.keyCode == Keyboard.UP)
			{
				this.scroller.viewport.verticalScrollPosition -= 30;
				e.stopPropagation();
				//callLater(this.setFocus);
			}
			else
				super.keyDownHandler(e);

		}
		/*
		override protected function keyUpHandler(event:KeyboardEvent):void 
		{

			//this.scroller.viewport.verticalScrollPosition -= 20;
		}*/
	}
}