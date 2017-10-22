+++
title = "LINQ in JavaScript"
date = "2009-04-20T12:40:03.0000000Z"
tags = ["LINQ","AJAX","JavaScript"]
draft = false
+++

<p><em>Let me start by saying that I <strong>am</strong> aware that there is a </em><a href="http://jslinq.codeplex.com/" target="_blank"><em>LINQ to JavaScript project on Codeplex</em></a><em>&nbsp;but this was done by me are more of an achidemic exercise/ challange.</em></p>
<p>So while I've been working on LINQ to Umbraco I've also been spending some time doing AJAX-y stuff, and I have been having a lot of fun playing with JavaScript.<br />And then one day I was thinking about how I would go about manipulating a collection entirely client-side, and realised that loops are ultimately the only way to go about it. Well that's all well and good, but if you want to do a lot of collection manipulation there's not a really good way to go about it (or at least, a really good way from a .NET developer point of view :P).</p>
<p>And after all, what <em>is</em> LINQ? LINQ really just is a way in which you can do pesudo-dynamic programming in a static language (as Lambda is heavily derived from dynamic languages). So shouldn't it be possible to do in a dynamic language?</p>
<p>So I whipped out my copy of Visual Studio and got coding away, and here's an end-line of code entirely in JavaScript:</p>
<pre class="brush: js">array.where(function(item) { return item.property === "something"; }).orderBy().groupBy(function(item) { return item.value; });</pre>
<p>&nbsp;Lovely isn't it.</p>
<p>But before I get into some of the stuff I do, let me explain why my approach is different to the JSLINQ project on Codeplex.<br />Now I mean no disrespect to&nbsp;Chris, but there are a few things which I don't like about his approach, and which<em> kind </em>of go against the LINQ pattern.</p>
<p>First off JSLINQ requires that you create a new object which you pass the array into. I can see some reasons for this, better intellisense, more strict control over collection manipulation (the collection becomes read-only) but I think that the primary reason must be to better support object-notation arrays (you know, [] arrays). When you define an array using object notation it's not really an array (typeof [] === "object"). This is a problem if you want to LINQify it,&nbsp;you need to pass it to some other type.</p>
<p>The second issue I have&nbsp;with it is&nbsp;the naming. All the methods are named with Pascal Casing, which is the standard in .NET land, but <strong>every&nbsp;</strong>JavaScript library I've ever used (and as is standard) uses Camel Casing for methods. Sure Pascal keeps its relationship to .NET valid, but when trying to appeal the JavaScript developers it's just a bit foreign.</p>
<p>Lastly I'm a bit bothered by the lack of argument checking. This may be because I'm a very defensive programmer, but I don't like to allow developers to shoot themselves in the foot. If a parameter should be a function, then the paramter should be checked as a function. If a parameter is required, it should be checked as such.<br />This is more of a personal preference than a real design flaw though.</p>
<p><strong>My approach</strong></p>
<p>Now that I've talked aobut what I don't like with the JSLINQ project I think it's only fair to talk about my approach. I've gone with a more traditional LINQ approach and added extensions to an existing type, in this case the <strong>Array</strong> type, via <strong>Array.prototype</strong>. This means it is closer to the extension-method format of IEnumerable&lt;T&gt; from .NET, you just need to add in a namespace (aka, include the JavaScript file), but does have a problem of allowing the collection to be modified (which does have pros and cons).</p>
<p>I have also kept with standard JavaScript programming and Camel Cased the method names.</p>
<p>The following operators are supported:</p>
<ul>
<li>Where</li>
<li>Order By (inc decending)</li>
<li>First/orDefault</li>
<li>Single/orDefault</li>
<li>Last/orDefault</li>
<li>Select</li>
<li>GroupBy</li>
<li>IndexOf</li>
</ul>
<p>By and large the word under the hood with for loops, taking a method (aka a Lambda function) and using it.<br />As I said I'm a defensive programmer so there is a lot of type-checking against the arguments and the return types of methods (for example, ensuring the the Where lambda returns a boolean).</p>
<p>GroupBy is my most proud operator, as it turned out to be a bit harder than I had though. But it does return a collection which is also a pesudo-dictionary which can be itterated through.</p>
<p>I would provide the full source code but there seems to be a problem with current Umbraco instance running my blog which wont let me upload media items!<br />But here's the Where and GroupBy operators:</p>
<pre class="brush: js">Array.prototype.where = function(fn) {
    /// Filters the array
    /// Filtering function
    /// 
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
<pre class="brush: js">Array.prototype.groupBy = function(fn) {
    /// 
    if (!fn || typeof (fn) !== typeof (Function)) {
        throw Error.argumentType("fn", typeof (fn), typeof (Function), "groupBy takes a function to filter on");
    }
    var ret = new Array();
    for (var i = 0; i &lt; this.length; i++) {
        var key = fn(this[i]);
        var keyNode = ret.singleOrDefault(function(item) { return item.key === key; });

        if (!keyNode) {
            ret[ret.length] = { "key": key, "items": new Array() };
            ret[ret.length - 1].items.push(this[i]);
        } else {
            ret[ret.indexOf(keyNode)].items.push(this[i]);
        }
    }

    return ret;
}
</pre>
<p>&nbsp;</p>