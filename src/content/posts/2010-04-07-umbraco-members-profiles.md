---
  title: "Umbraco Members Profiles"
  metaTitle: "umbraco-members-profiles"
  description: ""
  revised: "2010-04-07"
  date: "2010-04-07"
  tags: 
    - "umbraco"
    - "members"
  migrated: "true"
  urls: 
    - "/umbraco-members-profiles"
  summary: "Useful Links:<br />\n<a href=\"/extending-umbraco-members\">Extending Umbraco Members</a><br />\n<a href=\"http://msdn.microsoft.com/en-us/library/system.web.security.membershipprovider.aspx\">MembershipProvider</a><br />\n<a href=\"http://msdn.microsoft.com/en-us/library/system.web.security.roleprovider.aspx\">RoleProvider</a><br />\n<a href=\"http://msdn.microsoft.com/en-us/library/system.web.profile.profileprovider.aspx\">ProfileProvider</a><br />\n<a href=\"http://msdn.microsoft.com/en-us/library/system.web.profile.profilebase.aspx\">ProfileBase</a><br />\n<a href=\"http://msdn.microsoft.com/en-us/library/system.web.profile.settingsallowanonymousattribute.aspx\">SettingsAllowAnonymousAttribute</a>"
---
Almost 12 months ago I did a post looking at how to make .NET interaction with Umbraco Members easier (Extending Umbraco Members). This was for Umbraco 3.x, but now with Umbraco 4.x a question that has been coming up a lot on the Umbraco forums of recent is how to work with the Umbraco Membership. When Umbraco 4 was released it brought in the implementation of the ASP.NET Membership classes (MembershipProvider, RoleProvider and ProfileProvider).

These classes were implemented via the umbraco.providers assembly and were essentially just wrappers for the underlying Umbraco Member/ Member Type/ Member Group classes.

Although they still go through the Umbraco API underneath what was very nice was that now it was possible to use the standard ASP.NET login controls, Forms Authentication, etc. And if you're really brave you could drop in your own membership provider, such as the SqlMembershipProvider or any custom solution you'd written.

Something that seems to have been neglected is how to work with the Member Type information. By default you only have Name, Username and Password on a Member in Umbraco, so we extend it via the MemberType, but how do we get that data back?
Generally people will just use the Umbraco API and the Member.getProperty(alias) method, but that kind of nulls the point of having the ASP.NET Membership available to us, and what if you did want to swap out the providers (although I highly doubt that would ever happen)?

That's what I'm going to explain here, how you can use the ASP.NET ProfileProvider and it's associated classes with an Umbraco-defined MemberType.

## Our Member Type ##

For this I'm going to have a very basic little Member Type, it'll have three bits of data on it, First Name, Middle Name and Last Name.

![][1]

As you can see these are defined as per normal, nothing special about that. I can then go to my Umbraco Member and enter some data and view it:

![][2]

## Accessing via ASP.NET ##

Now we need to be able to access this via ASP.NET, there are two things we need to configure. First is we want to define our .NET class which represents the Member Type. To do this we need to create a class which inherits from System.Web.Profile.ProfileBase:

    using System;
    using System.Web.Profile;
    public class MemberProfile : ProfileBase { ... }

Now we have to define the properties which we want exposed from our MemberType. The nice thing is here I don't have to expose everything, if there was a property which I didn't want/ need access to, I can easily just leave it out. So lets define our properties:

	[SettingsAllowAnonymous(false)]
	public string FirstName
	{
		get
		{
			var o = base.GetPropertyValue("first_name");
			if (o == DBNull.Value)
			{
				return string.Empty;
			}
			return (string)o;
		}
		set
		{
			base.SetPropertyValue("first_name", value);
		}
	}

	[SettingsAllowAnonymous(false)]
	public string LastName
	{
		get
		{
			var o = base.GetPropertyValue("last_name");
			if (o == DBNull.Value)
			{
				return string.Empty;
			}
			return (string)o;
		}
		set
		{
			base.SetPropertyValue("last_name", value);
		}
	}

	[SettingsAllowAnonymous(false)]
	public string MiddleName
	{
		get
		{
			var o = base.GetPropertyValue("middle_name");
			if (o == DBNull.Value)
			{
				return string.Empty;
			}
			return (string)o;
		}
		set
		{
			base.SetPropertyValue("middle_name", value);
		}
	}

