# Secondary Clock
Add a secondary timezone that is displayed to the user 

# Custom Background Picture
Allow the user to choose a photo for their background

# Selection of animated backgrounds
Allow user to choose from a selection of animated movie backgrounds
## Notes
This may require the UI to update so you can still see the data against busy backgrounds

# Custom Font Color
Allow users to choose their font color (and their secondary font color for temp mins). 

# Secondary Weather
Add additional weather areas so the user can maybe scroll through them or something like that or possibly see them all at once.

# Error handling
Currently error handling is garbage and untested. I don't even know if the messages show up properly. Need to make sure the css for error messages is such that they show up and handle things appropriately.

# Location caching
Cache location so searches are faster. This is already done to some extent but I'm finding location querying is really slow and the weather calls are fast. I'd like to make it so when the user loads the page, we get weather with wherever they last were, and update when we find the new data. This will need some kind of indication of what's going on so it doesn't get annoying though.

# Sharing Mechanisms
Facebook, Twitter, whatever other bullshit

# Custom date formats
Allow for a few different date format options