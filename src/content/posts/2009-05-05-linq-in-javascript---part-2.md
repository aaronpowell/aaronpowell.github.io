+++
title = "LINQ in JavaScript - part 2"
date = "2009-05-05T08:43:05.0000000Z"
tags = ["LINQ","JavaScript"]
draft = false
+++

<p>Recently I did a blog post on my implementation of <a href="/blog/april-2009/linq-in-javascript.aspx" target="_blank">LINQ in JavaScript</a>&nbsp;which was just talking about a little project I was working on to produce a LINQ-style API within JavaScript.</p>
<p>I had planned to release the source code in that post but due to a problem with my blogs Umbraco install I was unable to.<br />Well I've finally got around to fixing the media section and now I can provide the code.</p>
<p>I've done a few tweaks within LINQ in JavaScript, and I've added a couple of new operators, <strong>Skip</strong>, <strong>SkipWhile</strong> and <strong>Take</strong>, all providing the same functionality that their .NET counterparts provide.</p>
<p>Lets have a look at the way some of the code works, we'll look at the <strong>where</strong> method:</p>
<pre class="brush: js">Array.prototype.where = function(fn) {
    if (typeof (fn) !== typeof (Function)) throw Error.argumentType("fn", typeof (fn), typeof (Function), "where takes a function to filter on");
    var coll = new Array();
    for (var i = 0; i &lt; this.length; i++) {
        var ret = fn(this[i]);
        if (typeof (ret) !== "boolean") throw Error.argumentType("fn", typeof (ret), typeof (Boolean), "function provided to where much return bool");
        else if (ret) coll.push(this[i]);
    }
    return coll;
}

</pre>
<p>First off you'll notice that I expect a function to be passed into the method, otherwise how would you apply a where?! As you'll notice I'm doing a lot of type checking as well, the parameter for Where needs to be a function, so I explicitly check it so.<br />Then it's really just a simple itterator that is used, and pushing each item into a new collection where the provided function returns a boolean value of true.<br />Again you'll notice type checking, this time of the return value of the function. Because JavaScript isn't compiled, and there is no type checking I have to do it manually (this means that I'm doing a traditional LINQ API, not one where you can return anything you like, ala <a href="http://community.bartdesmet.net/blogs/bart/archive/2008/09/14/who-ever-said-linq-predicates-need-to-be-boolean-valued.aspx" target="_blank">this post</a>). Not a big problem, but it does add a little overhead.<br />Sure you can remove it but then it kind-of defeats what I'm trying to achieve, which is a very type-safe API.</p>
<p>&nbsp;</p>
<p>Ultimately LINQ in JavaScript is nothing more than throught experiment project. It shows that you can quite easily have a client side query language using JavaScript and functional programming.<br />But I <strong>don't recommend that anyone acutally use it</strong>. If you're using a client-side query API such as this (or any of the other LINQ implementations for JavaScript) you're <em>doing it wrong</em>. Particularly operators like where, skip, take and even select. These operators are designed to lower/ change the data volume you are working with, which on the client side is not a good idea. It means that you've returned too much data from the server!<br />I see the only real useful reason for this (other than just wanting to prove it can be done) is to manipulate a DOM structure, say client-side reordering of a table.</p>
<p>But that said anyone who's interested in seeing how it works and having a play yourself you can find the code <a href="/get/media/2460/linqinjavascript.js" target="_blank">here</a>.</p>