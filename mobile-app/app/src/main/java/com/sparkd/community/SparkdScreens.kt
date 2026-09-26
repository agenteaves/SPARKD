package com.sparkd.community

import android.graphics.BitmapFactory
import android.widget.Toast
import java.io.ByteArrayOutputStream
import java.math.RoundingMode
import java.net.HttpURLConnection
import java.net.URL
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.delay
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import org.json.JSONObject
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.*
import androidx.compose.foundation.gestures.detectDragGestures
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.*
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.*
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.layout.onSizeChanged
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalUriHandler
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.IntOffset
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

@Composable fun Forge(wallet:WalletSession?=null,onEntryReady:(()->Unit)?=null){
 val ctx=LocalContext.current
 var src by remember{mutableStateOf(ForgeDraft.src)};var title by remember{mutableStateOf(ForgeDraft.title)};var layers by remember{mutableStateOf(ForgeDraft.layers)}
 var selected by remember{mutableStateOf(ForgeDraft.selected)};var png by remember{mutableStateOf<ByteArray?>(null)};var canvasPx by remember{mutableStateOf(1f)}
 var exportBytes by remember{mutableStateOf<ByteArray?>(null)};var exportStatus by remember{mutableStateOf<String?>(null)}
 val creatorId=remember{ctx.getSharedPreferences("sparkd-forge",0).getString("creator-id",null)?:ForgeDna.newCreatorId().also{ctx.getSharedPreferences("sparkd-forge",0).edit().putString("creator-id",it).apply()}}
 val exportPng=rememberLauncherForActivityResult(ActivityResultContracts.CreateDocument("image/png")){uri->
  val bytes=exportBytes
  if(uri!=null&&bytes!=null)runCatching{ctx.contentResolver.openOutputStream(uri)?.use{it.write(bytes)}?:error("Unable to open the selected save location.")}.onSuccess{exportStatus="✅ Verified SPARKD Forge PNG saved. It is ready for contest entry."}.onFailure{exportStatus="🚫 Export failed: "+(it.message?:"Unable to save PNG.")}
 }
 var textPopup by remember{mutableStateOf(false)};var emojiPopup by remember{mutableStateOf(false)};var newText by remember{mutableStateOf("")};var newTextColor by remember{mutableStateOf(android.graphics.Color.WHITE)}
 var safetyChecking by remember{mutableStateOf(false)};var safetyMessage by remember{mutableStateOf(ForgeDraft.safetyMessage)}
 DisposableEffect(Unit){onDispose{ForgeDraft.src=src;ForgeDraft.title=title;ForgeDraft.layers=layers;ForgeDraft.selected=selected;ForgeDraft.safetyMessage=safetyMessage}}
 val emojis=listOf("😀","😃","😄","😁","😂","🤣","😊","😍","🥰","😘","😎","🤓","🧐","🤔","🙄","😏","😬","😭","😡","🤬","😱","🤯","🥳","🤡","👻","💀","👽","🤖","😈","💩","🔥","⚡","✨","💥","💯","❤️","💔","💚","💛","💙","💜","👀","👑","💎","🚀","🤑","💰","🪙","🏆","🥇","🎉","🎊","👍","👎","👏","🙌","🙏","💪","🤝","✌️","🤘","🫡","👉","👈","☝️","🐸","🐶","🐱","🦍","🦁","🐐","🦖","🦅","🍕","🍔","🌮","🍺","☕","🎮","🎯","🎲","⚽","🏀","🏈","🚗","🏎️","🌎","🌙","☀️","⭐","🚨","⚠️","✅","❌","❓","‼️","📈","📉","🔒","🔓")
 val pick=rememberLauncherForActivityResult(ActivityResultContracts.GetContent()){u->
  if(u!=null){safetyChecking=true;safetyMessage="🛡 Inspecting image before opening Forge..."
   kotlinx.coroutines.CoroutineScope(Dispatchers.Main).launch{
    try{
     val bytes=withContext(Dispatchers.IO){ctx.contentResolver.openInputStream(u)?.use{it.readBytes()}?:throw Exception("Unable to read image.")}
     val safetyBytes=withContext(Dispatchers.Default){prepareForgeSafetyImage(bytes)}
     val result=withContext(Dispatchers.IO){checkForgeImageSafety(safetyBytes,"image/jpeg")}
     if(result.first){src=BitmapFactory.decodeByteArray(bytes,0,bytes.size);layers=emptyList();selected=null;safetyMessage="✅ Image passed content inspection."}
     else{safetyMessage="🚫 "+result.second;Toast.makeText(ctx,result.second,Toast.LENGTH_LONG).show()}
    }catch(e:Exception){val detail=e.message?:e.javaClass.simpleName;safetyMessage="🚫 Content protection error: "+detail;Toast.makeText(ctx,"Image blocked: "+detail,Toast.LENGTH_LONG).show()}
    finally{safetyChecking=false}
   }
  }
 }
 LaunchedEffect(src,layers){png=src?.let{MemeForge.render(it,"","",layers)}}
 if(textPopup) AlertDialog(onDismissRequest={textPopup=false},title={Text("Add text")},text={Column(verticalArrangement=Arrangement.spacedBy(12.dp)){
  OutlinedTextField(newText,{newText=it},label={Text("Text")});Text("Text color",fontSize=12.sp,color=Color.LightGray)
  val textColors=listOf(android.graphics.Color.WHITE,android.graphics.Color.BLACK,android.graphics.Color.YELLOW,android.graphics.Color.RED,android.graphics.Color.GREEN,android.graphics.Color.CYAN,android.graphics.Color.BLUE,android.graphics.Color.MAGENTA)
  Row(Modifier.fillMaxWidth(),horizontalArrangement=Arrangement.SpaceBetween){textColors.forEach{c->val selectedColor=newTextColor==c;Box(Modifier.size(30.dp).background(Color(c),RoundedCornerShape(50)).border(if(selectedColor)3.dp else 1.dp,if(selectedColor)Gold else Color.Gray,RoundedCornerShape(50)).clickable{newTextColor=c})}}
 }},confirmButton={Button({if(newText.isNotBlank()){val n=layers+ForgeSticker(newText,color=newTextColor);layers=n;selected=n.lastIndex;newText="";newTextColor=android.graphics.Color.WHITE};textPopup=false}){Text("Add")}},dismissButton={TextButton({textPopup=false}){Text("Cancel")}})
 if(emojiPopup) AlertDialog(onDismissRequest={emojiPopup=false},title={Text("Choose emoji")},text={LazyVerticalGrid(columns=androidx.compose.foundation.lazy.grid.GridCells.Fixed(6),modifier=Modifier.fillMaxWidth().heightIn(min=240.dp,max=380.dp),horizontalArrangement=Arrangement.spacedBy(4.dp),verticalArrangement=Arrangement.spacedBy(4.dp)){items(emojis.size){idx->val e=emojis[idx];TextButton(onClick={val n=layers+ForgeSticker(e);layers=n;selected=n.lastIndex;emojiPopup=false},contentPadding=PaddingValues(2.dp),modifier=Modifier.size(48.dp)){Text(e,fontSize=27.sp)}}}},confirmButton={TextButton({emojiPopup=false}){Text("Close")}},modifier=Modifier.fillMaxWidth(.92f))
 LazyColumn(Modifier.padding(18.dp),verticalArrangement=Arrangement.spacedBy(12.dp)){
  item{Text("Meme Forge",fontSize=30.sp,fontWeight=FontWeight.Black);Text("Create the meme directly on the image.",color=Color.LightGray)}
  item{OutlinedTextField(title,{title=it},label={Text("Meme title")},modifier=Modifier.fillMaxWidth(),singleLine=true)}
  item{Row(horizontalArrangement=Arrangement.spacedBy(8.dp)){OutlinedButton({if(!safetyChecking)pick.launch("image/*")},Modifier.weight(1f),enabled=!safetyChecking){Text(if(safetyChecking)"Inspecting..." else if(src==null)"Choose image" else "Replace image")};if(src!=null)OutlinedButton({src=null;png=null;layers=emptyList();selected=null;safetyMessage=null;ForgeDraft.src=null;ForgeDraft.layers=emptyList();ForgeDraft.selected=null;ForgeDraft.safetyMessage=null},Modifier.weight(1f)){Text("🗑 Delete image")}}}
  safetyMessage?.let{m->item{Text(m,color=if(m.startsWith("✅"))Green else if(m.startsWith("🚫"))Gold else Color.LightGray,fontSize=12.sp)}}
  png?.let{b->item{Box(Modifier.fillMaxWidth().aspectRatio(1f).onSizeChanged{canvasPx=it.width.toFloat().coerceAtLeast(1f)}){
   Image(BitmapFactory.decodeByteArray(b,0,b.size).asImageBitmap(),null,Modifier.fillMaxSize())
   layers.forEachIndexed{i,l->Box(Modifier.align(Alignment.TopStart).offset{val half=(120.dp.toPx()/2f);IntOffset((l.x*canvasPx-half).toInt(),(l.y*canvasPx-half).toInt())}.size(120.dp).pointerInput(i){detectDragGestures(onDragStart={selected=i}){change,drag->change.consume();if(i<layers.size){val n=layers.toMutableList();val cur=n[i];n[i]=cur.copy(x=(cur.x+drag.x/canvasPx).coerceIn(.05f,.95f),y=(cur.y+drag.y/canvasPx).coerceIn(.05f,.95f));layers=n}}},contentAlignment=Alignment.Center){if(selected==i)Box(Modifier.size(112.dp).border(2.dp,Gold,RoundedCornerShape(10.dp)))}}
  }}}
  item{Row(horizontalArrangement=Arrangement.spacedBy(8.dp)){Button({textPopup=true},Modifier.weight(1f)){Text("＋ Text")};Button({emojiPopup=true},Modifier.weight(1f)){Text("😀 Emoji")}}}
  selected?.takeIf{it in layers.indices}?.let{i->item{Surface(shape=RoundedCornerShape(16.dp)){Column(Modifier.padding(14.dp)){Text("Selected: "+layers[i].text,fontWeight=FontWeight.Bold);Text("Resize");Slider(value=layers[i].size,onValueChange={v->if(i<layers.size){val n=layers.toMutableList();n[i]=n[i].copy(size=v);layers=n}},valueRange=36f..180f);Row(horizontalArrangement=Arrangement.spacedBy(8.dp)){OutlinedButton({if(i<layers.size){val n=layers.toMutableList();n[i]=n[i].copy(x=.5f,y=.5f);layers=n}},Modifier.weight(1f)){Text("Center")};OutlinedButton({if(i<layers.size){layers=layers.toMutableList().also{it.removeAt(i)};selected=null}},Modifier.weight(1f)){Text("Delete")}}}}}}
  if(layers.isNotEmpty())item{Text("Tip: drag the text or emoji directly on the image. Tap a layer below to select it.",color=Color.LightGray,fontSize=12.sp);LazyRow(horizontalArrangement=Arrangement.spacedBy(6.dp)){items(layers.size){i->AssistChip(onClick={selected=i},label={Text(layers[i].text)})}}}
  item{Button({runCatching{val address=wallet?.address?:error("Connect your Solana wallet before exporting a contest meme.");val raw=png?:error("Choose an image before exporting.");val record=ForgeDna.create(raw,creatorId,address);val verified=ForgeDna.embed(raw,record);val savedRecord=ForgeExportStore.save(ctx,verified);ForgeDraft.exportedRecord=savedRecord;ForgeDraft.exportedPng=verified;exportBytes=verified;exportPng.launch("SPARKD-"+record.memeID+".png")}.onFailure{exportStatus="🚫 "+(it.message?:"Unable to prepare verified Forge PNG.")}},enabled=png!=null&&wallet?.address!=null,modifier=Modifier.fillMaxWidth()){Text(if(wallet?.address==null)"Connect wallet to export" else "Export Verified Forge PNG")}}
  exportStatus?.let{m->item{Text(m,color=if(m.startsWith("✅"))Green else Gold,fontSize=12.sp)}}
  if(ForgeDraft.exportedPng!=null&&ForgeDraft.exportedRecord!=null&&onEntryReady!=null)item{OutlinedButton({onEntryReady()},Modifier.fillMaxWidth()){Text("Continue to secure contest entry")}}
 }
}

