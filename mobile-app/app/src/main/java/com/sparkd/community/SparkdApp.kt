package com.sparkd.community
import android.graphics.BitmapFactory
import android.widget.Toast
import java.net.HttpURLConnection
import java.net.URL
import java.io.ByteArrayOutputStream
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import kotlinx.coroutines.launch
import org.json.JSONObject
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.*
import androidx.compose.foundation.gestures.detectDragGestures
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.layout.onSizeChanged
import androidx.compose.ui.geometry.Offset
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.*
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.IntOffset
import androidx.compose.ui.unit.sp

val Green=Color(0xFF41F16B);val Gold=Color(0xFFFFC83D);val Ink=Color(0xFF07110B);val Card=Color(0xFF102018)
enum class Tab(val label:String){Home("Home"),Forge("Forge"),Contest("Contest"),Winners("Winners"),Profile("Profile")}
@Composable fun SparkdApp(){
 MaterialTheme(colorScheme=darkColorScheme(primary=Green,secondary=Gold,background=Ink,surface=Card)){
  var tab by remember{mutableStateOf(Tab.Home)};val repo=remember{PreviewRepository()}
  Scaffold(topBar={Header()},bottomBar={NavigationBar(containerColor=Color(0xFF09160E)){Tab.entries.forEach{t->NavigationBarItem(selected=tab==t,onClick={tab=t},icon={Icon(when(t){Tab.Home->Icons.Default.Home;Tab.Forge->Icons.Default.Edit;Tab.Contest->Icons.Default.EmojiEvents;Tab.Winners->Icons.Default.WorkspacePremium;Tab.Profile->Icons.Default.Person},t.label)},label={Text(t.label)})}}}){p->
   Box(Modifier.padding(p).fillMaxSize()){when(tab){Tab.Home->Home(repo){tab=it};Tab.Forge->Forge();Tab.Contest->Contest(repo);Tab.Winners->Winners(repo);Tab.Profile->Profile()}}
  }
 }
}
@OptIn(ExperimentalMaterial3Api::class) @Composable fun Header(){TopAppBar(title={Row(verticalAlignment=Alignment.CenterVertically){Text("⚡",fontSize=26.sp);Spacer(Modifier.width(8.dp));Column{Text("SPARKD",fontWeight=FontWeight.Black);Text("COMMUNITY APP • PREVIEW",fontSize=10.sp,color=Gold)}}},colors=TopAppBarDefaults.topAppBarColors(containerColor=Color(0xFF09160E)))}
@Composable fun Home(r:SparkdRepository,go:(Tab)->Unit){var c by remember{mutableStateOf<Contest?>(null)};LaunchedEffect(Unit){c=r.contest()};LazyColumn(Modifier.padding(18.dp),verticalArrangement=Arrangement.spacedBy(14.dp)){item{Text("Create. Enter. Vote. Win.",fontSize=29.sp,fontWeight=FontWeight.Black);Text("SPARKD built for your phone.",color=Color.LightGray)};item{c?.let{Surface(shape=RoundedCornerShape(22.dp)){Column(Modifier.padding(20.dp)){Text(it.phase,color=Green,fontWeight=FontWeight.Bold);Text(it.title,fontSize=25.sp,fontWeight=FontWeight.Black);Text(it.prize,color=Gold);Text(it.entries.toString()+" contenders")}}}};item{Row(horizontalArrangement=Arrangement.spacedBy(10.dp)){Button({go(Tab.Forge)},Modifier.weight(1f).height(70.dp)){Text("🔥 Forge")};Button({go(Tab.Contest)},Modifier.weight(1f).height(70.dp)){Text("🗳 Vote")}}};item{Notice()}}}
@Composable fun Forge(){
 val ctx=LocalContext.current
 var src by remember{mutableStateOf<android.graphics.Bitmap?>(null)};var title by remember{mutableStateOf("")};var layers by remember{mutableStateOf(listOf<ForgeSticker>())}
 var selected by remember{mutableStateOf<Int?>(null)};var png by remember{mutableStateOf<ByteArray?>(null)};var canvasPx by remember{mutableStateOf(1f)}
 var textPopup by remember{mutableStateOf(false)};var emojiPopup by remember{mutableStateOf(false)};var newText by remember{mutableStateOf("")}
 var safetyChecking by remember{mutableStateOf(false)};var safetyMessage by remember{mutableStateOf<String?>(null)}
 val emojis=listOf("😀","😃","😄","😁","😂","🤣","😊","😍","🥰","😘","😎","🤓","🧐","🤔","🙄","😏","😬","😭","😡","🤬","😱","🤯","🥳","🤡","👻","💀","👽","🤖","😈","💩","🔥","⚡","✨","💥","💯","❤️","💔","💚","💛","💙","💜","👀","👑","💎","🚀","🤑","💰","🪙","🏆","🥇","🎉","🎊","👍","👎","👏","🙌","🙏","💪","🤝","✌️","🤘","🫡","👉","👈","☝️","🐸","🐶","🐱","🦍","🦁","🐐","🦖","🦅","🍕","🍔","🌮","🍺","☕","🎮","🎯","🎲","⚽","🏀","🏈","🚗","🏎️","🌎","🌙","☀️","⭐","🚨","⚠️","✅","❌","❓","‼️","📈","📉","🔒","🔓")
 val pick=rememberLauncherForActivityResult(ActivityResultContracts.GetContent()){u->
  if(u!=null){safetyChecking=true;safetyMessage="🛡 Inspecting image before opening Forge..."
   kotlinx.coroutines.CoroutineScope(kotlinx.coroutines.Dispatchers.Main).launch{
    try{
     val bytes=withContext(Dispatchers.IO){ctx.contentResolver.openInputStream(u)?.use{it.readBytes()}?:throw Exception("Unable to read image.")}
     val mime=ctx.contentResolver.getType(u)?:"image/jpeg"
     val result=withContext(Dispatchers.IO){checkForgeImageSafety(bytes,mime)}
     if(result.first){src=BitmapFactory.decodeByteArray(bytes,0,bytes.size);layers=emptyList();selected=null;safetyMessage="✅ Image passed content inspection."}
     else{safetyMessage="🚫 "+result.second;Toast.makeText(ctx,result.second,Toast.LENGTH_LONG).show()}
    }catch(e:Exception){safetyMessage="🚫 Content protection could not verify this image.";Toast.makeText(ctx,"Image blocked: content inspection unavailable.",Toast.LENGTH_LONG).show()}
    finally{safetyChecking=false}
   }
  }
 }
 LaunchedEffect(src,layers){png=src?.let{MemeForge.render(it,"","",layers)}}
 if(textPopup) AlertDialog(onDismissRequest={textPopup=false},title={Text("Add text")},text={OutlinedTextField(newText,{newText=it},label={Text("Text")})},confirmButton={Button({if(newText.isNotBlank()){layers=layers+ForgeSticker(newText);selected=layers.lastIndex;newText=""};textPopup=false}){Text("Add")}},dismissButton={TextButton({textPopup=false}){Text("Cancel")}})
 if(emojiPopup) AlertDialog(onDismissRequest={emojiPopup=false},title={Text("Choose emoji")},text={LazyRow(horizontalArrangement=Arrangement.spacedBy(8.dp)){items(emojis){e->AssistChip(onClick={layers=layers+ForgeSticker(e);selected=layers.lastIndex;emojiPopup=false},label={Text(e,fontSize=26.sp)})}}},confirmButton={TextButton({emojiPopup=false}){Text("Close")}})
 LazyColumn(Modifier.padding(18.dp),verticalArrangement=Arrangement.spacedBy(12.dp)){
  item{Text("Meme Forge",fontSize=30.sp,fontWeight=FontWeight.Black);Text("Create the meme directly on the image.",color=Color.LightGray)}
  item{OutlinedTextField(title,{title=it},label={Text("Meme title")},modifier=Modifier.fillMaxWidth(),singleLine=true)}
  item{OutlinedButton({if(!safetyChecking)pick.launch("image/*")},Modifier.fillMaxWidth(),enabled=!safetyChecking){Text(if(safetyChecking)"Inspecting image..." else "Choose image")}}
  safetyMessage?.let{m->item{Text(m,color=if(m.startsWith("✅"))Green else if(m.startsWith("🚫"))Gold else Color.LightGray,fontSize=12.sp)}}
  png?.let{b->item{Box(Modifier.fillMaxWidth().aspectRatio(1f).onSizeChanged{canvasPx=it.width.toFloat().coerceAtLeast(1f)}){
   // MemeForge.render() already paints every text/emoji layer into this bitmap.
   // Use transparent gesture handles here so the editor does not draw each layer a second time.
   Image(BitmapFactory.decodeByteArray(b,0,b.size).asImageBitmap(),null,Modifier.fillMaxSize())
   layers.forEachIndexed{i,l->
    Box(Modifier.align(Alignment.TopStart).offset{IntOffset((l.x*canvasPx-60).toInt(),(l.y*canvasPx-60).toInt())}.size(120.dp).pointerInput(i){
     detectDragGestures(onDragStart={selected=i}){change,drag->change.consume();if(i<layers.size){val n=layers.toMutableList();val cur=n[i];n[i]=cur.copy(x=(cur.x+drag.x/canvasPx).coerceIn(.05f,.95f),y=(cur.y+drag.y/canvasPx).coerceIn(.05f,.95f));layers=n}}
    },contentAlignment=Alignment.Center){
     if(selected==i) Box(Modifier.size(112.dp).border(2.dp,Gold,RoundedCornerShape(10.dp)))
    }
   }
  }}}
  item{Row(horizontalArrangement=Arrangement.spacedBy(8.dp)){Button({textPopup=true},Modifier.weight(1f)){Text("＋ Text")};Button({emojiPopup=true},Modifier.weight(1f)){Text("😀 Emoji")}}}
  selected?.takeIf{it in layers.indices}?.let{i->item{Surface(shape=RoundedCornerShape(16.dp)){Column(Modifier.padding(14.dp)){Text("Selected: "+layers[i].text,fontWeight=FontWeight.Bold);Text("Resize");Slider(value=layers[i].size,onValueChange={v->if(i<layers.size){val n=layers.toMutableList();n[i]=n[i].copy(size=v);layers=n}},valueRange=36f..180f);Row(horizontalArrangement=Arrangement.spacedBy(8.dp)){OutlinedButton({if(i<layers.size){val n=layers.toMutableList();n[i]=n[i].copy(x=.5f,y=.5f);layers=n}},Modifier.weight(1f)){Text("Center")};OutlinedButton({if(i<layers.size){layers=layers.toMutableList().also{it.removeAt(i)};selected=null}},Modifier.weight(1f)){Text("Delete")}}}}}}
  if(layers.isNotEmpty()) item{Text("Tip: drag the text or emoji directly on the image. Tap a layer below to select it.",color=Color.LightGray,fontSize=12.sp);LazyRow(horizontalArrangement=Arrangement.spacedBy(6.dp)){items(layers.size){i->AssistChip(onClick={selected=i},label={Text(layers[i].text)})}}}
  item{Button({},enabled=false,modifier=Modifier.fillMaxWidth()){Text("Enter Meme of the Week")}}
  item{Notice()}
 }
}
@Composable fun Contest(r:SparkdRepository){var list by remember{mutableStateOf(emptyList<Meme>())};LaunchedEffect(Unit){list=r.memes()};LazyColumn(Modifier.padding(18.dp),verticalArrangement=Arrangement.spacedBy(12.dp)){item{Text("This Week's Contenders",fontSize=27.sp,fontWeight=FontWeight.Black);Text("Voting layout preview",color=Gold)};items(list){m->Surface(shape=RoundedCornerShape(20.dp)){Column(Modifier.padding(16.dp)){Box(Modifier.fillMaxWidth().aspectRatio(1.4f).background(Color(0xFF182A20),RoundedCornerShape(14.dp)),contentAlignment=Alignment.Center){Text("MEME PREVIEW",color=Color.Gray)};Spacer(Modifier.height(10.dp));Text(m.title,fontSize=20.sp,fontWeight=FontWeight.Bold);Text(m.creator,color=Color.LightGray);Button({},enabled=false,modifier=Modifier.fillMaxWidth()){Text("🗳 Vote")}}}}}}
@Composable fun Winners(r:SparkdRepository){var list by remember{mutableStateOf(emptyList<Winner>())};LaunchedEffect(Unit){list=r.winners()};LazyColumn(Modifier.padding(18.dp),verticalArrangement=Arrangement.spacedBy(12.dp)){item{Text("Hall of Winners",fontSize=30.sp,fontWeight=FontWeight.Black);Text("Weekly results and payouts.",color=Color.LightGray)};items(list){w->Surface(shape=RoundedCornerShape(18.dp)){Row(Modifier.padding(18.dp),verticalAlignment=Alignment.CenterVertically){Text(if(w.place==1)"🥇" else if(w.place==2)"🥈" else "🥉",fontSize=32.sp);Spacer(Modifier.width(12.dp));Column(Modifier.weight(1f)){Text(w.title,fontWeight=FontWeight.Bold);Text(w.creator,color=Color.LightGray)};Text(if(w.paid)"PAID ✓" else "PENDING",color=Green)}}}}}
@Composable fun Profile(){Column(Modifier.padding(18.dp),verticalArrangement=Arrangement.spacedBy(14.dp)){Text("My SPARKD",fontSize=30.sp,fontWeight=FontWeight.Black);Surface(shape=RoundedCornerShape(20.dp)){Column(Modifier.padding(20.dp)){Text("Creator ID",color=Color.Gray);Text("PREVIEW-CREATOR",fontWeight=FontWeight.Bold);Spacer(Modifier.height(12.dp));Text("Wallet",color=Color.Gray);Text("Not connected",color=Gold)}};OutlinedButton({},enabled=false,modifier=Modifier.fillMaxWidth()){Text("Connect Phantom Wallet")};Notice()}}
@Composable fun Notice(){Surface(color=Color(0xFF30280B),shape=RoundedCornerShape(16.dp)){Text("🛡 Preview mode — intentionally disconnected from production contests.",Modifier.padding(14.dp),color=Gold,fontWeight=FontWeight.Bold)}}

