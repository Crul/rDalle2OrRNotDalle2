**Disclaimer: This page is a small project, just for fun, there is not relation with DALL-E or Open AI.**

# r/Dalle2 or r/NotDalle2

Play here: https://crul.github.io/rDalle2OrRNotDalle2

## Instructions

- Press the RED button (or swipe left) if you think the image has been done by DALL-E 2 (an AI)
- Press the GREEN button (or swipe right) if you think the image has been done by a human (photo, painting, ...)

## What is this?

- [DALL-E 2](https://en.wikipedia.org/wiki/DALL-E) is an artificial inteligence that generates images from text.
- [r/Dalle2](https://www.reddit.com/r/dalle2) is a subreddit where people post images generated by DALL-E 2.
- [r/NotDalle2](https://www.reddit.com/r/NotDalle2) is a subreddit where people post images that were NOT generated by DALL-E 2, but appear to be.
- This page loads images from those subreddits and you have to guess from which one it is.

## Limitations

This is a personal project made just for fun. Don't expect a full app or game. Some limitations are:

- Posts with specific flairs or without images are filtered, but it's not a perfect filter and will probably see mosaic images or some screenshot of something not generated by DALL-E 2 and marked as if it was.
- Because this page does not store or send any data you cannot save your score. All data will be lost on reload.
- Although this page keeps track of what images have been shown and avoids repetitions, the list of "already seen images" will reset if you close or reload it. So expect to see repetitions in that case.
- To select random reddit posts it uses the easiest solution, a call to https://api.reddit.com/r/DALLE2/random.json (or r/NotDalle2). This endpoint does not return a really random post, it only has access to latest posts. So if you play long enough it's possible to exhaust the possible random posts from one of the subreddits. In that case you will see an error when no new image has been found after some number of attempts.

## Keyboard controls

- Y/D: Answer "Yes, the image is from from r/dalle2 and was made by DALL-E 2"
- N: Answer "No, the image is from r/NotDalle2 and was made by a human"
- W: Load New Image
- T: Show Title
- B: Previous image (Back)
- F: Next image (Forward)
- ?/H: Show Help

## Attribution

Icons [head](https://www.svgrepo.com/svg/6979/head) and [robot](https://www.svgrepo.com/svg/18606/robot) from [SVG Repo](https://www.svgrepo.com)