@Composable fun Contest(r:SparkdRepository){
 var list by remember{mutableStateOf(emptyList<Meme>())};var message by remember{mutableStateOf("Loading live contenders…")}
 LaunchedEffect(Unit){while(isActive){runCatching{r.memes()}.onSuccess{list=it;message=if(it.isEmpty())"No approved entries yet." else ""}.onFailure{message=it.message?:"Unable to load live contenders."};delay(15_000)}}
 LazyColumn(Modifier.padding(18.dp),verticalArrangement=Arrangement.spacedBy(12.dp)){item{Text("This Week's Contenders",fontSize=27.sp,fontWeight=FontWeight.Black);Text("Live entries from SPARKD Meme of the Week.",color=Gold)};if(message.isNotBlank())item{Text(message,color=Color.LightGray)};items(list){m->Surface(shape=RoundedCornerShape(20.dp)){Column(Modifier.padding(16.dp)){m.imageUrl?.let{RemoteMemeImage(it)}?:Box(Modifier.fillMaxWidth().aspectRatio(1.4f).background(Color(0xFF182A20),RoundedCornerShape(14.dp)),contentAlignment=Alignment.Center){Text("Image unavailable",color=Color.Gray)};Spacer(Modifier.height(10.dp));Text(m.title,fontSize=20.sp,fontWeight=FontWeight.Bold);Text(m.creator,color=Color.LightGray)}}}}
}
@Composable private fun RemoteMemeImage(url:String){val bitmap by produceState<android.graphics.Bitmap?>(initialValue=null,url){value=withContext(Dispatchers.IO){runCatching{URL(url).openStream().use{BitmapFactory.decodeStream(it)}}.getOrNull()}};Box(Modifier.fillMaxWidth().aspectRatio(1.4f).background(Color(0xFF182A20),RoundedCornerShape(14.dp)),contentAlignment=Alignment.Center){bitmap?.let{Image(it.asImageBitmap(),null,Modifier.fillMaxSize())}?:CircularProgressIndicator()}}
@Composable fun Winners(r:SparkdRepository){var list by remember{mutableStateOf(emptyList<Winner>())};LaunchedEffect(Unit){while(isActive){runCatching{r.winners()}.onSuccess{list=it};delay(15_000)}};LazyColumn(Modifier.padding(18.dp),verticalArrangement=Arrangement.spacedBy(12.dp)){item{Text("Hall of Winners",fontSize=30.sp,fontWeight=FontWeight.Black);Text("Weekly results and payouts.",color=Color.LightGray)};items(list){w->Surface(shape=RoundedCornerShape(18.dp)){Row(Modifier.padding(18.dp),verticalAlignment=Alignment.CenterVertically){Text(if(w.place==1)"🥇" else if(w.place==2)"🥈" else "🥉",fontSize=32.sp);Spacer(Modifier.width(12.dp));Column(Modifier.weight(1f)){Text(w.title,fontWeight=FontWeight.Bold);Text(w.creator,color=Color.LightGray)};Text("CHAMPION",color=Green)}}}}}

