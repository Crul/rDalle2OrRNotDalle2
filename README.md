**Disclaimer: This page is a small project, just for fun, there is not relation with DALL-E or Open AI.**

# r/Dalle2 or r/NotDalle2

Play here: https://crul.github.io/rDalle2OrRNotDalle2

## What is this?

- [DALL-E 2](https://en.wikipedia.org/wiki/DALL-E) is an artificial inteligence that generates images from text.
- [r/Dalle2](https://www.reddit.com/r/dalle2) is a subreddit where people post images generated by DALL-E 2.
- [r/NotDalle2](https://www.reddit.com/r/NotDalle2) is a subreddit where people post images that were NOT generated by DALL-E 2, but appear to be.
- This page loads images from those subreddits and you have to guess from which one it is.

## Limitations

This is a personal project made just for fun. Don't expect a full app or game. Some limitations are:

- Because this page does not store or send any data you cannot save your score. All data will be lost on reload.
- Although this page keeps track of what images have been shown and avoids repetitions, the list of "already seen images" will reset if you close or reload it. So expect to see repetitions in that case.
- To select random reddit posts it uses the easiest solution, a call to https://api.reddit.com/r/DALLE2/random.json (or r/NotDalle2). This endpoint does not return a really random post, it only has access to latest posts. So if you play long enough it's possible to exhaust the possible random posts from one of the subreddits. In that case you will see an error when no new image has been found after some number of attempts.
- Posts without images are filtered, but there are post with images that are not images generated by DALL-E 2 (like screenshots of some related topic). I haven't even tried to filter those. 

## Keyboard controls

- Y,R: Answer "Yes, it's a REAL r/dalle2 post"
- N: Answer "No, it's a FAKE r/NotDalle2 post"
- W: Load New Image
- T: Show Title
- B: Previous image (Back)
- F: Next image (Forward)
- ?,H: Show Help
