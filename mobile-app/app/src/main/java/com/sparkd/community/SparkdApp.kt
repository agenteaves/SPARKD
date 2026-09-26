package com.sparkd.community

import kotlinx.coroutines.delay
import kotlinx.coroutines.isActive
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.*
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

val Green=Color(0xFF41F16B);val Gold=Color(0xFFFFC83D);val Ink=Color(0xFF07110B);val Card=Color(0xFF102018)
internal object ForgeDraft{var src:android.graphics.Bitmap?=null;var title="";var layers:List<ForgeSticker> = emptyList();var selected:Int?=null;var safetyMessage:String?=null;var exportedPng:ByteArray?=null;var exportedRecord:ForgeDnaRecord?=null;var submissionTitle:String=""}
enum class Tab(val label:String){Home("Home"),Forge("Forge"),Contest("Contest"),Winners("Winners"),Profile("Profile")}

@Composable fun SparkdApp(wallet:WalletSession){
 MaterialTheme(colorScheme=darkColorScheme(primary=Green,secondary=Gold,background=Ink,surface=Card)){
  var tab by remember{mutableStateOf(Tab.Home)};val repo=remember{LiveRepository()}
  Scaffold(topBar={Header()},bottomBar={NavigationBar(containerColor=Color(0xFF09160E)){Tab.entries.forEach{t->NavigationBarItem(selected=tab==t,onClick={tab=t},icon={Icon(when(t){Tab.Home->Icons.Default.Home;Tab.Forge->Icons.Default.Edit;Tab.Contest->Icons.Default.EmojiEvents;Tab.Winners->Icons.Default.WorkspacePremium;Tab.Profile->Icons.Default.Person},t.label)},label={Text(t.label)})}}}){p->
   Box(Modifier.padding(p).fillMaxSize()){when(tab){Tab.Home->Home(repo){tab=it};Tab.Forge->Forge(wallet);Tab.Contest->Contest(repo);Tab.Winners->Winners(repo);Tab.Profile->Profile(wallet)}}
  }
 }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable fun Header(){TopAppBar(title={Row(verticalAlignment=Alignment.CenterVertically){Text("⚡",fontSize=26.sp);Spacer(Modifier.width(8.dp));Column{Text("SPARKD",fontWeight=FontWeight.Black);Text("COMMUNITY APP",fontSize=10.sp,color=Gold)}}},colors=TopAppBarDefaults.topAppBarColors(containerColor=Color(0xFF09160E)))}

@Composable fun Home(r:SparkdRepository,go:(Tab)->Unit){var c by remember{mutableStateOf<Contest?>(null)};LaunchedEffect(Unit){while(isActive){runCatching{r.contest()}.onSuccess{c=it};delay(15_000)}};LazyColumn(Modifier.padding(18.dp),verticalArrangement=Arrangement.spacedBy(14.dp)){item{Text("Create. Enter. Vote. Win.",fontSize=29.sp,fontWeight=FontWeight.Black);Text("SPARKD built for your phone.",color=Color.LightGray)};item{c?.let{Surface(shape=androidx.compose.foundation.shape.RoundedCornerShape(22.dp)){Column(Modifier.padding(20.dp)){Text(it.phase,color=Green,fontWeight=FontWeight.Bold);Text(it.title,fontSize=25.sp,fontWeight=FontWeight.Black);Text(it.prize,color=Gold);Text(it.entries.toString()+" contenders")}}}};item{Row(horizontalArrangement=Arrangement.spacedBy(10.dp)){Button({go(Tab.Forge)},Modifier.weight(1f).height(70.dp)){Text("🔥 Forge")};Button({go(Tab.Contest)},Modifier.weight(1f).height(70.dp)){Text("🗳 Vote")}}}}}
