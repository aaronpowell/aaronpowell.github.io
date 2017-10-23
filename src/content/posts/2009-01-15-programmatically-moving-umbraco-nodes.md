+++
title = "Programmatically moving Umbraco nodes"
date = "2009-01-15"
draft = false
tags = ["umbraco"]
+++

<p>The other month Ruben did a post on using the <a href="https://web.archive.org/web/20090127032545/http://ruben.3click.be/blog/pinging-a-webservice-using-an-event-handler" target="_blank">new Umbraco event model</a>&nbsp;and today I had to solve a problem which it seemed like it would be the best way.</p>
<p>I needed to have a document, when published, moved into a new folder (as we're using Umbraco to store some data used for some non-browsable data). This can be achieved with the old IActionHandler.Execute method, but it was a little problematic, you needed to have some way to check if it was running because you moved and republished, or the initial publish.</p>
<p>Luckily, the Umbraco v4 event model makes this really nice and easy. Well, slightly easier, there's a few things that are still a bit of a pain, but it's not a problem with Umbraco, more a by-design limitation.</p>
<p>So lets get into some code.</p>
<pre><span class="keyword">public</span> <span class="keyword">class</span> <span class="const">ActionHandler</span> : <span class="const">ApplicationBase</span> {
  <span class="keyword">public</span> ActionHandler(){
    Document.BeforePublish += <span class="keyword">new</span> <span class="const">EventHandler</span>(Document_BeforePublish);
  }

  <span class="keyword">protected</span> <span class="keyword">void</span> Document_BeforePublish(<span class="const">Document</span> sender, <span class="const">PublishedEventArgs</span> e){
    <span class="keyword">try</span> {
      <span class="const">MyDocType</span> dt = <span class="keyword">new</span> <span class="const">MyDocType</span>(sender);
      if(dt.SomeField == <span class="string">"stillToMove"</span>) {
        e.Cancel = <span class="keyword">true</span>;
        dt.ParentId = 1234;
        dt.SomeField = <span class="string">"it's moved!"</span>;
        dt.Save(<span class="keyword">true</span>);
      }

    } <span class="keyword">catch</span> (<span class="const">DocTypeMissMatchException</span>) { }
  }
}
</pre>
<p>So I've used the UIL to generate a class representation of my docType (aptly named MyDocType :P) and from that I'm having to check a field on the document. This could be anything from a standard field to a the parent ID to the published state.</p>
<p>The really nice part about using the event handler I can stop the current publish action. This will improve performance and database hits.</p>
<p>You can do this without the UIL, but because of some of the built in features of the UIL it can be easily used to detect the correct docType. There's no need for magic numbers (and I'm sure a better way to pass the new parent ID can be thought up!).</p>
<p>So all in all I think that the new event model can have some really powerful aspects to it, it provides much more flexibility and event variety over IActionHandler.Execcute.</p>