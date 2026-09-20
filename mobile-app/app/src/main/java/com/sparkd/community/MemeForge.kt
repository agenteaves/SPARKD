package com.sparkd.community
import android.graphics.*
import java.io.ByteArrayOutputStream

data class ForgeSticker(val text:String,val x:Float=.5f,val y:Float=.5f,val size:Float=72f)

object MemeForge{
 fun render(source:Bitmap,top:String,bottom:String,stickers:List<ForgeSticker> = emptyList()):ByteArray{
  val size=1080
  val out=Bitmap.createBitmap(size,size,Bitmap.Config.ARGB_8888)
  val c=Canvas(out); c.drawColor(Color.BLACK)
  val crop=if(source.width>source.height) Rect((source.width-source.height)/2,0,(source.width+source.height)/2,source.height) else Rect(0,(source.height-source.width)/2,source.width,(source.height+source.width)/2)
  c.drawBitmap(source,crop,Rect(0,0,size,size),Paint(Paint.ANTI_ALIAS_FLAG))
  fun drawLabel(s:String,y:Float){
   if(s.isBlank())return
   val p=Paint(Paint.ANTI_ALIAS_FLAG).apply{color=Color.WHITE;textAlign=Paint.Align.CENTER;typeface=Typeface.DEFAULT_BOLD;textSize=72f;style=Paint.Style.FILL;setShadowLayer(10f,0f,4f,Color.BLACK)}
   c.drawText(s.uppercase().take(60),size/2f,y,p)
  }
  drawLabel(top,100f); drawLabel(bottom,1010f)
  stickers.forEach{s->
   val p=Paint(Paint.ANTI_ALIAS_FLAG).apply{color=Color.WHITE;textAlign=Paint.Align.CENTER;typeface=Typeface.DEFAULT_BOLD;textSize=s.size;setShadowLayer(8f,0f,3f,Color.BLACK)}
   c.drawText(s.text.take(80),s.x*size,s.y*size,p)
  }
  return ByteArrayOutputStream().use{out.compress(Bitmap.CompressFormat.PNG,100,it);it.toByteArray()}
 }
}
