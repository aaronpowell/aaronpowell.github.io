+++
title = "Extending Umbraco Members"
date = "2008-08-07"
tags = ["umbraco"]
draft = false
+++

<p>
Recently we've had several projects which have come through in which we are building a solution in Umbraco and the client wants to have memberships within the site.
</p>
<p>
Umbraco 3.x has a fairly neat membership system but it's a bit limited when you want to interact with the member at a code level. Because members are just specialised nodes they can quite easily have custom properties put against them, but reading them in your code is less than appealing.<br>
You've got to make sure you're reading from the correct alias, typing checking, null checking, etc.
</p>
<p>
And as I kept finding I was writing the same code over and over again for the reading and writing to the properties I thought I'd put together a small framework class.
</p>
<p>
The framework requires the following Umbraco DLL's:
</p>
<ul>
	<li>businesslogic.dll</li>
	<li>cms.dll<br>
	</li>
</ul>
<p>
So lets look at some sections of the class.
</p>
<p>
<strong>Default Properties</strong>
</p>
<p>
A member has a few default properties which are also built into the framework. There are also a few additional properties which the framework uses (such as the MembershipTypeId) which are coded in. All of the default properties are virtual so they can be overriden if so desired.
</p>
<p>
<img src="/get/media/746/umbmember01.png" width="340" height="145" alt="member01">
</p>
<p>
&nbsp;An interesting addition I have made is the <em>IsDirty</em> property. This is used later on during the Save to ensure that only members who have actually got data changed are saved back into Umbraco. This limits database hits and improves performance.
</p>
<p>
<strong>Constructors</strong>
</p>
<p>
I've found that there are 3 really useful constructors, a new member constructor and two existing member constructors.
</p>
<p>
<img src="/get/media/751/umbmember02.png" width="403" height="229" alt="member02">
</p>
<p>
What you'll notice from this is that the constructor which takes an Umbraco member is actually marked as private. This is because the framework is targetted at multi-teired applications, like MVC/ MVP where you want to keep data layers separate from the others. And by doing this you can avoid having the Umbraco DLL's included in any other project in your solution.
</p>
<p>
Next you'll notice a call to the method <em>PopulateCustomProperties</em>, this is an abstract method which you need to implement yourself to populate your own properties on a membership object.
</p>
<p>
<strong>Saving</strong>
</p>
<p>
Obviously this is an important aspect, and by default the framework already has the saving of the default properties configured.
</p>
<p>
This is also an abstract method called <em>PrepareMemberForSaving</em> which can be used for preparing an Umbraco membership object for saving to the database.
</p>
<p>
<a href="/get/media/756/umbmember03.png" target="_blank"><img src="/get/media/756/umbmember03.png" width="499" height="295" alt="umbmember03.png"></a>  
</p>
<p>
Notice the use of the IsDirty flag to ensure we're only saving what we should save.
</p>
<p>
<strong>Helper Methods</strong>
</p>
<p>
I've provided a few helper methods which can be used for the reading and writing of custom properties on the Umbraco membership object.
</p>
<p>
<img src="/get/media/761/umbmember04_499x399.jpg" width="499" height="399" alt="umbmember04.png">
</p>
<p>
The two get methods handle the null and default data checking, along with casting back to the appriate data type. Here's an example implementation:
</p>
<p>
<img src="/get/media/766/umbmember05_494x45.jpg" width="494" height="45" alt="umbmember05.png">
</p>
<p>
The save is really just a shortcut, I was sick of typing out that same command every time, to use it you would call it from the <em>PrepareMemberForSaving</em> method like so:
</p>
<p>
<img src="/get/media/771/umbmember06_499x139.jpg" width="499" height="139" alt="umbmember06.png"> 
</p>
<p>
&nbsp;
</p>
<p>
<strong>And we're done</strong>
</p>
<p>
So there you have it, a simple little class for creating a .NET implementation of an Umbraco member.
</p>
<p>
There are two downloads available, <a href="/get/media/781/member.cs.zip" target="_blank">Member.cs</a>  or a <a href="/get/media/777/aaronpowell.umbraco.dll.zip" target="_blank">compiled DLL</a>.
</p>
<p>
It will be interesting though when Umbraco 4 ships and the membership model changes to use the ASP.NET membership providers... 
</p><p></p>