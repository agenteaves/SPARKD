package com.sparkd.community
data class Contest(val title:String,val phase:String,val prize:String,val entries:Int)
data class Meme(val title:String,val creator:String,val votes:Int,val id:String="",val imageUrl:String?=null)
data class Winner(val place:Int,val title:String,val creator:String,val paid:Boolean)
interface SparkdRepository{
 suspend fun contest():Contest; suspend fun memes():List<Meme>; suspend fun winners():List<Winner>
}
class PreviewRepository:SparkdRepository{
 override suspend fun contest()=Contest("Meme of the Week","SUBMISSIONS OPEN","Weekly SPARKD prize",6)
 override suspend fun memes()=listOf(Meme("Monday Energy","CREATOR-A",18),Meme("Green Cape Problems","CREATOR-B",14),Meme("When The Chart Moves","CREATOR-C",11),Meme("Janitor Shift","CREATOR-D",7),Meme("Community Power","CREATOR-E",4),Meme("Fresh Meme","YOU",2))
 override suspend fun winners()=listOf(Winner(1,"Last Week Champion","CREATOR-X",true),Winner(2,"Runner Up","CREATOR-Y",true),Winner(3,"Third Place","CREATOR-Z",true))
}
