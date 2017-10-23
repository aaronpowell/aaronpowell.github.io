+++
title = "Fun with a Client Event Pool and modal popups"
date = "2009-01-17"
draft = false
tags = ["ajax"]
+++

<p>I read an article last year about implementing a <a href="https://web.archive.org/web/20090127032545/http://seejoelprogram.wordpress.com/2008/07/31/a-client-event-pool-in-javascript/" target="_blank">Client Event Pool</a>&nbsp;and I really liked the concept. Joel shows a very good way to use it but I've been doing my best to find a logical use for it myself.</p>
<p>Anyone not familiar with the concept of a Client Event Pool it's covered in Joel's post, but the short version is that a Client Event Pool is a browser-level event handler which is designed to allow events to be easily passed between unlinked components.<br>One component can raise an event which can be chosen to be handled by any other. Inversly events can be listened for even if the component isn't on the page or the event isn't used.</p>
<p>This isn't really a new concept, you can achieve it (to a certain extent) with standard ASP.NET, with the <em>OnClient&lt;EventName&gt;</em> which is on a lot of the standard ASP.NET controls.</p>
<p>And in this article I'm going to look at how to integrate a Client Event Pool with&nbsp;the ASP.NET AJAX Control Toolkit's Modal Popup.<br>Now, don't get me wrong, this isn't the only way to add the events to a modal popup control, there are a lot of event handlers which can be added without a Client Event Pool.</p>
<p>This all came about when I was tasked with integrating a login, forgotten password and change password component. Each were their own modal popups and each were separate .NET UserControls. I wasn't involved with developing any of them, and I didn't want to really do much to modify any of them too much and introduce more bugs in the system by screwing around with stuff I'm not familiar with.<br>Because they are all separate I didn't have a real way to pass the ID of the control that was to make the popup appear. Oh, and to make thing more complicated there were 2 links for each popup, sadly the Modal Popup doesn't support multiple controls to do the poping-up (or as far as I'm aware...)</p>
<p>I also didn't want each of the popups to overlay each other, it doesn't really look that good (as I'll show shortly), so I needed a way to hide the <em>master</em> popup when the <em>child</em> was shown, and then when the <em>child</em> was hidden I want the <em>master</em> to reappear.</p>
<p>So I'm doing 3 basic controls for my example, a Login control:</p>
<p><img src="/get/media/1944/picture 1_398x285.jpg" width="398" height="285" alt="Picture 1"></p>
<p>a Forgotten Password control:</p>
<p><img src="/get/media/1949/picture 2_499x164.jpg" width="499" height="164" alt="Picture 2"></p>
<p>a Registration control:</p>
<p><img src="/get/media/1954/picture 3_497x245.jpg" width="497" height="245" alt="Picture 3"></p>
<p>And add a dash of CSS and you get a lovely little popup:</p>
<p><img src="/get/media/1959/picture 4.png" width="358" height="205" alt="Picture 4"></p>
<p>(Ok, so my design skills aren't great!)</p>
<p>So now it's time to tie up the master control with the child controls. To do this I'm going to have 2 events raised from the child controls, one for when the popup is shown and one for when it is hidden.<br>I'm also going to have an event which can be raised elsewhere on each child control which will initiate the showing of the popup (you could add one for the hiding, but I'm using the inbuilt hiding from the CancelControlID property of the modal popup).</p>
<p>For each they will look as follows:</p>
<p><img src="/get/media/1964/picture 5_496x65.jpg" width="496" height="65" alt="Picture 5"><br><img src="/get/media/1969/picture 6_499x69.jpg" width="499" height="69" alt="Picture 6"></p>
<p>Lets have a look at how they work, first off I locate the the Sys.Component instance of the ModalPopup control.<br>There are <em>showing</em> and <em>hiding</em> events fired off from the ModalPopup, so I'm going to add a handler, the handler though will just be a stub which in-turn raises an event within our Client Event Pool. I've given them names which will indicate what they are used for.<br>Lastly I'm going to add an event handler so anyone can raise an event which will show the popup.</p>
<p>Now lets have a look in the Login control:</p>
<p><img src="/get/media/1979/picture 7_498x245.jpg" width="498" height="245" alt="Picture 7"></p>
<p>The first 2 lines of this is adding event handlers to the links on the control. All they do is tell the Client Event Pool to raise an event, an event which I previously set up to be consumed by the child controls.</p>
<p>Next we set up the Client Event Pool to listen for the hide and show events from our child controls.<br>It listens for the events to be raised and when they are it'll either hide or show the modal on the current page.<br>Admittedly I've gone a little bit overboard with my events between the two child controls. Each could just raise events like <strong>hideParent</strong> and <strong>showParent</strong>, and then I would only need 2 handlers against the Client Event Pool, but to illistrate my point I've gone the verbos method.</p>
<p>Now I've gone for having the popups showing like this:</p>
<p><img src="/get/media/1974/picture 8.png" width="366" height="164" alt="Picture 8"></p>
<p>To this:</p>
<p><img src="/get/media/1984/picture 9.png" width="367" height="86" alt="Picture 9"></p>
<p>Admittedly static images can't really show how it works, but it's much nicer to <strong>not</strong> overlay popups, and ability to having popups automatically hiding and showing the loss-of-focus ones is a really sweet idea.</p>
<p>I'll admit that it's possible to do this without the need for a Client Event Pool, you can expose all the appropriate properties on the child controls which then can be set appropriately within it's parent, but think of it a step further, if you wanted a link on the Forgot Password to the Registration page. Because they aren't really aware of each other it is very difficult to achieve (but not impossible). Your UserControl can also expose wrappers to the Showing and Hiding client events on the modal popup, but it still has the same problem as mentioned previously.</p>
<p>And there we have it, a nice little example of how to use a Client Event Pool to make it easier to link previously unlinked components in a soft way.</p>
<p>The source code for this article can be found <a href="/get/media/1989/clienteventpooldemo.zip" target="_blank">here</a>.</p>