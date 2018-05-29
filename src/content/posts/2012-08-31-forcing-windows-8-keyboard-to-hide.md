---
  title: "Forcing Windows 8 soft keyboard to hide"
  metaTitle: "Forcing Windows 8 soft keyboard to hide"
  description: "Hack of the day goes to how you hide the soft keyboard on a Windows 8 application"
  revised: "2012-08-31"
  date: "2012-08-31"
  tags: 
    - "xaml"
  migrated: "true"
  urls: 
    - "/xaml/forcing-windows-8-keyboard-to-hide"
  summary: ""
---
We had a bug raised that when the user presses enter on the sign in screen the login process begins but the soft keyboard (the on-screen keyboard) doesn't get dismissed so the user gets the impression they can keep interacting with it. Through some [Monkey Testing][1] this produced a bug where the application would crash because it would fire off multiple requests to log in as they could keep hitting enter and eventually crashing the application.

The logical solution is to hide the soft keyboard.

But here's a question, how *would* you hide the keyboard in Windows 8 XAML?

# Thought #1 - remove focus

I'm a [web guy][2] so when I want to defocus an element I use `blur`, so that's my first point of call.

But of course there's no `Blur` method on XAML elements. Strike that off the list.

# Thought #2 - change focus

My research lead me to [Focus][3] as a method on controls which takes a [FocusState][4] enum value, one of the properties being `Unfocused`. Bingo!

But every time I set it the app would crash with an `AccessViolationException` (or something to that effect). Great, that's no help now is it! Moving on...

# Thought #3 - FocusManager

Fine well apparently WPF has a [FocusManager][5] that you can also use to change focus. This is [also available][6] in Windows 8 XAML, but do you think that'd have the `SetFocusedElement` on it?

No, that'd be too simple! Guess we can strike this one down too

# One hack to rule them all

Since you don't have access to the soft keyboard programmatically and every attempt made to change focus was either throwing exceptions or simply missing anything useful it was time to think outside the box.

It was time for a **hack**!

A funny thing about input controls in Windows 8 XAML is if they are not enabled, ie - read-only, the soft keyboard wont display for them. Well that makes sense doesn't it and hey, they were bound to get *something* right eventually!

This gave me an idea, let's make the textbox read-only. The only problem is this has to be done *as early as possible*, even before we validate, to prevent undesired keyboard mashing. This also means that our validation wont be done so there's a chance that we'll have a failure in sign in and need to make the fields writeable again.

So all we did was add this to our event handler:

    username.IsEnabled = password.IsEnabled = false;
    username.IsEnabled = password.IsEnabled = true;

Yes, one line after the other like that and you hide your soft keyboard. **facepalm**

# TL;DR

Want to hide your soft keyboard in Windows 8 XAML?

![Disable all the things][7]


  [1]: http://en.wikipedia.org/wiki/Monkey_test
  [2]: https://www.aaron-powell.com/xaml/xaml-by-a-web-guy
  [3]: http://msdn.microsoft.com/en-us/library/windows/apps/hh702161.aspx
  [4]: http://msdn.microsoft.com/en-us/library/windows/apps/windows.ui.xaml.focusstate.aspx
  [5]: http://msdn.microsoft.com/en-us/library/system.windows.input.focusmanager.aspx
  [6]: http://msdn.microsoft.com/en-us/library/windows/apps/windows.ui.xaml.input.focusmanager.aspx
  [7]: https://www.aaron-powell.com/get/memes/disable-all-the-things.jpg