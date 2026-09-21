package com.sparkd.community
data class Contest(val title:String,val phase:String,val prize:String,val entries:Int,val id:String="")
data class Meme(val title:String,val creator:String,val votes:Int,val id:String="",val imageUrl:String?=null)
data class Winner(val place:Int,val title:String,val creator:String,val paid:Boolean)
interface SparkdRepository{
 suspend fun contest():Contest; suspend fun memes():List<Meme>; suspend fun winners():List<Winner>
}
