const snooze=(ms,obj=null)=>new Promise(resolve=>setTimeout(obj==null?resolve:function(){resolve(obj)},ms));
function ranint(t,o){return t=Math.ceil(t),o=Math.floor(o),Math.floor(Math.random()*(o-t)+t)}
const {setIntervalAsync}=require("set-interval-async/dynamic");
const request=require("request").defaults({encoding:null});
const {clearIntervalAsync}=require("set-interval-async");
const Discord=require("discord.js-selfbot");
const rootocrapi="84aeee189a88957";
const bot="574652751745777665";
const client=new Discord.Client();
const args=process.argv.slice(2);
var Running=false;
var Channel=null;
var timer=null;
var me=null;
var System={
	xp:0,
	loot:{},
	fished:0,
	prefix:"%",
	seconds:3.5,
	holdRun:false,
	ocrapi:"84aeee189a88957"
};
var Account={
	tag:"",
	token:"",
	username:""
};
function ocr(url,callback)
{
	const URI="https://api.ocr.space/parse/imageurl?apikey="+encodeURI(System.ocrapi)+"&url="+encodeURI(url);
	request.get(URI,{json:true},function(err,res,R){
		if(err){
			callback(null);
			return;
		}
		if(res.statusCode!=200){
			callback(null);
			return;
		}
		callback(R.ParsedResults[0].ParsedText.replace("\r\n",""));
	})
}
async function sendAsync(msg,chn=null,min=2700,max=4200){return(send(msg,chn,min,max));}
function send(msg,chn=null,min=2700,max=4200)
{
	if(chn==null)chn=Channel;
	if(msg.trim()=="")return;
	if(chn==null)return;
	chn.startTyping(1200);
	chn.send(msg.toString())
	.then((message)=>{setTimeout(function(){chn.stopTyping(true);message.delete()},ranint(min,max))})
	.catch(console.error);
	return;
}
function edit(msg,chn=null,min=2700,max=4200)
{
	if(msg.trim()=="")return;
	if(chn==null)return;
	chn.edit(msg.toString())
	.then((message)=>{setTimeout(function(){message.delete()},ranint(min,max))})
	.catch(console.error);
	return;
}
function notify(msg,chn=null,min=6000,max=12000)
{
	if(chn==null)return;
	edit("`"+msg+"`",chn,min,max);
}
String.prototype.alphabetic=function(){
	var R=/^[A-Za-z]+$/;
	var reg=new RegExp(R);
	return(reg.test(this));
}
String.prototype.numeric=function(){
	var R=/^\d+$/;
	var reg=new RegExp(R);
	return(reg.test(this));
}
String.prototype.timeFormat=function(){
	const s=parseInt((this).trim());
	var STR="0 seconds";
	if(s<1)return(STR);
	var L=[
		Math.floor(s/60/60/24),///DAYS
		Math.floor(s/60/60)%24,///HOURS
		Math.floor(s/60)%60,///MINUTES
		s%60///SECONDS
	];
	var R=[];
	if(L[0]>0)R.push(L[0]+" day"+(L[0]==1?"":"s"));
	if(L[1]>0)R.push(L[1]+" hour"+(L[1]==1?"":"s"));
	if(L[2]>0)R.push(L[2]+" minute"+(L[2]==1?"":"s"));
	if(L[3]>0)R.push(L[3]+" second"+(L[3]==1?"":"s"));
	if(R!=[])STR=R.join(", ");
	return(STR);
}
String.prototype.addslashes=function(){return(this+"").replace(/[.*+?^${}()|[\]\\]/g,"\\$&");}
String.prototype.replaceAll=function(src,who){
	var str=this;
	while(str.includes(src)){str=str.replace(src,who);}
	return(str);
	/*
	var reg=new RegExp("/"+src.addslashes()+"/g");
	return(this.replace(reg,who));
	*/
}
String.prototype.capitalize=function(){return(this.charAt(0).toUpperCase()+this.slice(1).toLowerCase());}
client.on("ready",()=>{
	me=client.user;
	Account.tag=me.tag;
	me.setStatus("online");
	Account.token=AUTH_TOKEN;
	Account.username=me.tag.split("#")[0];
	if(timer!=null){clearTimer(timer).then(()=>{console.log(me.tag+" logged in!")})}
	else{console.log(me.tag+" logged in!")}
});
const clearTimer=async(t)=>{await clearIntervalAsync(t)};
if(process.env.NODE_ENV!=="production")require("dotenv").config();
const startBot=async(msg)=>{
	if(msg==null)return;
	if(Running)return;
	Running=true;
	Channel=msg.channel;
	notify("[!] Initializing with prefix "+System.prefix,msg);
	timer=setIntervalAsync(()=>{doFish().then();},(System.seconds*1000)+ranint(300,666));
}
const doFish=async()=>{
	if(Channel==null){
		if(timer!=null)clearTimer(timer).then();
		return;
	}
	if(System.holdRun)return;
	send(System.prefix+"f",Channel);
}
client.on("message",async msg=>{
	try{
		if(msg.author.id==me.id){
			var R=msg.content.trim();
			if(!R.toLowerCase().startsWith("f."))return;
			R=R.substr(2);
			var L=R.split(" ");
			var length=L.length;
			L[0]=L[0].toLowerCase();
			if(L[0]=="start"){
				if(Running){
					notify("[!] I am already fishing",msg);
					return;
				}
				System.seconds=3.5;
				if(length==2)System.seconds=L[1].replaceAll(".","").trim().numeric()?parseFloat(L[1]):3.5;
				if(timer!=null){clearTimer(timer).then(()=>{startBot(msg).then()})}else{startBot(msg).then()}
			}else
			if(L[0]=="stop"){
				if(!Running){
					notify("[!] I am not fishing lmao",msg);
					return;
				}
				Channel=null;
				System.holdRun=Running=false;
				if(timer!=null)clearTimer(timer).then(()=>{notify("[!] Stopped",msg);});
			}else
			if(L[0]=="prefix"){
				if(Running){
					notify("[!] I cannot do this while fishing",msg);
					return;
				}
				if(length>1)System.prefix=R.substr(6).trim().toLowerCase();
				notify("[!] Current prefix is "+System.prefix,msg);
			}else
			if(L[0]=="loot"){
				var STR="`"+(System.xp>=0?"+":"-")+money(System.xp)+"` **XP**";
				for(var fish in System.loot){STR+="\n`"+money(System.loot[fish])+"` **"+fish+"**";}
				edit(STR,msg,60000,120000);
			}else
			if(L[0]=="ocr"){
				if(length>1&&R[1].trim()!="")System.ocrapi=R[1].trim();
				notify("[!] Current OCR.SPACE API KEY is "+System.ocrapi,msg);
			}else
			if(L[0]=="info"||L[0].startsWith("fish")){notify("[!] I have caught fish for a total of "+System.fished+" times which took me "+Math.ceil(System.fished*System.seconds).toString().timeFormat(),msg)}
		}else
		if(msg.author.id==bot&&msg.channel==Channel){
			const forme=msg.content.includes(Account.username);
			if(msg.content.includes("User "+me.tag+" banned")){
				console.log(me.tag+" has been temporary banned from Virtual Fisher!");
				process.exit(333);
				return;
			}
			if(msg.content.includes("/bot/captcha.php")&&forme){
				System.holdRun=true;
				///console.log("CAPTCHA");
				const url="https"+msg.content.split("https")[1];
				ocr(url,function(R){
					if(R===null){
						console.log("CAPTCHA RESULT = NULL");
						process.exit(123);
						return;
					}
					msg.channel.startTyping();
					snooze(ranint(9000,60000),{a:R,chn:msg.channel,p:System.prefix})
					.then((T)=>{
						send(T.p+"verify "+T.a,T.chn,30000,60000);
						System.holdRun=false;
					})
				});
				return;
			}
			if(msg.content.includes("adding the following 2 numbers and subtracting the third number")&&forme){
				///console.log("MATH");
				System.holdRun=true;
				const LST=msg.content.trim().split(": ");
				var n3=parseInt(LST[3].replace(".",""));
				var n2=parseInt(LST[2]);
				var n1=parseInt(LST[1]);
				var answer=(n1+n2)-n3;
				msg.channel.startTyping();
				snooze(ranint(6000,18000),{a:answer,chn:msg.channel,p:System.prefix}).then((T)=>{send(T.p+"verify "+T.a,T.chn);System.holdRun=false})
				return;
			}
			const e=msg.embeds[0];
			if(!e)return;
			if(e.type!="rich")return;
			if(e.author===null)return;
			if(e.author.name!=Account.username)return;
			if(e.title.includes("You caught:")){
				++System.fished;
				const caught=e.description.split("\n");
				for(var x in caught){
					var c=caught[x];
					var row=c.split(" ");
					if(row.length>2){
						if(row[0].numeric()&&row[1].startsWith("<:fb")){
							var name=c.substr(row[0].length+row[1].length+2).trim();
							if(!System.loot.hasOwnProperty(name))System.loot[name]=0;
							System.loot[name]=System.loot[name]+parseInt(row[0]);
						}else
						if(row[2]==="XP"&&row[0]==="-"){System.xp+=parseInt(row[1].replaceAll(",","").trim());}
					}else
					if(row.length>1){
						if(row[1]==="XP"){if(row[0].startsWith("+")){System.xp+=parseInt(row[0].substr(1).replaceAll(",",""))}else{System.xp+=parseInt(row[0].substr(1).replaceAll(",",""))}}
					}
				}
			}else
			if(e.title.startsWith("Anti-bot")){
				System.holdRun=true;
				msg.channel.startTyping();
				///console.log("SIMPLE MATH");
				const L=eval(e.description.split("**")[1]).toString();
				snooze(ranint(6000,18000),{a:L,chn:msg.channel,p:System.prefix}).then((T)=>{send(T.p+"verify "+T.a,T.chn);System.holdRun=false;})
			}
		}
	}catch(e){console.log(e);}
});
function money(s){return(Number(s).toLocaleString("en"))}
const ARG_TOKEN=args.length>0?args[0]:"";
var AUTH_TOKEN=ARG_TOKEN!=""?ARG_TOKEN:process.env.TOKEN;
if(AUTH_TOKEN!=""){client.login(AUTH_TOKEN);}
else{
	console.log("Please define an authorization token!");
	process.exit(666);
}
