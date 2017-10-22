+++
title = "Isolating vs Mocking"
date = "2009-06-01T21:46:45.0000000Z"
tags = ["Unit Testing","Typemock"]
draft = false
+++

<p>I've been doing a lot of playing with testing frameworks and working out what's the best to use for the different needs. There's two kinds of frameworks out there for .NET, mocking frameworks and isolation frameworks.</p>
<p>There are different reasons for using the different framework types and I'm to try and explain which one is a good choice for what you're trying to do.<br />&nbsp;</p>
<p><strong>What is mocking?</strong></p>
<p>Mocking is the concept of producing fake versions of the objects you want to operate with. With these fake versions you then are able to specify how they operate, what their methods will return, etc.</p>
<p>There's quite a few frameworks available for mocking, <a href="http://ayende.com/projects/rhino-mocks.aspx" target="_blank">RhinoMocks</a>, <a href="http://code.google.com/p/moq/" target="_blank">Moq&nbsp;</a>and&nbsp;<a href="http://www.nmock.org/" target="_blank">NMock</a>&nbsp;to name a few. These are all open source projects and they are all very good. The each offer very similar features, the kind of features which are expected by developers such as:</p>
<ul>
<li>Mocking properties and methods</li>
<li>Expecting calls</li>
<li>Asserting execution paths</li>
</ul>
<p>Mocking frameworks are best when you've got full control over the components being used, or the components used are prebuilt with mocking in designed.</p>
<p>&nbsp;</p>
<p><strong>What is isolating?</strong></p>
<p>Isolating is similar to mocking, but it is much more broadly focused, with the idea that you make fake versions of everything, regardless of whether you developed the component or not.</p>
<p>This is why isolating frameworks are becoming popular with hard-to-mock components such as CMS cores, ASP.NET or Silverlight.</p>
<p>When it comes to isolation frameworks in .NET <a href="http://www.typemock.com/" target="_blank">Typemock</a> is one of the biggest players. Their framework is well designed to do testing SharePoint, ASP.NET (via <a href="http://sm-art.biz/Ivonna.aspx" target="_blank">Ivonna</a>) and others. But it's quite possible to use Typemock to mock out other systems such as the .NET framework (with the limitation of mscorlib, but that's changing!) or other CMS's such as Umbraco.</p>
<p>&nbsp;</p>
<p><strong>What makes mocking different to isolation?</strong></p>
<p>So now that we've got a bit of a background on mocking and isolating what's the different between the two, why would you use Typemock which isn't free over RhinoMocks which is?</p>
<p>Well it really comes down to what you're trying to do, mocking frameworks are only useful when the project is <em>designed</em>&nbsp;for mocking, where as isolating can be done more after the fact.</p>
<p>To understand what I mean by this you really need to understand how the framework types work. Most of the free mocking frameworks are built on top of the <a href="http://www.castleproject.org/dynamicproxy/index.html" target="_blank">DynamicProxy</a> which is used for dynamically generating the classes. This is how the mocking frameworks operate, an implementation of the class is dynamically created. This is why working with mocking frameworks really require the code to be designed for mocking. If your class is sealed, or your method is non-virtual it is no longer able to be mocked. Because of how DynamicProxy works it implements the class with the rules specified, but if it's sealed, it can't have an implementation done. Same with non-virtuals, if an override can't be performed there is no way to add your own rules.</p>
<p>Typemock's Isolator on the other hand uses black magic to achieve what it does. Ok, well not black magic but close, I'm not really privileged to it's operation, but from my understanding it uses a profiler to analyze the execution path and then creates the rules specified in raw IL and inject that. This means that the restraints of DynamicProxy no longer apply. Since the IL is being injected on-the-fly anything can be faked. Sealed classes, non-virtuals, even objects without public constructors!</p>
<p>&nbsp;</p>
<p><strong>Which to use when?</strong></p>
<p>So which should you be using and when? Well mocking is great when you're starting a new project, when you've got ground up control over what's being developed. Making something that is 100% mockable is a very difficult task though, it requires a lot of design though, and ensuring that all data required for an operation is either passed is or available on the base object.</p>
<p>This can lead to what I consider lax design, particularly when you're developing a framework of your own. Because everything has to be unsealed and virtual it can lead to undesirable extensibility.<br />I'm from the school of thought that classes should be sealed-by-default. If something is to be extended I'll <em>design it for extensibility</em>, and if I don't want it extended or don't think it should be extended I wont make it available for extension.</p>
<p>And here is where isolation frameworks come in, they allow for this kind of design. Because they don't require the classes or methods designed for extensability it means tighter design but testing still achievable.<br />Additionally it does mean that it's possible to fake out systems you have no control over, such as a CMS which are inheritly untestable.<br />Some people are concerned about this kind of faking power, that you're possibly making assumptions of how an external system will operate which may be incorrect. But if that is the case then you're placing too much on the unit tests, without having any integration tests to back up the assumptions.</p>
<p>&nbsp;</p>
<p><strong>Conclusion</strong></p>
<p>Hopefully this has shed some light onto the world of mocking and isolating. But really the best way to work out what's right for you is to grab a copy and get coding!&nbsp;</p>