package com.sparkd.community
import android.graphics.BitmapFactory
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
 var src by remember{mutableStateOf<android.graphics.Bitmap?>(null)}
 var top by remember{mutableStateOf("")};var bottom by remember{mutableStateOf("")};var custom by remember{mutableStateOf("")}
 var layers by remember{mutableStateOf(listOf<ForgeSticker>())};var selected by remember{mutableStateOf<Int?>(null)};var png by remember{mutableStateOf<ByteArray?>(null)}
 var canvasPx by remember{mutableStateOf(1f)}
 val emojis=listOf("😂","🤣","🔥","⚡","💀","❤️","😎","🤡","👀","🚀","💎","🤑")
 val pick=rememberLauncherForActivityResult(ActivityResultContracts.GetContent()){u->u?.let{ctx.contentResolver.openInputStream(it)?.use{x->src=BitmapFactory.decodeStream(x)}}}
 LaunchedEffect(src,top,bottom,layers){png=src?.let{MemeForge.render(it,top,bottom,layers)}}
 LazyColumn(Modifier.padding(18.dp),verticalArrangement=Arrangement.spacedBy(12.dp)){
  item{Text("Meme Forge",fontSize=30.sp,fontWeight=FontWeight.Black);Text("Tap a layer, drag it where you want it, then resize it below.",color=Color.LightGray)}
  item{OutlinedButton({pick.launch("image/*")},Modifier.fillMaxWidth()){Text("Choose image")}}
  png?.let{b->item{
   Box(Modifier.fillMaxWidth().aspectRatio(1f).onSizeChanged{canvasPx=it.width.toFloat().coerceAtLeast(1f)}){
    Image(BitmapFactory.decodeByteArray(b,0,b.size).asImageBitmap(),null,Modifier.fillMaxSize())
    layers.forEachIndexed{i,l->
     Box(Modifier.fillMaxSize().pointerInput(i,l,layers){
      detectDragGestures(onDragStart={selected=i}){change,drag->
       change.consume();val n=layers.toMutableList();val cur=n[i]
       n[i]=cur.copy(x=(cur.x+drag.x/canvasPx).coerceIn(.04f,.96f),y=(cur.y+drag.y/canvasPx).coerceIn(.06f,.94f));layers=n
      }
     }){
      Text(l.text,fontSize=(l.size/3f).coerceIn(18f,48f).sp,fontWeight=FontWeight.Black,color=if(selected==i) Gold else Color.Transparent,
       modifier=Modifier.offset(x=((l.x-.5f)*canvasPx).dp,y=((l.y-.5f)*canvasPx).dp).align(Alignment.Center))
     }
    }
   }
  }}
  item{OutlinedTextField(top,{top=it},label={Text("Top text")},modifier=Modifier.fillMaxWidth())}
  item{OutlinedTextField(bottom,{bottom=it},label={Text("Bottom text")},modifier=Modifier.fillMaxWidth())}
  item{Text("Add text",fontWeight=FontWeight.Bold);Row(verticalAlignment=Alignment.CenterVertically){OutlinedTextField(custom,{custom=it},label={Text("Text layer")},modifier=Modifier.weight(1f));Spacer(Modifier.width(8.dp));Button({if(custom.isNotBlank()){layers=layers+ForgeSticker(custom);selected=layers.lastIndex;custom=""}}){Text("Add")}}}
  item{Text("Add emoji",fontWeight=FontWeight.Bold);LazyRow(horizontalArrangement=Arrangement.spacedBy(8.dp)){items(emojis){e->AssistChip(onClick={layers=layers+ForgeSticker(e);selected=layers.lastIndex},label={Text(e,fontSize=24.sp)})}}}
  if(layers.isNotEmpty()) item{
   Text("Layers",fontWeight=FontWeight.Bold)
   layers.forEachIndexed{i,l->Row(Modifier.fillMaxWidth(),verticalAlignment=Alignment.CenterVertically){TextButton({selected=i},Modifier.weight(1f)){Text((if(selected==i)"✓ " else "")+l.text,fontSize=18.sp)};TextButton({layers=layers.toMutableList().also{it.removeAt(i)};selected=null}){Text("Delete")}}}
   selected?.takeIf{it in layers.indices}?.let{i->val l=layers[i];Text("Size: "+l.size.toInt());Slider(value=l.size,onValueChange={v->val n=layers.toMutableList();n[i]=n[i].copy(size=v);layers=n},valueRange=36f..180f)}
   Row(horizontalArrangement=Arrangement.spacedBy(8.dp)){OutlinedButton({selected?.let{i->if(i in layers.indices){val n=layers.toMutableList();n[i]=n[i].copy(x=.5f,y=.5f);layers=n}}},Modifier.weight(1f)){Text("Center")};OutlinedButton({layers=emptyList();selected=null},Modifier.weight(1f)){Text("Clear")}}
  }
  item{Text("The preview is the flattened 1080×1080 PNG. Dragged positions and sizes are baked into that image.",color=Color.LightGray,fontSize=12.sp)}
  item{Button({},enabled=false,modifier=Modifier.fillMaxWidth()){Text("Enter Meme of the Week")}}
  item{Notice()}
 }
}
@Composable fun Contest(r:SparkdRepository){var list by remember{mutableStateOf(emptyList<Meme>())};LaunchedEffect(Unit){list=r.memes()};LazyColumn(Modifier.padding(18.dp),verticalArrangement=Arrangement.spacedBy(12.dp)){item{Text("This Week's Contenders",fontSize=27.sp,fontWeight=FontWeight.Black);Text("Voting layout preview",color=Gold)};items(list){m->Surface(shape=RoundedCornerShape(20.dp)){Column(Modifier.padding(16.dp)){Box(Modifier.fillMaxWidth().aspectRatio(1.4f).background(Color(0xFF182A20),RoundedCornerShape(14.dp)),contentAlignment=Alignment.Center){Text("MEME PREVIEW",color=Color.Gray)};Spacer(Modifier.height(10.dp));Text(m.title,fontSize=20.sp,fontWeight=FontWeight.Bold);Text(m.creator,color=Color.LightGray);Button({},enabled=false,modifier=Modifier.fillMaxWidth()){Text("🗳 Vote")}}}}}}
@Composable fun Winners(r:SparkdRepository){var list by remember{mutableStateOf(emptyList<Winner>())};LaunchedEffect(Unit){list=r.winners()};LazyColumn(Modifier.padding(18.dp),verticalArrangement=Arrangement.spacedBy(12.dp)){item{Text("Hall of Winners",fontSize=30.sp,fontWeight=FontWeight.Black);Text("Weekly results and payouts.",color=Color.LightGray)};items(list){w->Surface(shape=RoundedCornerShape(18.dp)){Row(Modifier.padding(18.dp),verticalAlignment=Alignment.CenterVertically){Text(if(w.place==1)"🥇" else if(w.place==2)"🥈" else "🥉",fontSize=32.sp);Spacer(Modifier.width(12.dp));Column(Modifier.weight(1f)){Text(w.title,fontWeight=FontWeight.Bold);Text(w.creator,color=Color.LightGray)};Text(if(w.paid)"PAID ✓" else "PENDING",color=Green)}}}}}
@Composable fun Profile(){Column(Modifier.padding(18.dp),verticalArrangement=Arrangement.spacedBy(14.dp)){Text("My SPARKD",fontSize=30.sp,fontWeight=FontWeight.Black);Surface(shape=RoundedCornerShape(20.dp)){Column(Modifier.padding(20.dp)){Text("Creator ID",color=Color.Gray);Text("PREVIEW-CREATOR",fontWeight=FontWeight.Bold);Spacer(Modifier.height(12.dp));Text("Wallet",color=Color.Gray);Text("Not connected",color=Gold)}};OutlinedButton({},enabled=false,modifier=Modifier.fillMaxWidth()){Text("Connect Phantom Wallet")};Notice()}}
@Composable fun Notice(){Surface(color=Color(0xFF30280B),shape=RoundedCornerShape(16.dp)){Text("🛡 Preview mode — intentionally disconnected from production contests.",Modifier.padding(14.dp),color=Gold,fontWeight=FontWeight.Bold)}}
