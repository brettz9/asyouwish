# Frequently asked questions

<div id="xpcom"></div>
## **How can I use regular XPCOM APIs?**

Firstly, I discourage this if at all possible, since one of the reasons for
AsYouWish is to move toward the future-looking API of the
[Addons SDK](https://developer.mozilla.org/en-US/Add-ons/SDK),
both for the hope of cross-browser support down the road (since other
browsers will not agree to making calls with `@mozilla.org`) and given
that Firefox itself is moving in this direction. That being said, the APIs
may not yet be adequate for your needs, in which case, see
[AMO SDK Docs on XPCOM](https://developer.mozilla.org/en-US/Add-ons/SDK/Guides/XUL_Migration_Guide#xpcom)
on how to gain XPCOM access. If you don't want other browsers to
choke at the object destructuring involved with
`var {Cc, Ci} = require("chrome");` used in the example there, you can
use this longer form instead:
`var chrome = require('chrome'), Cc = chrome.Cc, Ci = chrome.Ci;`.
Please also know that since my code is wrapping the APIs I have
exposed to you (in order to avoid complaints from Firefox which
would prevent their usage in the future if not already), you cannot
use `instanceof` with such objects and get the expected result. (I
also found one cannot use the word `Components` at all within
SDK code, but there seems to be no problem when accessed within
HTML via my add-on. (If you do need the `Components` object, you
can do `require('chrome').components`.) If you come across other
issues, feel free to add an explanation here, or at least report under
[Issues](https://github.com/brettz9/asyouwish/issues).
You can see a chrome demo within AsYouWish's top-level
["demos"](https://github.com/brettz9/asyouwish/tree/master/demos) folder.

<div id="file-access"></div>
## **I want desktop file access**

Ok, this is not a question (unless you are a
[linguist](http://en.wikipedia.org/wiki/Implicature)), but this appears to be
the most common reason for people looking to use AsYouWish so far. First
of all, I suggest your making sure that your needs are not
[already met](http://caniuse.com/#feat=filesystem) by the emerging
[HTML5 standards](http://www.w3.org/TR/file-system-api/) for
[FileSystem](http://www.html5rocks.com/en/tutorials/file/filesystem/) access.
Secondly, as with all AsYouWish needs, I suggest first looking into the
[Addons SDK APIs](https://developer.mozilla.org/en-US/Add-ons/SDK)
for a solution, in this case, the
[file module](https://developer.mozilla.org/en-US/Add-ons/SDK/Low-Level_APIs/io_file).
If there is some inadequacy in the API, you may use the XPCOM APIs
(see the previous question on how to do this and also to see why it is better
to avoid this if possible). You can see a file demo within AsYouWish's
top-level ["demos"](https://github.com/brettz9/asyouwish/tree/master/demos)
folder.

<div id="xul"></div>
## **Can I use XUL elements within my HTML?**

AsYouWish does not enable this capability (unless you can find a way somehow
via the exposed Addons SDK APIs). Mozilla has
[some documentation](https://developer.mozilla.org/en-US/docs/Using_Remote_XUL)
on enabling this, but I wouldn't count on relying on this for the long term
given that the approach of the Addons SDK is to move away from XUL
elements, even there are not currently always quick substitutes (e.g.,
trees). That being said, you might find
[this example](https://github.com/brettz9/asyouwish/issues/4#issuecomment-11670998)
helpful on getting remote XUL to work with HTML via iframe interaction
(though see https://wiki.mozilla.org/XUL:Remote_XUL_bugs for potential
issues that AsYouWish may or may not be able to overcome). Tips on
[migrating a XUL addon](https://developer.mozilla.org/en-US/Add-ons/SDK/Guides/XUL_Migration_Guide)
to an SDK addon may be helpful for AsYouWish code as well.
