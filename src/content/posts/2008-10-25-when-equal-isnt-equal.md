+++
title = "When == isn't equal"
date = "2008-10-25"
draft = false
tags = ["ajax", "javascript"]
+++

<p>
Earlier this month I did a post about <a href="/posts/2008-10-06-the-difference-between-client-and-server" target="_blank">common mistakes made by developers new to JavaScript</a> but there's a point I forgot to cover which I see a lot of.
</p>
<p>
Nearly every language has a different way in which it handles equality. SQL has a single equal sign ala:
</p>
<pre><span class="keyword">SELECT</span> [COLUMN1]
<span class="keyword">FROM</span> [Table]
<span class="keyword">WHERE</span> [COLUMN2] = <span class="string">'some value'</span>
</pre>
<p>
Or you have compiled languages like C# which use ==:
</p>
<pre>if(someValue == someOtherValue){
}
</pre>
<p>
Or for some wierd reason LINQ uses the keyword <strong>equal</strong> when it does join operations...
</p>
<p>
And then we get to JavaScript. JavaScript actually has 2 equality comparison, == and === (the same exists for inequality in != and !==), but why?<br>
You need to remember that JavaScript is an loosly typed language, you don't define a variable type, you define it by the the assignment. This also means you can retype a variable during its life.
</p>
<p>
So what's the got to do with the equality operators? Well the choice of equality comparison depends how strongly checked you want to make your comparison.<br>
Say what?
</p>
<p>
Well, == compares the values at a primitive level, regardless of their types, where as === also does a type comparison. Take the following example:
</p>
<pre><span class="keyword">var</span> someValue = 1;
alert(someValue == <span class="string">'1'</span>);
alert(someValue === <span class="string">'1'</span>);
</pre>
<p>
<strike>Both alerts will show <em>true</em>, but in the first alert we're comparing a number to a string. That's likely to be a problem if you're comparing two variables! It's a good way to get <em>unexpected behavior</em> from your JavaScript.<br>
</strike>
As Ruben has correctly pointed out below the first alert shows true and the second shows false (note - don't blog while watching TV, you tend to not pay attention :P). Because we are comparing a number to a string we generally do not want it to be true. This is most commonly noticed when comparing two variables and can lead to unexpected behavior during script execution.
</p>
<p>
So should you ever use an untyped equality comparison? Well yes if the type of whats being compared is either a) definitely known (ie - prechecked) b) not going to have bearing on the continued operation of the script.
</p>
<p>
Well there's something to keep in mind the next time you think JavaScript is out to get you with unexpected operation. 
</p>