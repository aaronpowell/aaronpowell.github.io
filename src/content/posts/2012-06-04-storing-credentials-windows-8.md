---
  title: "Storing credentials in Windows 8"
  metaTitle: "Storing credentials in Windows 8"
  description: ""
  revised: "2012-06-04"
  date: "2012-06-04"
  tags: 
    - "windows8"
  migrated: "true"
  urls: 
    - "/storing-credentials-windows-8"
  summary: ""
---
So you're building a Windows 8 application and you want to authenticate against an external service. For this it's likely that you're going to want to store a username and password for the user so that you can query off to the external service without bugging them constantly.

This was something that I had to do for my [Pinboard for Windows 8](https://www.aaron-powell.com/pinboard-for-win8) application so I wanted to make sure that I was doing it above board and no one would think I've been sneaky and abused their privacy.

# Accessing credentials

Luckily Windows 8 provides you a nice and easy way which you can store the credentials your application has. I'll admit that I've not done a lot of desktop application development so this may not be *that* new but hey it's new to me and new for WinJS :P. The way you interact with the credentials is through the [`Windows.Security.Credentials.PasswordVault`](http://msdn.microsoft.com/en-us/library/windows/apps/xaml/br227081.aspx) class and it's shockingly simple to do:

    var resourceKey = 'My app key';
    var passwordVault = new Windows.Security.Credentials.PasswordVault();
    
    var credentials = passwordVault.findAllByResource(resourceKey);

First off you need to create a resource key for your application; this is an identifier for your application's credentials. The `FindAllByResource` method will provide you with all the credentials you've stored, you can then filter this down as required to find the particular user you're after.

Once you have the username you can retrieve the password since the password wont be provided in a usable method initial (I'm guessing for security reasons) so you have to explicitly request it:

	var user = passwordVault.retrieve(resoruceKey, credentials[0].userName);
	
This `user` object will have a password property that you can do what ever you need to do.

# Where it gets ugly

It's the first time a user installs your application so you wont have any credentials. You want them to log in before you can do anything right? That makes sense so you check to see if there is a user:

    var resourceKey = 'My app key';
    var passwordVault = new Windows.Security.Credentials.PasswordVault();
    
    var credentials = passwordVault.findAllByResource(resourceKey);

	if (credentials.length) {
		//we've got a credential
	} else {
		//no credentials yet
	}
	
Right? **Wrong.**

Where you expect to an empty credential store for your resource you actually get... **an exception**! That right the code you'll actually need looks more like this:

    var resourceKey = 'My app key';
    var passwordVault = new Windows.Security.Credentials.PasswordVault();
    
    var credentials;

	try {
		credentials = passwordVault.findAllByResource(resourceKey);
		//we've got a credential
	} catch (e) {
		//no credentials yet
	}
*Le sigh...* I haven't found any better way to do this other than trying to get *all* credentials using the [`retrieveAll`](http://msdn.microsoft.com/en-us/library/windows/apps/xaml/windows.security.credentials.passwordvault.retrieveall.aspx) method but that implies that it gets back all credentials regardless of the resource key, which is what we really want to identify our application.

# Storing credentials

Once we get passed the oddity of try/ catch driven development it's worthwhile thinking about storing credentials. Turns out that this is also really easy to do:

	var creds = new Windows.Security.Credentials.PasswordCredential(resourceKey, username, password);

	passwordVault.add(creds);

Now your store is updated and what's also cool is that you can access them from Windows 8 itself. If you navigate to `Control Panel\User Accounts and Family Safety\Credential Manager` you'll see your newly stored credentials:

![Credentials Store][1]

And there we go, all stored securely inside the Windows security store. The other cool thing about this is that it allows credentials to roam between devices, I haven't been able to put this to the test yet though as I only have one machine with Windows 8 on it so roaming isn't all that viable!

# Conclusion

Storing credentials in Windows 8 is so simple but it has some strangeness about it. Your main point of call is the [`PasswordVault`](http://msdn.microsoft.com/en-us/library/windows/apps/xaml/br227081.aspx) class, part of the Windows 8 runtime, which gives you a simple programming interface into the Windows security store.


  [1]: https://www.aaron-powell.com/get/windows-8-credentials-store.png