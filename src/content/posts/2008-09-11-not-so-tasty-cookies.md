+++
title = "Not so tasty cookies"
date = "2008-09-11"
draft = false
tags = ["asp.net", "generic .net", "rant"]
+++

<p>
As a general rule I'll avoid web cookies, they've got a bad wrap, and are too often used and abused. 
</p>
<p>
But for storing long life information on a client there's not really anything better. 
</p>
<p>
So recently I was putting them into a site which would check when you first hit it if the cookie exists, if it didn't then create it. Having not used cookies for a while I'd lost touch with how they operate, especially in the ASP.NET collection. 
</p>
<p>
Since HttpCookieCollection is a named collection you'd think that you could just got: 
</p>
<p>
HttpCookie myCookie = Response.Cookies["myCookie"]; 
</p>
<p>
Well you can... sort of, I'll get to the <em>sort of</em> shortly, but some background.<br>
Every time I did this I ended up with a cookie, regardless of whether one already existed or not. If it didn't exist then it'd have an expiry equal to DateTime.MinDate. Fine, what ever, I can detect that, so I had a handler to check that condition as well as a null return in myCookie. 
</p>
<p>
Then I have the following lines: 
</p>
<p>
HttpCookie myRealCookie = new HttpCookie("myCookie");<br>
myRealCookie.Value = "something";<br>
myRealCookie.Expiry = DateTime.Now.AddDays(1);<br>
<br>
Response.Cookies.Add(myRealCookie); 
</p>
<p>
But when I hit the control that is to use the cookie I get back the first "dud" cookie. WTF?<br>
So I look at the HttpCookieCollection, low-and-behold I have 2 cookies named "myCookie". And when I try and get one out I always get the <em>dud</em> cookie.<br>
WTF! 
</p>
<p>
So I fire up Reflector and look squarly at what happens and this is what I found: 
</p>
<table border="0" cellspacing="0" cellpadding="0" width="100%" style="margin-bottom: 0px">
	<tbody>
		<tr>
			<td colspan="2" valign="top" style="padding-right: 5px; padding-left: 5px; padding-bottom: 4px; padding-top: 4px">
			<pre>			public HttpCookie <strong>this</strong>[string name]{    
			</pre>
			<pre>				get    {        
			</pre>
			<pre>					return this.Get(<a title="string name; // Parameter">name</a>);    
			</pre>
			<pre>				}
			</pre>
			<pre>			}public HttpCookie <strong>Get</strong>(string name){    
			</pre>
			<pre>				HttpCookie <strong>cookie</strong> = (HttpCookie) base.BaseGet(<a title="string name; // Parameter">name</a>);    
			</pre>
			<pre>				if ((<a title="HttpCookie cookie // Local Variable">cookie</a> == null) &amp;&amp; (this._response != null))    {        
			</pre>
			<pre>					<a title="HttpCookie cookie // Local Variable">cookie</a> = new HttpCookie(<a title="string name; // Parameter">name</a>);        
			</pre>
			<pre>					this.AddCookie(<a title="HttpCookie cookie // Local Variable">cookie</a>, true);        
			</pre>
			<pre>					this._response.OnCookieAdd(<a title="HttpCookie cookie // Local Variable">cookie</a>);    
			</pre>
			<pre>				}    
			</pre>
			<pre>				return <a title="HttpCookie cookie // Local Variable">cookie</a>;
			</pre>
			<pre>			}			
			</pre>
			<p>
			Oh you have to be kidding me. You'd think that when I try and get a cookie that may not exist it doesn't <strong>just add the frigging thing!</strong> 
			</p>
			<p>
			So then I had to implement a lovely work around to itterate through the collection, check them by their index.<br>
			Hello performance! 
			</p>
			<p>
			Yes, this is just another lovely example of the .NET framework thinking we're too dumb to handle coding ourselves. 
			</p>
			</td>
		</tr>
	</tbody>
</table>