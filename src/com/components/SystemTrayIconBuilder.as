/*
* Copyright (c) 2010 Mattes Groeger
* 
* Permission is hereby granted, free of charge, to any person obtaining a copy
* of this software and associated documentation files (the "Software"), to deal
* in the Software without restriction, including without limitation the rights
* to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
* copies of the Software, and to permit persons to whom the Software is
* furnished to do so, subject to the following conditions:
* 
* The above copyright notice and this permission notice shall be included in
* all copies or substantial portions of the Software.
* 
* THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
* IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
* FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
* AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
* LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
* OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
* THE SOFTWARE.
*/
package com.components 
{
	import de.mattesgroeger.air.icon.builder.AbstractIconBuilder;
	import de.mattesgroeger.air.icon.builder.IconBuilder;
	import de.mattesgroeger.air.icon.win.badge.TrayIconBadge;
	
	import flash.display.Bitmap;
	
	public class SystemTrayIconBuilder extends AbstractIconBuilder implements IconBuilder 
	{
		public override function createNewIcon(width : int, height : int) : void
		{
			super.createNewIcon(16, 16);
		}
		
		public override function addBackground(background : Bitmap) : void
		{
			background.width = background.height = 16;
			
			container.addChild(background);
		}
		
		public override function addBadge(label : String) : void 
		{
			if (isLabelInvalid(label))
				return;
			
			var badge : TrayIconBadge = new TrayIconBadge();
			badge.label.text = label;
			
			container.addChild(badge);
		}
		
		private function isLabelInvalid(label : String) : Boolean 
		{
			return (label == null || label.length == 0);
		}
	}
}