So as you can see I've created three properties which we are exposing. Notice how all of them are doing a **base.GetPropertyValue(string)** method call, and the string we are passing in is the Alias of the Member Type property. This is because we'll be using the Umbraco ProfileProvider which expects the property alias. This means that we can easily create a friendly name in our class for the property (such as FirstName) and pass through the un-friendly name as the alisa (first_name).
Additionally I've marked all the classes with the SettingsAllowAnonymousAttribute and set it to false.
Profiles in ASP.NET Membership can support anonymous profiles, but I wont be covering that.

Now that we've defined our class for the profile we need to tell ASP.NET to use it. This is really easy, thanks to the umbraco.provider.members.UmbracoProfileProvider class. This class is an implementation of the ProfileProvider abstract class, and is designed to get the profile information for an Umbraco member.

So we need to set up our web.config like so:

	<system.web>
		<profile defaultProvider="UmbracoMemberProfileProvider" enabled="true" inherits="UmbracoMemberDemo.Web.MemberProfile, UmbracoMemberDemo.Web">
		  <providers>
			<clear />
			<add name="UmbracoMemberProfileProvider" type="umbraco.providers.members.UmbracoProfileProvider, umbraco.providers" />
		  </providers>
		  <properties>
			<clear />
			<add name="first_name" allowAnonymous ="false" provider="UmbracoMemberProfileProvider" type="System.String" />
			<add name="last_name" allowAnonymous ="false" provider="UmbracoMemberProfileProvider" type="System.String" />
			<add name="middle_name" allowAnonymous ="false" provider="UmbracoMemberProfileProvider" type="System.String" />
		  </properties>
		</profile>
	</system.web>

So what have we done? Well on the <profile /> node I have defined that I want to use the UmbracoMemberProfileProvider as the default (if I had multiple profile providers defined that is of relivance) and that the profile will inherit my class UmbracoMember.Web.MemberProfile which is in the UmbracoMemberDemo.Web assembly.
This will let ASP.NET know the class type and I can then access the properties through my class.

Lastly I defined the properties which are in the class, with their name being the Alias in Umbraco. I've also explicity defined the provider they will come from, again if I had multiple providers defined I could have multiple locations where I get the data, and it's at the property level I would define where it comes from.

## Using the Profile ##

Well we've set up all that really needs to be set up, it's really that simple! But how do we access the data in the profile? Well I'm going to make an assumption that you have secured pages and the following code is being run within one.

From the current HttpContext object we have access to the profile, via HttpContext.Current.Profile and this will return me a ProfileBase instance. So I can now do this:

    string firstName = ((MemberProfile)HttpContext.Current.Profile).FistName;

And remember that the property has a setter as well, so I can write back to it as well, which will the write back to Umbraco.

I can make a .NET user control and do something like this also:

	<div>
		<p>
			<span>First Name: <%= ((UmbracoMemberTester.Web.MemberProfile)Context.Profile).FirstName %></span>
		</p>
		<p>
			<span>Middle Name: <%= ((UmbracoMemberTester.Web.MemberProfile)Context.Profile).MiddleName %></span>
		</p>
		<p>
			<span>Last Name: <%= ((UmbracoMemberTester.Web.MemberProfile)Context.Profile).LastName %></span>
		</p>
	</div>

That bit of code does not even require a back-end file for the User Control. And how does it look? Well just like this:

![][3]

## Conclusion ##

I hope that this has been useful and explains just how easy it can be to use standard ASP.NET features to expose Umbraco Member Types.

  [1]: https://www.aaron-powell.com/get/media/2723/picture%201.png
  [2]: https://www.aaron-powell.com/get/media/2728/picture%202.png
  [3]: https://www.aaron-powell.com/get/media/2733/picture%203.png

