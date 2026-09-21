package com.sparkd.community
import android.graphics.*
import java.io.ByteArrayOutputStream

data class ForgeSticker(val text:String,val x:Float=.5f,val y:Float=.5f,val size:Float=72f,val color:Int=Color.WHITE)

object MemeForge{
 fun render(source:Bitmap,top:String,bottom:String,stickers:List<ForgeSticker> = emptyList()):ByteArray{
  val size=1080
  val out=Bitmap.createBitmap(size,size,Bitmap.Config.ARGB_8888)
  val c=Canvas(out); c.drawColor(Color.BLACK)

  // Fit the entire uploaded image inside the square Forge canvas.
  // Do not center-crop: portrait and landscape images must remain fully visible.
  val scale=minOf(
   size.toFloat()/source.width.toFloat(),
   size.toFloat()/source.height.toFloat()
  )
  val drawWidth=source.width*scale
  val drawHeight=source.height*scale
  val left=(size-drawWidth)/2f
  val topOffset=(size-drawHeight)/2f
  val destination=RectF(left,topOffset,left+drawWidth,topOffset+drawHeight)
  c.drawBitmap(source,null,destination,Paint(Paint.ANTI_ALIAS_FLAG or Paint.FILTER_BITMAP_FLAG))
  fun drawLabel(s:String,y:Float){
   if(s.isBlank())return
   val p=Paint(Paint.ANTI_ALIAS_FLAG).apply{color=Color.WHITE;textAlign=Paint.Align.CENTER;typeface=Typeface.DEFAULT_BOLD;textSize=72f;style=Paint.Style.FILL;setShadowLayer(10f,0f,4f,Color.BLACK)}
   c.drawText(s.uppercase().take(60),size/2f,y,p)
  }
  drawLabel(top,100f); drawLabel(bottom,1010f)
  stickers.forEach{s->
   val p=Paint(Paint.ANTI_ALIAS_FLAG).apply{color=s.color;textAlign=Paint.Align.CENTER;typeface=Typeface.DEFAULT_BOLD;textSize=s.size;setShadowLayer(8f,0f,3f,Color.BLACK)}
   c.drawText(s.text.take(80),s.x*size,s.y*size,p)
  }
  return ByteArrayOutputStream().use{out.compress(Bitmap.CompressFormat.PNG,100,it);it.toByteArray()}
 }
}
