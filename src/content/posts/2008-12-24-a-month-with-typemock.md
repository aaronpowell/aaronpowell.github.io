+++
title = "A month with TypeMock"
date = "2008-12-24"
draft = false
tags = ["unit testing"]
+++

<p>
A month ago I did a <a href="/web/20090127032545/https://www.aaron-powell.com:80/blog.aspx?id=1291" target="_blank">post</a> about the <a href="https://web.archive.org/web/20090127032545/http://www.typemock.com/" target="_blank">TypeMock mocking framework </a>and the nice people at TypeMock were kind enough to give me a 1 year license for their software. Although I haven't really played with it as much as I hoped/ would have liked I have done a bit with it and though I'd share some thoughts.
</p>
<p>
To have a bit of a base line I was doing my playing with both Typemock and RhinoMocks, just to have an example against a good free mocking framework.
</p>
<p>
<strong><span>Where Typemock rocks</span></strong>
</p>
<p>
The most exciting aspect of Typemock for me is that I can <span>mock anything</span> (well, nearly anything, you can't mock things from within mscorlib), and I mean anything. With the SharePoint aspect TypeMock really advertises that you can mock the SharePoint libraries <span>as they are, </span>meaning that you don't need source code access or anything.
</p>
<p>
What do I mean by this? Well take RhinoMocks for example. RhinoMocks is built on top of the Castle projects <strong><span>DynamicProxy2</span></strong> component. This means that if you're wanting to set up expected returns your methods are required to be <span>virtual</span>. This can be a problem if you're mocking an external framework (ie - SharePoint).
</p>
<p>
But because TypeMock doesn't used DynamicProxy2 you don't have this limitation.&nbsp;
</p>
<p>
So with the demos which I was watching and reading with TypeMock on SharePoint it got me thinking, <strong><span>could I mock Umbraco?</span></strong> And you know what, <strong>I<span> can</span></strong>!
</p>
<p>
This is really exciting, when I was developing the <a href="http://www.codeplex.com/uil" target="_blank">Umbraco Interaction Layer</a> I really wanted it to be unit tested, but due to limitations within Umbraco this mean I wasn't able to use something like RhinoMocks, because I needed to setup expected returns on method calls which weren't virtual (although I could download the source and modify that myself it defeats the concept of supporting a standard Umbraco release).
</p>
<p>
So I got playing with TypeMock and low and behold I was able to set up some basic mocks to make fake data types!
</p>
<p>
The code is currently POC-level and <span>won't</span> be going into the CodePlex project (I feel it is unfair that I put a licensed product up when the UIL is a free product), but still it is a very interesting concept and something I plan to look deeper into.
</p>
<p>
I also have found that TypeMock can be a whole lot easier to set up mock returns, because the parameters are completely ignored when making a method call you can be a bit more careless in your mock setup.&nbsp;
</p>
<p>
Lastly TypeMocks ability to mock the construction of objects without public constructors is really nifty. Again this has great advantages when mocking with external libraries like SharePoint and Umbraco. 
</p>
<p>
<strong>Where TypeMock doesn't rock</strong>
</p>
<p>
Although I stated that I <em>like</em> that I don't have to really worry about the parameters being passed into the method this is also a bit of a drawback. If you had a method that you want different returns depending on the method input (say, something doing a calculation) this is something that I so far haven't been able to work out how to achieve.
</p>
<p>
By contrast this can be done in RhinoMocks as you need to provide a valid method parameter that you will then use when calling for the mock. 
</p>
<p>
<strong>Is it worth the money?</strong>
</p>
<p>
This is a difficult question to answer, primarily because I haven't played with TypeMock enough. I really think that it's more of a case of "depending what you're doing". I can see that TypeMock is really great if you're wanthing to mock the results from an external library like SharePoint, Umbraco (or I'm sure even SiteCore ;). Also I see TypeMock is great to add mocking <em>after the fact</em> to a project. You may be will into development, many of the project API's are already set up, ready for use but you want to now go down the TDD path (it's never too late to start!). In this case going back and redoing all methods to be virtual is not really viable. But TypeMock's non-reliance on virtual methods for mock results does mean you can achieve TDD without major refactoring. 
</p>