---
  title: "The settings suck"
  metaTitle: "The settings suck"
  description: "Settings in Windows 8 XAML suck. Period."
  revised: "2012-09-14"
  date: "2012-09-14"
  tags: 
    - "xaml"
    - "windows8"
    - "rant"
  migrated: "true"
  urls: 
    - "/xaml/settings-suck"
  summary: ""
---
# Settings problems

My first Windows 8 application I wrote using WinJS so a lot of my expectations on how settings worked in Windows 8 XAML was based off of that experience. Unfortunately from the looks of it the two teams had *very* different ideas on whether settings were important or not and thus we have drastically different experiences.

Here's the problems I've hit so far:

* Setting up settings, if you do this "too early" (ie - before the app has fired off its Activated event) it crashes as the settings pane doesn't exist
* There's no built-in settings control
* Since there's no control there's no way to navigate to a particular settings pane
* You use an event handler to register settings panes

With the exception of the last point (which sucks in both platforms) these are problems specific to XAML based Windows 8 applications. What absolutely baffles me is that there's no settings stuff built into the platform, seriously, did no one think that that **would be important**? I mean it's not like you [need to have a section in settings about privacy or anything][1].

# Problem 1 - No built in control

So let's start with the big one, the lack of built in control. It's reasonably trivial to roll you're own, as long as you take into account the following things:

* RTL vs LTR displays will open the settings on different sites, make sure you know which side the system settings are opening from and make your settings come from that site as well
* You'll want it to animate in, check out the settings on the start screen, they have a nice little fly in so you'll want to replicate that yourself
* You'll want a back button so your user can easily flick back to the overall settings pane
* Make sure it's in the allowed widths, either 346 or 646 in width

If you want to look into creating it there's a blog [here][2] or [the official sample][3] that covers all the steps you'll be wanting to go through.

But realistically don't roll your own, check out the [Callisto][4]. It has a built in settings flyout that works very similar to the one in WinJS which is ace. Maybe the next version will just roll that into the platform.

# Problem 2 - Wiring up settings

Say you want to have a global settings pane, maybe your privacy policy, well you're going to want to register this in the "global" part of the application. My initial instinct was to do this in the App.xaml.cs constructor. Seemed logical, it was something that I knew would only be executed once and well you're only registering an event handler through a static so that seemed good enough.

But no, no it's not. The problem is (and it's not clear to me from the documentation) that [`SettingsPane.GetForCurrentView()`][5] if you don't have a view (ie - you're in the App constructor) then it will through a very unhelpful exception. Now sure, this may be *me* making a mistaken assumption on when you can register settings as in WinJS that's when you do it (well technically not in a constructor since there's no constructor really but you do it bright and early)!

## When to register

So once you learn that you need to do it *later* the question is when? Well it turns out that this is where you need to be paying attention to the event model of Windows 8 applications, in particular the `Activated` event. This event is the first point that I've been able to find you can register settings panes (or at least access the current view to setup the event handler).

Ideally you also want to check the [`ActivationKind`][6] so you only register when your application first launches and not other times to avoid duplicate registration.

## Non-global settings

Sometimes you might want settings which are not always there. Say you've got some context-specific help that you want the users to be able to access, there'd be no point having that available from every screen as it might introduce confusion about what the context is.

Well it turns out you can unregister settings panes by simply removing the event handler, so if you've got this:

	SettingsPane.GetForCurrentView().CommandRequested += OnCommandRequested

If you then remove that event handler:

	SettingsPane.GetForCurrentView().CommandRequested -= OnCommandRequested

Any settings created there are automatically removed.

The ideal way to use this would be inside your `OnNavigatedTo` and `OnNavigatedFrom` methods (which come from the `Page` base class) you add/ remove the event handlers.

# Problem 3 - Navigation

Since there's no built-in control and no real settings concept in the platform you can't "go to" a settings pane. Coming from WinJS I found [`SettingsFlyout.showSettings`][7] really quite useful, but since there's no comparative API in XAML you're pretty much stuffed.

So far the _best_ answer I've got from anyone on how to do this is to make your settings flyout (the one from Callisto) a "global" variable so you can change the `IsOpen` property of it to programmatically show it.

Now that just plain sucks.

# Conclusion

Yes this was mostly a rant. As I keep saying the settings in Windows 8 XAML sucks. There's some very pointy edges, particularly when you are comparing the experience to the WinJS experience.

My tips are:

* Use Callisto, it's got a great control for doing settings (and many other good controls)
* Know when and where you need to wire up your event handlers, ideally the Activated event but you can scope them to a particular page
* Try to avoid a UX which requires the users to be forced into the settings, have it discoverable and intuitive for them


  [1]: http://msdn.microsoft.com/en-us/library/windows/apps/hh694083.aspx#4.1.1_Your_app_must_have_a_privacy_statement_if_it_collects_personal_information
  [2]: http://blog.jerrynixon.com/2012/08/how-to-create-windows-8-settings-pane.html
  [3]: http://code.msdn.microsoft.com/windowsapps/App-settings-sample-1f762f49
  [4]: https://github.com/timheuer/callisto
  [5]: http://msdn.microsoft.com/en-us/library/windows/apps/windows.ui.applicationsettings.settingspane.getforcurrentview.aspx
  [6]: http://msdn.microsoft.com/en-us/library/windows/apps/windows.applicationmodel.activation.activationkind
  [7]: http://msdn.microsoft.com/en-us/library/windows/apps/hh770581.aspx
  [8]: http://okra.codeplex.com