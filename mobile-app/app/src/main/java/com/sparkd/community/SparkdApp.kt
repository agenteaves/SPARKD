package com.sparkd.community
import android.graphics.BitmapFactory
import android.widget.Toast
import java.net.HttpURLConnection
import java.net.URL
import java.io.ByteArrayOutputStream
import java.math.RoundingMode
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import kotlinx.coroutines.launch
import kotlinx.coroutines.delay
import kotlinx.coroutines.isActive
import org.json.JSONObject
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.*
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
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
import androidx.compose.ui.platform.LocalUriHandler
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.IntOffset
import androidx.compose.ui.unit.sp

val Green=Color(0xFF41F16B);val Gold=Color(0xFFFFC83D);val Ink=Color(0xFF07110B);val Card=Color(0xFF102018)
internal object ForgeDraft{var src:android.graphics.Bitmap?=null;var title="";var layers:List<ForgeSticker> = emptyList();var selected:Int?=null;var safetyMessage:String?=null;var exportedPng:ByteArray?=null;var exportedRecord:ForgeDnaRecord?=null;var submissionTitle:String=""}
enum class Tab(val label:String){Home("Home"),Forge("Forge"),Contest("Contest"),Winners("Winners"),Profile("Profile")}