@Composable fun Profile(wallet:WalletSession){
 val scope=rememberCoroutineScope();val uriHandler=LocalUriHandler.current;val balances=remember{SparkdBalanceRepository()};var address by remember{mutableStateOf(wallet.address)};var status by remember{mutableStateOf<String?>(null)};var balance by remember{mutableStateOf<String?>(null)};var balanceError by remember{mutableStateOf<String?>(null)}
 LaunchedEffect(address){val owner=address;if(owner==null){balance=null;balanceError=null;return@LaunchedEffect};while(isActive){runCatching{balances.balance(owner)}.onSuccess{amount->balance=amount.setScale(2,RoundingMode.DOWN).toPlainString();balanceError=null}.onFailure{balanceError=it.message?:"Unable to load balance."};delay(15_000)}}
 LazyColumn(Modifier.padding(18.dp),verticalArrangement=Arrangement.spacedBy(14.dp)){item{Text("My SPARKD",fontSize=30.sp,fontWeight=FontWeight.Black)};item{Surface(shape=RoundedCornerShape(20.dp)){Column(Modifier.padding(20.dp)){Text("Wallet",color=Color.Gray);Text(address?:"Not connected",color=if(address==null)Gold else Green)}}};item{Surface(shape=RoundedCornerShape(20.dp),modifier=Modifier.fillMaxWidth()){Column(Modifier.padding(20.dp)){Text("SPARKD Balance",color=Color.Gray);Text(when{address==null->"Connect wallet to view";balance!=null->balance+" SPARKD";else->"Loading…"},fontSize=25.sp,fontWeight=FontWeight.Black,color=if(balance!=null)Green else Gold);balanceError?.let{Text(it,color=Color.LightGray,fontSize=12.sp)}}}};item{Button({uriHandler.openUri(SparkdBalanceRepository.BUY_URL)},modifier=Modifier.fillMaxWidth()){Text("Buy More SPARKD")}};item{OutlinedButton({if(address!=null){wallet.disconnect();address=null;status="Wallet disconnected."}else scope.launch{status="Opening your Solana wallet…";runCatching{wallet.connect()}.onSuccess{address=it;status="Wallet connected."}.onFailure{status=it.message?:"Wallet connection failed."}}},modifier=Modifier.fillMaxWidth()){Text(if(address==null)"Connect Solana Wallet" else "Disconnect Wallet")}};item{status?.let{Text(it,color=Color.LightGray)}}}
}

