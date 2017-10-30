+++
title = "Using LINQ to do email templates"
date = "2008-09-27"
draft = false
tags = ["linq"]
+++

<p>
So recently I was working on project where a client wanted to have customisable email templates which could be merged with data from their database so we store the email as an XML document and have a series of placeholders within it to allow easy editing to customise the wording, layout, etc.
</p>
<p>
But because there's quite a lot of different email "data sources" we wanted a nice and easy way so we didn't have to constantly write merge methods, having a single method which handles it all is the best idea.<br>
But how do we handle all the different data sources, and since the ORM is LINQ to SQL it'd be really nice to not have to constantly write classes and structures to handle all the difference formats. So this is what I come up with.
</p>
<p>
<strong>Step 1, an XML document</strong>
</p>
<p>
This isn't really that complex a step, I've got it really primitive and the XML was only storing the subject and body. But it can be as complex as required, storing SMTP details, sender, recipient(s), etc.
</p>
<p>
I have just 2 nodes, a Subject and a Body node, the Body of the email being stored in a CDATA to make it easier to parse. 
</p>
<p>
<strong>Step 2, the Email Template class</strong>
</p>
<p>
Now we need a class for the email template generation, this is what I have:
</p>
<pre><span class="keyword">public</span> <span class="keyword">class</span> <span class="const">EmailTemplate</span>{
<span class="keyword">public string</span> Subject { <span class="keyword">get</span>; <span class="keyword">private</span> <span class="keyword">set</span>; }
<span class="keyword">public string</span> Body { <span class="keyword">get</span>; <span class="keyword">private set</span>; }
<span class="keyword">public</span> EmailTemplate(<span class="keyword">string</span> path){
<span class="const">XDocument</span> xdoc = <span class="const">XDocument</span>.Load(path);
<span class="keyword">var</span> root = xdoc.Element(<span class="string">"emailTemplate"</span>);
<span class="keyword">this</span>.Subject = root.Element(<span class="string">"subject"</span>).Value;
<span class="keyword">this</span>.Body = root.Element(<span class="string">"body"</span>).Value;
}
<span class="keyword">public</span> <span class="keyword">string</span> GenerateBody(T data){
<span class="keyword">return</span> Generate(<span class="keyword">this</span>.Body, data); 
}
<span class="keyword">public string</span> GenerateSubject(T data){
<span class="keyword">return</span> Generate(<span class="keyword">this</span>.Subject, data);
}
<span class="keyword">private static string</span> Generate(string source, T data){
// coming shortly
}
}
</pre>
<p>
&nbsp;
</p>
<p>
So now we have our class stubbed up, the constructor takes a path to an XML document and then we use a <span class="const">XDocument</span> object to traverse into our XML and find the subject and body. The Subject and Body properties are made with private setters so that you can't edit the subject accidentally. Also, so that you can reuse the current loaded template the "Generate" methods will return a string rather than replacing the contents of the current object.
</p>
<p>
<strong>Step 3, writing the Generator</strong>
</p>
<p>
This is where the fun bit comes in, we're going to use Reflection to find all the properties of our Generic class and then write it to a source.
</p>
<pre><span class="keyword">private static string</span> Generate(<span class="keyword">string</span> source, T data){
<span class="const">Type</span> theType = data.GetType();
<span class="const">PropertyInfo</span>[] properties = theType.GetProperties();
properties.ForEach(p =&gt; result = result.Replace(<span class="string">"{{ "</span> + p.Name +<span class="string"> " }}"</span>, p.GetValue(data, new <span class="const">Object</span>[0]).ToString()));
<span class="keyword">return</span> result;
}
</pre>
<p>
&nbsp;
</p>
<p>
So to sum up I'm using Reflection to get all the properties from the object and then using the ForEach extension method (if you don't have the ForEach extension method check it out <a href="http://stackoverflow.com/questions/101265/why-is-there-not-a-foreach-extension-method-on-the-ienumerable-interface#101303" target="_blank">here</a>). So for each of the properties I'll create a token (which I'm using in the form of "{{ MyProeprty }}") and then do a replace.
<br>
I've found this template to be really effective as it'll allow for easy adding of new properties to my object without having to re-write the generation method, and it doesn't give a damn whether the property actually exists.
</p>
<p>
I can quite easily use a LINQ to SQL expression like this:
</p>
<pre><span class="keyword">var</span> myItems = ctx.MyDataItems.Select(m =&gt; new { Property1 = m.Property1, Property2 = m.Property2 });
</pre>
<p>
And pass it straight in. Got to love anonymous types!
</p>