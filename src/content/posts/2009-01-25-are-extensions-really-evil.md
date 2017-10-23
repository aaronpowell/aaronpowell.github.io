+++
title = "Are extensions really evil?"
date = "2009-01-25"
draft = false
tags = ["generic .net"]
+++

<p>Ruben (of Umbraco fame) recently wrote a post entitled <a href="https://web.archive.org/web/20090127032545/http://ruben.3click.be/blog/extension-methods-silent-static-slaves">Extension Methods: Silent static slaves</a> which was in response to a comment I'd left on a previous post about static classes and static method being evil.</p>
<p>If you haven't read Ruben post then I suggest you do before continue on with mine as a lot of what I'll be saying is in counter argument to him (including the comments).</p>
<p>Done? Good, continue on!</p>
<p>Ruben has produced a demo which is great for illistrating his point, but is it an example of good design turning bad or just bad design from the start?</p>
<p>The first thing I want to look at is that his extension methods are on the interface <em>and</em> implementation class.<br>This is bad design to start with, but it's not just bad design if you're using extension methods, this could manifest itself as bad design if you did it as helper methods in a separate class, eg:</p>
<pre><span class="keyword">class</span> <span class="const">Helpers</span> {<br>  <span class="keyword">public static int</span> CalculateShoeCount(<span class="const">Animal</span> animal) {<br>   //do processing<br>  }<br>  <span class="keyword">public static int</span> CalculateShoeCount(<span class="const">Monkey</span> animal) {<br>   //do processing<br>  }<br>}<br></pre>
<p>So this would fall into the same trap if we don't re-cast Animal to Monkey before calling the helper.</p>
<p>But does this prove Ruben's initial point, that static's are just plain evil?<br>Well no, design isn't possible without statics. If you try and design without statics you end up with nothing but instance memebers. If that's the case where do I find the current method <strong>int.TryParse</strong>, does this become <strong>0.TryParse</strong>?</p>
<p>Ruben's demo is an example of bad design producing worse design. In good design the CalculateShoeCount would be a member of the Animal interface, particularly since the implementation changes per interface implementation type.</p>
<p>So how can we use extension methods to produce good design? Well first you really need to understand <em>what</em> an extension method is. As Ruben quite correctly pointed out an extension is just syntactic suger and extension methods should be treated as such. Developers need to understand that extension methods are only designed to provide functionality to a classes public instance members; they are stateless.<br>(This is why I don't understand why so many people of Stack Overflow want <em>extension properties</em> added to the compiler, this is where people are missing the point of the extension concept)<br>And if you're expecting a stateful nature from the extension methods then you've missed their goal.</p>
<p>Lets look at some good examples of using extension methods. Here's a fav of mine for Umbraco:</p>
<pre><span class="keyword">public static string</span> Url(<span class="keyword">this</span> <span class="const">Node</span> node) {<br>  <span class="keyword">return</span> umbraco.<span class="const">library</span>.NiceUrl(node.Id);<br>}<br></pre>
<p>(Hey look, a static calling a static ;)).</p>
<p>Or how about this one:</p>
<pre><span class="keyword">public static IEnumerable<span class="keyword">&lt;</span><span class="const">ListItem</span>&gt;</span> SelectedItems(<span class="keyword">this</span> <span class="const">ListControl</span> ctrl) {<br>  <span class="keyword">return</span> ctrl.Items.Cast&lt;ListItem&gt;().Where(item =&gt; item.Selected);<br>}<br></pre>
<p>Now we're using an extension method with an extension method.</p>
<p>But both of these examples are using actual class implementations, not interfaces, does that make a difference?<br>Yes, and a big one. When you are putting extensions on an interface there needs to be no possibility of confusion about what the extensions are for. And if you are also providing an extension of an implementation of the class <strong>they need to be in separate namespaces</strong>. If they aren't, you will end up with what Ruben shows, misrepresentation of the methods abilities.</p>
<p>IQueryable&lt;T&gt; is a perfect example of how to use extension methods on top of an interface. If you have a look at the construct of the interface there's actually <strong>no constructs within it</strong>! This means that "all" the functionality is provided by extension methods, allowing anyone to write their own extensions.<br>If I was to not include the namespace System.Linq I can then write my own query extensions, eg a Where that <em>does</em> return a bool, or negate operators which I don't want to support.</p>
<p>&nbsp;</p>
<p>So in my opinion extension methdos are no more evil than anything else in programming; they can easily be abused and misused, but find something that it'd not possible to misuse to prove bad design.</p>