private fun prepareForgeSafetyImage(bytes:ByteArray):ByteArray{
 val bounds=BitmapFactory.Options().apply{inJustDecodeBounds=true}
 BitmapFactory.decodeByteArray(bytes,0,bytes.size,bounds)
 if(bounds.outWidth<=0||bounds.outHeight<=0) throw Exception("Unable to decode image for content inspection.")
 var sample=1
 while(bounds.outWidth/sample>1280||bounds.outHeight/sample>1280) sample*=2
 val options=BitmapFactory.Options().apply{inSampleSize=sample}
 val decoded=BitmapFactory.decodeByteArray(bytes,0,bytes.size,options)?:throw Exception("Unable to decode image for content inspection.")
 val maxSide=1280
 val scale=minOf(1f,maxSide.toFloat()/maxOf(decoded.width,decoded.height).toFloat())
 val resized=if(scale<1f) android.graphics.Bitmap.createScaledBitmap(decoded,(decoded.width*scale).toInt().coerceAtLeast(1),(decoded.height*scale).toInt().coerceAtLeast(1),true) else decoded
 return try{
  ByteArrayOutputStream().use{out->
   if(!resized.compress(android.graphics.Bitmap.CompressFormat.JPEG,82,out)) throw Exception("Unable to prepare image for content inspection.")
   out.toByteArray()
  }
 }finally{
  if(resized!==decoded) resized.recycle()
  decoded.recycle()
 }
}

