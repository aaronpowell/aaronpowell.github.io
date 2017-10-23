+++
title = "Umbraco Membership Trap"
date = "2008-09-02"
draft = false
tags = ["umbraco", "asp.net"]
+++

<p>
So today I was working to fix a problem on a site of ours which was to do with logging out of a site which uses the Umbraco Membership as the authentication provider.<br>
The bug was that when you had to click the logout button twice to log out. Clicking logout once would just refresh the page with nothing apparently happening.
</p>
<p>
Firing up the debugger I start have a look, making sure that the events are being fired when they should and so on... and they are. The logout method is called, the member is removed from the cache, the "show login" method is called, but if you check through the Umbraco API you're not logged out. Member.CurrentMemberId() still returned a value.
</p>
<p>
Hmm... so&nbsp;I'm doing everything that I need to do, so why is the member still logged in?<br>
I pull our .NET Reflector and start having a poke around the API calls. For those who don't know, by default Umbraco stores the member login details in cookies, and that was running fine, but what I found interesting was that when I call the Member.ClearMemberFromClient method the cookies still existed!
</p>
<p>
That's not right... so I check out what's happening, when I notice the problem:
</p>
<p>
<img src="/get/media/1038/umbmember001.png" width="381" height="140" alt="umbMember001.png">
</p>
<p>
Do you see it? If not I'll point out the problem. The cookie is not removed from the HttpContext, it is mearly set to expire immidiately. Well, at least once the context has disposed.
</p>
<p>
So the only way we can get around this is to redirect after clearing the member from the client cache.
</p>