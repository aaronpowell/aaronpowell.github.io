---
  title: "WebView, oh you!"
  metaTitle: "WebView, oh you!"
  description: "Oh that WebView control is a funny one"
  revised: "2012-08-29"
  date: "2012-08-28"
  tags: 
    - "xaml"
    - "facepalm"
  migrated: "true"
  urls: 
    - "/xaml/webview-oh-you"
  summary: ""
---
Today can only be summarized by this:

![What is this, I don't even][1]

While I'm having my fun in the dark side of development [doing XAML][2] I hit something really whacky today, using the [WebView control][3].

# Here be dragons

The WebView control seems to be a little bit special, and not really special in a good way and it seems others have also found it [limiting][4].

But I hit an interesting problem with the WebView control rendering, in particular rendering it in a settings panel. Long story short **it didn't display**.

Here's the XAML:

    <UserControl>
        <Grid>
            <WebView Source="https://www.aaron-powell.com" />
        </Grid>
    </UserControl>

(I omitted the namespace guff for you)

Sure I might not be a XAML wiz but I'm pretty sure that that should work, and according to the limited knowledge of how layout works this would be fine right? My WebView doesn't have sizes specified so it should fill out to the whole area.

Well you're wrong. It would seem that when you use a WebView control that doesn't have a size set on it, nor on its parents it just goes 0x0.

This coupled with the WebView's inability to animate with the rest of the controls in its container makes leaves me just bemused.

# Conclusion

Avoid the WebView control. Avoid it at all costs.
 

  [1]: https://www.aaron-powell.com/get/memes/what-is-this-i-dont-even-spiderman.jpg
  [2]: https://www.aaron-powell.com/xaml/xaml-by-a-web-guy
  [3]: http://msdn.microsoft.com/en-us/library/windows/apps/windows.ui.xaml.controls.webview
  [4]: http://nicksnettravels.builttoroam.com/post/2012/04/21/Limitations-of-the-WebView-in-Windows-8-Metro-Apps.aspx