private fun checkForgeImageSafety(bytes:ByteArray,mime:String):Pair<Boolean,String>{
 val boundary="----SPARKDAndroid"+System.currentTimeMillis()
 val conn=(URL("https://uxpbgzksfizkyxubctep.supabase.co/functions/v1/forge-content-safety").openConnection() as HttpURLConnection).apply{
  requestMethod="POST";doOutput=true;connectTimeout=20000;readTimeout=30000
  setRequestProperty("Content-Type","multipart/form-data; boundary=$boundary")
 }
 conn.outputStream.use{out->
  out.write(("--$boundary\r\nContent-Disposition: form-data; name=\"image\"; filename=\"forge-upload\"\r\nContent-Type: $mime\r\n\r\n").toByteArray())
  out.write(bytes);out.write(("\r\n--$boundary--\r\n").toByteArray())
 }
 val code=conn.responseCode
 val stream=if(code in 200..299)conn.inputStream else conn.errorStream
 val body=stream?.bufferedReader()?.use{it.readText()}.orEmpty()
 if(code !in 200..299)return false to "Content protection could not verify this image."
 return try{val j=JSONObject(body);if(j.optBoolean("success")&&j.optBoolean("checked")&&j.optBoolean("safe")&&!j.optBoolean("blocked"))true to "Approved" else false to j.optString("reason",j.optString("error","Image did not pass content inspection."))}catch(_:Exception){false to "Content protection returned an invalid result."}
}
