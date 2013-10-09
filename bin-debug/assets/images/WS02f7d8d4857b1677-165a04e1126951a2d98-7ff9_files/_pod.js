var testMsg = '*** NOTE: Carlos is testing in stage ***  \n\n';
// alert (testMsg);

// browser detection
var agt     = navigator.userAgent.toLowerCase();
var isIE6   = (agt.indexOf("msie 6") > -1) ? true : false;

// animation variables 
var increment = 5; // pixes
var speed     = 10; // milliseconds
var cpos;
var npos;

// pod variables
var divtag  = "";
var podContent;
var hidepod = "Hide other versions";
var showpod = "Show other versions";

var pageloc = getPageLoc();
var dirPath = document.location.pathname.toString();
var podPath = dirPath.substr(0, dirPath.lastIndexOf("/"));
var podFile = podPath + "/_pod.html";

// display pod if necessary
if ( podFile ){
    if ( typeof(terms_LANGUAGE) != 'undefined' ){
        if ( terms_LANGUAGE != "en-us"){
            hidepod = terms_AHV_HIDE;
            showpod = terms_AHV_SHOW;
        }
    }

    // write out css 
    document.write('<link rel="stylesheet" type="text/css" href="/en_US/ssi/_pod.css"/>');

    // set a browser dependent id for the pod 
    var ahpod  = isIE6 ? "ahpod_ie" : "ahpod";

    // write out pod code
    document.write( '<div id="' + ahpod + '">' +
        '  <img id="showpod" src="/en_US/shared/ahpods/images/pod_show.png" ' +
        '       onclick="javascript:showPod();" title="'+ showpod +'"/>' +
        '  <img id="hidepod" src="/en_US/shared/ahpods/images/pod_hide.png" ' + 
        '       onclick="javascript:slideOut(\'24\');" title="'+ hidepod +'" />'+ 
        '  <br clear="all">'+
        '  <div id="podContent">' 
        +  podContent +
        '  </div>' +
        '</div>' +
        '<div id="podcollapsed">' +
        '  <img src="/en_US/shared/ahpods/images/pod_show.png" ' +
        '       onclick="javascript:showPod();" title="'+ showpod +'" id="showpod"/>' +
        '</div>');
   
    // diplay pod content via ajax
    getPodContent();

    // check cookie for pod preference
    if (document.cookie.indexOf("ah_pod=hidden") > -1){
        hidePod();
    }

    // hide showpod button (IE6 only) 
    if (isIE6){
        document.getElementById('showpod').style.display="none";
        document.getElementById('showpod').style.visibility="hidden";
    }
}


// ///////////////////
// get page locale to match with pod  locale
// 
function getPageLoc() {
    var _pageloc;
    var metaElements = document.all ?
            document.all.tags('meta') :
            document.getElementsByTagName ?
            document.getElementsByTagName ('meta') : new Array();
    for (var m = 0; m < metaElements.length; m++) {
        if (metaElements[m].name == "lang") {
            _pageloc = metaElements[m].content;
            break;
        }
    }
    return _pageloc;
}


// /////////////////////////////////////////////
// show/hide pod functions
//
function hidePod(){
    if (isIE6){
        document.getElementById(ahpod).style.display = "none";
        document.getElementById(ahpod).style.visibility="hidden";
        document.getElementById('podcollapsed').style.display = "block";
        document.getElementById('podcollapsed').style.visibility="visible";
    }else{
        document.getElementById(ahpod).style.right = "-306px";
        document.getElementById('podContent').style.visibility="hidden";
        document.getElementById('showpod').style.visibility="visible";
    }
}


function showPod(){
    var expire=new Date();                 // Set cookie: ah_pod=visible
    expire.setDate(expire.getDate()+90);   // Cookie expires after 90 days
    document.cookie = "ah_pod=visible;path=/;expires=" + expire.toGMTString();

    if ( isIE6 ){ // IE6 uses static pod
        document.getElementById('podcollapsed').style.display = "none";
        document.getElementById('podcollapsed').style.visibility="hidden";
        document.getElementById(ahpod).style.display = "block";
        document.getElementById(ahpod).style.visibility="visible";
    }else{ // other browsers use one sliding pod 
        document.getElementById('showpod').style.visibility="hidden";
        document.getElementById('podContent').style.visibility="visible";
        slideIn( '-304' );
    }
}



// /////////////////////////////////////////////
// sliding pod animation
//
function slideOut(pos){
    var expire=new Date();                 // Set cookie: ah_pod=hidden
    expire.setDate(expire.getDate()+90);   // Cookie expires after 90 days
    document.cookie = "ah_pod=hidden;path=/;expires=" + expire.toGMTString();

    if ( isIE6 ){ // IE6 uses a static collapsed pods
        document.getElementById(ahpod).style.display="none";
        document.getElementById(ahpod).style.visibility="hidden";
        document.getElementById('podcollapsed').style.display="block";
        document.getElementById('podcollapsed').style.visibility="visible";
    }else{
        cpos = pos;
        npos = cpos - increment;
        if ( npos > -310 ){ 
           document.getElementById(ahpod).style.right = npos + "px";
           //setTimeout("slideOut(npos)",18);
           setTimeout("slideOut(npos)", speed);
        }else{
            document.getElementById('podContent').style.visibility="hidden";
            document.getElementById('showpod').style.visibility="visible";
        }
    }
}


function slideIn(pos){
    cpos = pos;
    npos = eval(increment+cpos);
    if ( npos  < 20 ){ 
       document.getElementById(ahpod).style.right = npos + "px";
       //setTimeout("slideIn(npos)",18);
       setTimeout("slideIn(npos)",speed);

       document.getElementById('podContent').style.visibility="visible";	
    }
}



// /////////////////////////////////////////////
// ajax code to retrieve pod content from server
//
function getPodContent(){
    myRequest=null;
    if (window.XMLHttpRequest){       // code for Firefox, Opera, IE7, etc.
        myRequest=new XMLHttpRequest();
    }else if (window.ActiveXObject){  // code for IE6, IE5
        myRequest=new ActiveXObject("Microsoft.XMLHTTP");
    }
    if (myRequest!=null){
        myRequest.onreadystatechange=stateChange;
        myRequest.open("GET",podFile,true);
        myRequest.send(null);
    }else{
        alert("Your browser does NOT support XMLHTTP.");
    }
}


function stateChange(){
    if ( myRequest.readyState == 4 ){   // 4 = "loaded"
        if ( myRequest.status == 200 ){ // 200 = "OK"
           var langmeta = 'meta name="lang" content="' + pageloc + '"';
           if ( myRequest.responseText.indexOf( langmeta ) != -1 || window != top){
              document.getElementById(ahpod).style.display="block"; 
              document.getElementById('podContent').innerHTML=myRequest.responseText;
            }
        }else{
            //alert("Problem retrieving data:" + xmlhttp.statusText);
            //document.getElementById('Pod_Source_File_Not_Found').style.display="none"; //error for debugging
            document.getElementById(ahpod).style.display="none";  // hide pod
        }
    }else{
        document.getElementById(ahpod).style.display="none";
    }
}