private fun checkForgeImageSafety(bytes:ByteArray,mime:String):Pair<Boolean,String>{
 val boundary="----SPARKDAndroid"+System.currentTimeMillis()
 val url=URL("https://uxpbgzksfizkyxubctep.supabase.co/functions/v1/forge-content-safety")
 val conn=(url.openConnection() as HttpURLConnection).apply{
  requestMethod="POST"
  doOutput=true
  useCaches=false
  connectTimeout=8_000
  readTimeout=20_000
  setFixedLengthStreamingMode(bytes.size+512)
  setRequestProperty("Accept","application/json")
  setRequestProperty("Content-Type","multipart/form-data; boundary="+boundary)
 }
 try{
  conn.outputStream.buffered().use{out->
   out.write(("--"+boundary+"\r\nContent-Disposition: form-data; name=\"image\"; filename=\"forge-inspection.jpg\"\r\nContent-Type: "+mime+"\r\n\r\n").toByteArray(Charsets.UTF_8))
   out.write(bytes)
   out.write(("\r\n--"+boundary+"--\r\n").toByteArray(Charsets.UTF_8))
   out.flush()
  }
  val code=conn.responseCode
  val stream=if(code in 200..299)conn.inputStream else conn.errorStream
  val body=stream?.bufferedReader(Charsets.UTF_8)?.use{it.readText()}.orEmpty()
  if(code !in 200..299){
   val msg=try{JSONObject(body).optString("error").takeIf{it.isNotBlank()}?:"Content protection HTTP "+code}catch(_:Exception){"Content protection HTTP "+code}
   return false to msg
  }
  return try{
   val j=JSONObject(body)
   if(j.optBoolean("success")&&j.optBoolean("checked")&&j.optBoolean("safe")&&!j.optBoolean("blocked")) true to "Approved"
   else false to j.optString("reason",j.optString("error","Image did not pass content inspection."))
  }catch(e:Exception){false to "Content protection returned an invalid result."}
 }finally{
  conn.disconnect()
 }
}
