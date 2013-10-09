package com.components
{	
	import flash.desktop.NativeApplication;
	import flash.display.NativeMenu;
	import flash.display.NativeMenuItem;
	
	import flash.events.ScreenMouseEvent;
	
	public class DockIcon
	{
		
		public function DockIcon()
		{
		
		}
		public function createContextMenu():void{
			
			var iconMenu:NativeMenu = new NativeMenu();
			addMenuItems(iconMenu);
			NativeApplication.nativeApplication.autoExit = false;            
			loadIcon(false, 0);
			if (NativeApplication.supportsSystemTrayIcon) {
				var trayIcon:SystemTrayIcon = NativeApplication.nativeApplication.icon as SystemTrayIcon;
				trayIcon.addEventListener(ScreenMouseEvent.CLICK, showAirApp)
				trayIcon.addEventListener(MouseEvent.CLICK, menuActivated);
				//trayIcon.tooltip = resourceManager.getString(langId + '_resources', 'trayToolTipDA', null, langId);
				trayIcon.menu = iconMenu;
			}
			else if (NativeApplication.supportsDockIcon) {
				var dockIcon:DockIcon = NativeApplication.nativeApplication.icon as DockIcon;
				dockIcon.addEventListener(ScreenMouseEvent.CLICK, showAirApp)
				NativeApplication.nativeApplication.addEventListener(InvokeEvent.INVOKE, menuActivated);
				dockIcon.menu = iconMenu;
			}
			showAirApp(null);
		}
		
		public function addMenuItems(iconMenu:NativeMenu):NativeMenu {
			if(loggedUser.getShowLogin()) {
				var loginCommand:NativeMenuItem =
					iconMenu.addItem(new NativeMenuItem(resourceManager.getString(langId + '_resources', 'loginDA', null, langId)));
				loginCommand.addEventListener(Event.SELECT, showLoginFromMenu);                      
			}
			else {
				var logoutCommand:NativeMenuItem =
					iconMenu.addItem(new NativeMenuItem(resourceManager.getString(langId + '_resources', 'logoutDA', null, langId)));
				logoutCommand.addEventListener(Event.SELECT, doLogout); 
				var openDocument:NativeMenuItem =
					iconMenu.addItem(new NativeMenuItem(resourceManager.getString(langId + '_resources', 'openDA', null, langId)));
				openDocument.addEventListener(Event.SELECT, showDocListFromMenu);
				showDocList();
			}
			
			var seperator:NativeMenuItem = iconMenu.addItem(new NativeMenuItem("", true));               
			
			var openProjectplace:NativeMenuItem =  iconMenu.addItem(new NativeMenuItem(resourceManager.getString(langId + '_resources', 'openPPDA', null, langId)));
			openProjectplace.addEventListener(Event.SELECT, function(event:Event):void{
				
				var method:String = URLRequestMethod.GET;
				var requestUrl:String = Config.getLoginUrl();
				var req:URLRequest = new URLRequest(requestUrl);
				req.method = method;
				navigateToURL(req, "_blank");
			});
			
			var toogleAutoStart:NativeMenuItem =  iconMenu.addItem(new NativeMenuItem(resourceManager.getString(langId + '_resources', 'autoStartDA', null, langId)));              
			if(NativeApplication.nativeApplication.startAtLogin) {
				toogleAutoStart.checked = true;
			}
			else {
				toogleAutoStart.checked = false;
			}
			
			toogleAutoStart.addEventListener(Event.SELECT, function(event:Event):void {
				if(NativeApplication.nativeApplication.startAtLogin) {
					NativeApplication.nativeApplication.startAtLogin = false;
					toogleAutoStart.checked = false;
				}
				else {
					NativeApplication.nativeApplication.startAtLogin = true;
					toogleAutoStart.checked = true;
				}          
			});
			
			if (NativeApplication.supportsSystemTrayIcon){
				var exitCommand:NativeMenuItem =
					iconMenu.addItem(new NativeMenuItem(resourceManager.getString(langId + '_resources', 'exitDA', null, langId)));
				exitCommand.addEventListener(Event.SELECT, function(event:Event):void{
					NativeApplication.nativeApplication.exit();
				});
			}
			
			return iconMenu;
		}
		
		public function loadIcon(updatedFilesExists:Boolean, numberOfDocs:int):void
		{
			var icon:Loader = new Loader();
			icon.contentLoaderInfo.addEventListener(Event.COMPLETE, iconLoadComplete);
			icon.load(new URLRequest("assets/images/pp_128x128.png"));
		}
	}
}