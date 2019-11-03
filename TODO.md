#Paid addons

## Secondary Clock
Add a secondary timezone that is displayed to the user 

## Custom Background Picture
Allow the user to choose a photo for their background

## Selection of animated backgrounds
Allow user to choose from a selection of animated movie backgrounds
### Notes
This may require the UI to update so you can still see the data against busy backgrounds

## Secondary Weather
Add additional weather areas so the user can maybe scroll through them or something like that or possibly see them all at once.

## Error handling
Currently error handling is garbage and untested. I don't even know if the messages show up properly. Need to make sure the css for error messages is such that they show up and handle things appropriately.

## Sharing Mechanisms
Facebook, Twitter, whatever other bullshit into the sidebar so people can share more easily. (Does anyone really use that stuff?)

## Suggestions Mechanism
Add a means of providing better suggestions in the sidebar

## ToDo list
Put the "todo list" into the settings area as a tab so people can see what's coming up

#Necessary items

## Review Location caching method
I think the way I'm doing this may be janky... I should review

## Debounce the color picker
Chrome lets you slide the color picker all over and it ends up timing out because I'm updating webstorage way too fast.

## Why doesn't "settings" work when clicking it from within the page?

## Fonts
Trying to determine how to get a bunch of fonts in here. People are invariably going to want a bunch of weird ass fonts
so it seems like having a mechanism where they could add their own might be nice. 

As a compromise I could build in 10-20 fonts and let people pick. I'd need to pick a good set of variations.

I could build in "pick your own" based on the google font API which gets way too many fonts...lots of work, not much 
benefit, and the key is compromised just like the weather key.

