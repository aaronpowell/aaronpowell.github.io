+++
title = "Are ORM's bad?"
date = "2008-12-14"
draft = false
tags = ["random", "linq-to-sql"]
+++

<p>
So an interesting <a href="http://stackoverflow.com/questions/363222/is-everyone-here-jumping-on-the-orm-band-wagon" target="_blank">post</a>  come up on <a href="http://stackoverflow.com/" target="_blank">Stack Overflow</a> (which, if you're not into you really should be) which was on the idea of ORM's and whether why are they becoming popular.
</p>
<p>
I'm a big fan of ORM's and I find that the responses in the topic are very interesting. By and large the responses from people are for ORM's, but this <a href="http://stackoverflow.com/questions/363222/is-everyone-here-jumping-on-the-orm-band-wagon#363250" target="_blank">negative response</a>  got me thinking. The author makes a very valid point that with an ORM change release for<span> minor change</span> (I use the term loosly as there's never such a thing as a minor change... EVER) result in a larger deployment than you'd likely see in a non-ORM system.
</p>
<p>
On a recent website I worked on we had several instances where we had to do entire DAL releases (which the ORM is obviously built into) just for <span>minor</span> but system-critical changes.<br>
They may have only been a handful of code lines that were updated but to get the changes released it required a lot more work. You needed to get an environment into a production-mirror state, local the appropriate label in source control, branch, make change, test, release.
</p>
<p>
Admittedly the majority of these steps <span>are required</span> each time but with a sproc change you ultimately have less dependancies, so the chance of a major fuck up is drasticly reduced.
</p>
<p>
That said, I am a huge fan of ORM's, I'm a really big fan of LINQ to SQL and I think it's possibility for use within a DAL is high (<a href="/web/20081216110256/https://www.aaron-powell.com:80/blog/july-2008/is-linq-to-sql-a-dal.aspx" target="_blank">as implied here</a>). I've used several different ORM's in my time, with different levels of code generation. I like LINQ to SQL as it doesn't actually add anything to the SQL server (<a href="/posts/2008-06-10/unit-testing-linq-to-sql" target="_blank">which also makes unit testing a snap!</a>). We had an in-house tool that we used for quite a number of years which generated .NET classes from your tables and a series of sprocs to handle most CRUD operations. It too was good, but it ultimately lead to what I believe the fundimental mistake that happens with ORM's - the spread of business logic.
</p>
<p>
Often with projects you'll have people who are really good at SQL, and you'll have people who are really good at .NET. And more often than not you'll end up with them coding their business logic into their preferred language.<br>
So you end up with some of the business logic stored in the database and the rest stored in code files.<br>
This then poses a maintenance nightmare. Depending on your security practices it may not be possible to debug the sprocs from VS, or the developer maintaining may not understand .NET as well as the original author.
</p>
<p>
I'm someone who's not great on SQL, I can get myself into and out of most trouble on a standard project, but when it comes really complex components I'd much rather write a few delegates and have my ORM handle it than try and achieve it in SQL.<br>
And any half-decent ORM should be expected to translate the code-based queries into the underlying language of choice.
</p>
<p>
ORM's are here to stay, there's no doubt about that and i believe they offer a great advantages in development time and provide a good medium for proper logic abstraction within a project. 
</p>