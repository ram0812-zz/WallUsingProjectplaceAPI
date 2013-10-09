package com.pages{
	import com.ppstatic.Config;
	import com.view.LoginPageContainer;
	
	import flash.data.EncryptedLocalStore;
	import flash.desktop.NativeApplication;
	import flash.events.Event;
	import flash.net.URLLoader;
	import flash.net.URLRequest;
	import flash.utils.ByteArray;
	
	import mx.controls.Alert;
	import mx.controls.HTML;
	import mx.utils.URLUtil;
	
	import org.flaircode.oauth.IOAuth;
	import org.flaircode.oauth.OAuth;
	import org.iotashan.oauth.OAuthToken;
	import org.iotashan.utils.OAuthUtil;
	
	public class LoginPage extends LoginPageContainer{
		private var auth:IOAuth;
		private var ACCESS_TOKEN_LOCAL_STORAGE:String = "OAUTHACCESSTOKEN";			
		private var requestToken:OAuthToken;
		private var accessToken:OAuthToken;
		private var callbackFun:Function;
		private var oAuthLogin:LoginPage;
		
		private var webclient:HTML; 
		
		public function LoginPage():void{
			
		}
		public function login(callback:Function):void {
			callbackFun = callback;
			auth = new OAuth(Config.consumenrKey, Config.consumenrSecret);
			if (isLoggedIn()){
				callbackFun(auth, accessToken);
			}
			else{
				var loader:URLLoader = auth.getRequestToken(Config.getRequestTokenUrl());
				loader.addEventListener(Event.COMPLETE, requestTokenHandler);
			}
		}
		
		public function getInstance():LoginPage {
			if (oAuthLogin == null) { 
				oAuthLogin = new LoginPage(); 
			}
			return oAuthLogin;
		}
		
		public function logout():void{
			EncryptedLocalStore.removeItem(ACCESS_TOKEN_LOCAL_STORAGE);
		}
		
		public function reLogin(callback:Function=null):void{
			if (callback != null){
				callbackFun = callback;
			}
			login(callbackFun)
		}
		
		private function requestTokenHandler(event:Event):void {
			requestToken = OAuthUtil.getTokenFromResponse(event.target.data as String);
			var request:URLRequest = auth.getAuthorizeRequest(Config.getAuthorizeUrl(), requestToken.key);
			webclient = new HTML()
			webclient.height =  NativeApplication.nativeApplication.activeWindow.height;
			webclient.width = NativeApplication.nativeApplication.activeWindow.width;
			webclient.addEventListener(Event.LOCATION_CHANGE, locationChangeListener);
			webclient.location = request.url;
			addElement(webclient);
		}
		
		private function locationChangeListener(event:Event):void {
			var location:String = event.currentTarget.location as String;
			if(location.search("oauth_verifier=") > 0) {
				var url:Object = URLUtil.stringToObject(location.split('?')[1], '&');
				var loader:URLLoader = auth.getAccessToken(Config.getAccessTokenUrl(), requestToken, {oauth_verifier:url.oauth_verifier});
				removeElement(webclient);
				loader.addEventListener(Event.COMPLETE, accessTokenHandler);
			}
		}
		
		private function accessTokenHandler(e:Event):void {
			accessToken = OAuthUtil.getTokenFromResponse(e.currentTarget.data as String);
			var token:String = accessToken.key;
			var secret:String = accessToken.secret;
			var bytes:ByteArray = new ByteArray();
			bytes.writeUTFBytes(token + ";" + secret);
			EncryptedLocalStore.setItem(ACCESS_TOKEN_LOCAL_STORAGE, bytes);
			callbackFun(auth, accessToken)
		}			
		
		private function getSavedAccessToken():OAuthToken {
			var storedAccessToken:ByteArray = EncryptedLocalStore.getItem(ACCESS_TOKEN_LOCAL_STORAGE)
			if(storedAccessToken == null)
				return null;
			var tokens:Array = storedAccessToken.readUTFBytes(storedAccessToken.length).split(";");
			return new OAuthToken(tokens[0], tokens[1])
		}
		
		private function isLoggedIn():Boolean {
			accessToken = getSavedAccessToken();
			return accessToken != null;
		}
		
	}
}