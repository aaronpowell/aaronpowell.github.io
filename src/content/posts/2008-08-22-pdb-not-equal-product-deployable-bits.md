+++
title = "PDB != Product Deployable Bits"
date = "2008-12-22"
draft = false
tags = ["generic .net", "random"]
+++

<p>
Something else I see all too often at work (although not as often as <a href="/web/20090127032545/https://www.aaron-powell.com:80/blog.aspx?id=1251" target="_blank">not understanding the difference between client and server</a>) is the existance of the PDB file on a production web server.
</p>
<p>
PDB files are automatically created from Visual Studio through the .NET compilers, so why don't they belong on the production server?
</p>
<p>
First we need to look at <strong>what is the PDB file</strong>?
</p>
<p>
The PDB, or <em>program database</em> is a file generated from the .NET compilers which contains debugging information about the generated assembly or executable.
</p>
<p>
I'm sure you've seen when you run code on your local machine and receive an exception and then a stack trace which pin-points the line of code which the error was thrown from.<br>
But when you run that same error on a production server all your stack trace states is the method.
</p>
<p>
And that's the vision of the PDB. The PDB maintains the information about where it was compiled.
</p>
<p>
So now that we know <em>what</em> is a PDB, <strong>why shouldn't it be on a production server</strong>?
</p>
<p>
You could be mistaken for thinking that the PDB is a good idea to have on a production system. After all, when ever something does go wrong on a production system you want to get all the information you can, as quickly as you can. The user who generated the error wont often be able to give you all the information you require, and your error-producing method could be very long with several locations where the error may have come from (which kind of leads back to my <a href="/web/20090127032545/https://www.aaron-powell.com:80/blog.aspx?id=1312" target="_blank">previous post on catching System.Exception</a>).
</p>
<p>
But to produce the additional information comes at a significant cost. Have you ever attached a debugger in Visual Studio onto a process? Next time you do watch the symbol loading list, or try doing it just after restarting IIS and notice the time it takes for a request just to happen. Then compare that to the first request after restarting an IIS without PDB files.
</p>
<p>
This is why PDB's don't belong on, performance. If every time a page is requested it has to load the information into memory about all the .NET components on the page that's a lot of overhead. And for the most part (or so you'd hope) the information isn't required, it's only required for the <em>worst case scenario</em>. 
</p>
<p>
<strong>But you shouldn't delete your production PDBs!</strong>
</p>
<p>
The above statement is very true, if we're deploying into a production environment we need some way to reproduce the errors that are produced there and receive the complete debugging information. This means that when deployment is done the PDB's should always be backed up, stored and backup again!<br>
The PDB is a window into the soul of the code. Without it there is no way to get the debugging information back.<br>
This is where the Microsoft Symbol Servers come into play but that's a story for another time ;)
</p>