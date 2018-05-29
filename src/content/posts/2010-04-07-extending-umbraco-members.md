---
  title: "Extending Umbraco Members"
  metaTitle: "Extending Umbraco Members"
  description: ""
  revised: "2010-08-10"
  date: "2010-04-07"
  tags: 
    - "umbraco"
    - "umbraco-3"
    - "members"
  migrated: "true"
  urls: 
    - "/extending-umbraco-members"
  summary: "This article is for working with Members in Umbraco 3.x. If you're looking to work with Members in Umbraco 4.x then refer to <a href=\"/umbraco-members-profiles\">this article</a>."
---
Recently we've had several projects which have come through in which we are building a solution in Umbraco and the client wants to have memberships within the site.

Umbraco 3.x has a fairly neat membership system but it's a bit limited when you want to interact with the member at a code level. Because members are just specialised nodes they can quite easily have custom properties put against them, but reading them in your code is less than appealing.
You've got to make sure you're reading from the correct alias, typing checking, null checking, etc.

And as I kept finding I was writing the same code over and over again for the reading and writing to the properties I thought I'd put together a small framework class.

The framework requires the following Umbraco DLL's:
* businesslogic.dll
* cms.dll

So lets look at some sections of the class.

## Default Properties ##

A member has a few default properties which are also built into the framework. There are also a few additional properties which the framework uses (such as the MembershipTypeId) which are coded in. All of the default properties are virtual so they can be overriden if so desired.
![Properties][1]

An interesting addition I have made is the IsDirty property. This is used later on during the Save to ensure that only members who have actually got data changed are saved back into Umbraco. This limits database hits and improves performance.

## Constructors ##

I've found that there are 3 really useful constructors, a new member constructor and two existing member constructors.
![Constructors][2]

What you'll notice from this is that the constructor which takes an Umbraco member is actually marked as private. This is because the framework is targetted at multi-teired applications, like MVC/ MVP where you want to keep data layers separate from the others. And by doing this you can avoid having the Umbraco DLL's included in any other project in your solution.

Next you'll notice a call to the method *PopulateCustomProperties*, this is an abstract method which you need to implement yourself to populate your own properties on a membership object.

Click to see the [Saving][3] method.

Notice the use of the IsDirty flag to ensure we're only saving what we should save.

## Helper Methods ##

I've provided a few helper methods which can be used for the reading and writing of custom properties on the Umbraco membership object.

![Helper Methods][4]

The two get methods handle the null and default data checking, along with casting back to the appriate data type. Here's an example implementation:

![Helper usage][5]

The save is really just a shortcut, I was sick of typing out that same command every time, to use it you would call it from the *PrepareMemberForSaving* method like so:

![][6]

And we're done

So there you have it, a simple little class for creating a .NET implementation of an Umbraco member.

There are two downloads available, Member.cs or a compiled DLL.

It will be interesting though when Umbraco 4 ships and the membership model changes to use the ASP.NET membership providers...

  [1]: https://www.aaron-powell.com/get/media/746/umbmember01.png
  [2]: https://www.aaron-powell.com/get/media/751/umbmember02.png
  [3]: https://www.aaron-powell.com/get/media/756/umbmember03.png
  [4]: https://www.aaron-powell.com/get/media/761/umbmember04.jpg
  [5]: https://www.aaron-powell.com/get/media/766/umbmember05.jpg
  [6]: https://www.aaron-powell.com/get/media/771/umbmember06.jpg

