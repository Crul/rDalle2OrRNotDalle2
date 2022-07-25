window.addEventListener('resize', onWindowResize);
document.addEventListener('keydown', onKeyDown);
document.addEventListener('DOMContentLoaded', init);

var filterPostWithFlairs = [
    'DISCUSSION', 'UNVERIFIED', 'NEWS', 'ARTICLE'
];

var ge = id => document.getElementById(id);
var topPanel = ge('topPanel');
var mainImg = ge('mainImage');
var fakeWatermark = ge('fakeWatermark');
var postTitle = ge('postTitle');
var dalle2Btn = ge('dalle2Btn');
var notDalle2Btn = ge('notDalle2Btn');
var showTitleBtn = ge('showTitleBtn');
var answerBtns = [dalle2Btn,notDalle2Btn,showTitleBtn];
var result = ge('result');
var resultText = ge('resultText');
var postLink = ge('postLink');
var userLink = document.querySelector('#user a');
var newImgBtn = ge('newImgBtn');
var showTitleAlwaysChk = ge('showTitleAlwaysChk');
var backHistoryBtn = ge('backHistoryBtn');
var nextHistoryBtn = ge('nextHistoryBtn');
var help = ge('help');
var scoreElems = {
    total: ge('totalScore'),
    dalle2: ge('dalle2Score'),
    notDalle2: ge('notDalle2Score')
};
var swipeHelpLeft = ge('swipeHelpLeft');
var swipeHelpRight = ge('swipeHelpRight');

var postHistory = [];
var isAnswerPending = false;
var currentHistoryIdx = -1;
var loadRetries = 0;
const MAX_LOAD_RETRIES = 15;
var isLoading = false;
var showNextImageOnLoad = true;
var postIds = [];
var score = {
    dalle2: { total: 0, correct: 0},
    notDalle2: { total: 0, correct: 0},
};

const DALLE_SUBREDDIT = 'dalle2';
const NOT_DALLE_SUBREDDIT = 'NotDALLE2';
const GENERIC_TITLE = `r/${DALLE_SUBREDDIT} or r/${NOT_DALLE_SUBREDDIT} ?`;


function init() {
    ['score', 'btns', 'topPanel', 'imgContainer'].forEach(
        id => document.getElementById(id).style.opacity = 1
    );
    topPanel.addEventListener('touchstart', simulateHoverOnTitle, false);
    loadNextImage();
}

function setAnswer(answer) {
    setSwipeHelpVisibility(false);
    var postData = getCurrentPostData();
    if (!postData || postData.answer !== undefined) {
        return;
    }

    var post = postData.post;
    if (post == undefined) {
        return alert('No post loaded');
    }

    setIsAnswerPending(false);
    setFakeWatermark(false, postData);

    var isDalle2 = (post.subreddit == DALLE_SUBREDDIT);
    var scoreObj = isDalle2 ? score.dalle2 : score.notDalle2;
    scoreObj.total++;
    if (answer == isDalle2) {
        scoreObj.correct++;
    }
    postData.answer = answer;
    showResult(post, isDalle2, answer);
    setTimeout(showTitle, 500);
}

function navigateHistory(step) {
    loadHistoryPost(currentHistoryIdx + step);
}

function loadHistoryPost(nextIdx) {
    var isValidIdx = nextIdx >= 0
        && nextIdx < postHistory.length;

    if (!isValidIdx) {
        return;
    }

    if (!postHistory[nextIdx]) {
        showTitle();
        return;
    }

    mainImg.src = '';
    closeResult();
    currentHistoryIdx = nextIdx;
    var postData = getCurrentPostData();
    var isAnswerPending = postData.answer === undefined;
    setIsAnswerPending(isAnswerPending);
    setFakeWatermark(isAnswerPending, postData);
    updateHistoryBtns();
    showTitle();

    mainImg.src = postData.metadataKey
        ? getImageUrlBySize(postData.post, postData.metadataKey)
        : postData.post.url;

    document.body.className = '';
}

function showTitle(force) {
    var postData = getCurrentPostData();
    if (!postData) {
        postTitle.innerHTML = GENERIC_TITLE;
        return;
    }

    var post = postData.post;
    if (postData.answer !== undefined) {
        var isDalle2 = (post.subreddit == DALLE_SUBREDDIT);
        var isCorrectAnswer = (postData.answer == isDalle2);
        postTitle.innerHTML =
            `r/[${isDalle2 ? DALLE_SUBREDDIT : NOT_DALLE_SUBREDDIT}] `
            + (isCorrectAnswer ? '✅' : '❌')
            + ` <a href="${getRedditPostAHref(post)}" target="_blank">${post.title}</a>`
            + ` by <a href="${getRedditUserAHref(post)}" target="_blank">${post.author}</a>`;

    } else {
        postTitle.innerHTML = (force || showTitleAlwaysChk.checked)
            ? `${postData.post.title} by ${postData.post.author}`
            : GENERIC_TITLE;
    }
}

function simulateHoverOnTitle() {
    topPanel.className = 'force-visible';
    setTimeout(() => topPanel.className = '', 3000);
}

function loadNextImage() {
    isLoading = true;
    isDalle2 = Math.random() > 0.5;
    postHistory.push(undefined);
    loadRetries = 0;
    setFakeWatermark(true);
    loadImageRecursive(isDalle2);
}

function loadImageRecursive(isDalle2) {
    if (loadRetries >= MAX_LOAD_RETRIES) {
        var tryAgain = confirm(
            `Cannot find a valid Reddit post after ${loadRetries} attempts`
            + '\r\nDo you want to continue tryting?'
        );
        if (tryAgain) {
            loadRetries = 0;
        } else {
            document.body.className = '';
            isLoading = false;
            return;
        }
    }
    loadRetries++;

    var client = new XMLHttpRequest();
    client.onload = handleHttpRequest;
    client.onerror = handleHttpRequest;
    var sub = isDalle2 ? DALLE_SUBREDDIT : NOT_DALLE_SUBREDDIT;
    var randomPostUrl = `https://api.reddit.com/r/${sub}/random.json?$rnd=${Math.random()}`;
    client.open('GET', randomPostUrl);
    client.send();

    function handleHttpRequest() {
        if (this.status != 200 || this.responseText == null) {
            alert('Could not load reddit. If you have something blocking it (uMatrix, uBlock, ...), you need to disable it.')
            return console.error(data);
        }

        var data = JSON.parse(this.responseText);
        var post = getRedditPost(data);
        // console.debug(post);

        var postId = post.id;
        if (postIds.indexOf(postId) >= 0) {
            return loadImageRecursive(isDalle2);
        }
        postIds.push(postId);

        if (post.link_flair_text
            && filterPostWithFlairs.indexOf(post.link_flair_text.toUpperCase()) >= 0) {
            return loadImageRecursive(isDalle2);
        }

        var url = post.url;
        if (post.media_metadata) {
            // console.debug(post.media_metadata);

            var metadataKey = getRandomMetadataKey(post);
            if (metadataKey) {
                setNextPost(post, metadataKey);
            } else {
                // console.debug('Not square images');
                loadImageRecursive(isDalle2);
            }

        } else if (
            url.startsWith('https://i.redd.it')
            || url.startsWith('https://i.imgur.com')
        ) {
            setNextPost(post);

        } else if (
            url.startsWith('https://labs.openai.com') // Open AI Labs
            || url.startsWith('https://v.redd.it')    // Reddit video
            || url.startsWith('https://imgur.com/')   // Imgur gallery
            || url.startsWith('https://youtu.be/')    // YouTube video
        ) {
            // console.debug('Not supported: ' + url);
            loadImageRecursive(isDalle2);

        } else {
            // console.debug('Post not handled');
            // console.debug('https://www.reddit.com' + post.permalink);
            loadImageRecursive(isDalle2);
        }
    }
}

function setNextPost(post, metadataKey) {
    postHistory[postHistory.length - 1] = {
        post: post,
        metadataKey: metadataKey,
        answer: undefined
    };
    document.body.className = '';
    isLoading = false;
    if (showNextImageOnLoad) {
        showNextImageOnLoad = false;
        showNextImage();
    }
}

function showNextImage() {
    for (var i = currentHistoryIdx + 1; i < postHistory.length; i++) {
        if (postHistory[i] && postHistory[i].answer === undefined) {
            loadHistoryPost(i);

            var isLastLoadedPost = i == postHistory.length - 1;
            if (isLastLoadedPost) {
                loadNextImage();
            }

            return;
        }
    }

    if (document.body.className == 'loading') {
        return;
    }

    if (currentHistoryIdx == postHistory.length - 2 || !postHistory[currentHistoryIdx]) {
        showNextImageOnLoad = true;
        document.body.className = 'loading';
        setIsAnswerPending(false);
        mainImg.src = '';
        showTitle();

        if (!isLoading) {
            loadNextImage();
        }
    }
}

function updateHistoryBtns() {
    backHistoryBtn.className =
        (currentHistoryIdx > 0) ? '' : 'disabled';

    nextHistoryBtn.className =
        currentHistoryIdx < postHistory.length - 2 ? '' : 'disabled';
}

function closeResult() {
    result.className = '';
}

function openHelp() {
    help.style.display = 'block';
}

function closeHelp() {
    help.style.display = 'none';
}

function getRedditPost(data) {
    if (Array.isArray(data)) {
        for (var i in data) {
            var elem = data[i];
            var post = getRedditPost(elem);
            if (post != null)
                return post;
        }
        return;
    }

    switch (data.kind) {
        case 'Listing':
            return getRedditPost(data.data.children);
        case 't3': // posts
            return data.data;
    }
}

function showResult(post, isDalle2, answer) {
    var isCorrect = (isDalle2 == answer);
    var correctWrong = isCorrect ? 'CORRECT' : 'WRONG';
    var yesNo = isCorrect ? 'Yes' : 'No';
    var madeBy = (isDalle2 ? 'was made by an AI (DALL-E 2)' : 'is human made');
    var sub = (isDalle2 ? DALLE_SUBREDDIT : NOT_DALLE_SUBREDDIT);

    resultText.innerHTML = `<h1>${correctWrong}</h1><br />`+
        `${yesNo}, the image ${madeBy}, it was posted on <a>r/${sub}</a>:`;

    postLink.href = getRedditPostAHref(post);
    postLink.innerHTML = post.title;

    userLink.href = getRedditUserAHref(post);
    userLink.innerHTML = post.author;

    result.className = (isCorrect ? 'correct' : 'wrong');
    newImgBtn.focus();

    renderScore();
}

function renderScore() {
    scoreElems.total.innerHTML = `${score.dalle2.correct + score.notDalle2.correct}`
        + `/${score.dalle2.total + score.notDalle2.total}`;

    scoreElems.dalle2.innerHTML = `${score.dalle2.correct}`
        + `/${score.dalle2.total}`;

    scoreElems.notDalle2.innerHTML = `${score.notDalle2.correct}`
        + `/${score.notDalle2.total}`;
}

function getRandomMetadataKey(post) {
    var mdKeys = Object.keys(post.media_metadata)
        .sort((a, b) => 0.5 - Math.random());

    for (var k in mdKeys) {
        var metadataKey = mdKeys[k];
        var imgInfo = post.media_metadata[metadataKey].s;
        var maxAspectRatioDeviation = 0.03;
        var aspectRatio = imgInfo.x / imgInfo.y;
        if (Math.abs(1 - aspectRatio) < maxAspectRatioDeviation) {
            return metadataKey;
        }
    }
}

function getImageUrlBySize(post, metadataKey) {
    var imgs = post.media_metadata[metadataKey].p;
    var validImgs = imgs.filter(img => Math.min(img.x, img.y) > mainImg.width);

    return htmlDecode(
        validImgs.length > 0 ? validImgs[0].u
        : post.media_metadata[metadataKey].s.u
    );
}

function getCurrentPostData() {
    return postHistory[currentHistoryIdx];;
}

function setIsAnswerPending(value) {
    isAnswerPending = value;
    var btnCssClass = value ? 'answerPending' : '';
    answerBtns.forEach(btn => btn.className = btnCssClass);
    mainImg.className = value ? 'answerPending' : '';
}

function setFakeWatermark(isAnswerPending, postData) {
    var isAnsweredNotDalle = !isAnswerPending && postData && postData.post.subreddit == NOT_DALLE_SUBREDDIT;
    fakeWatermark.style.display = isAnsweredNotDalle ? 'none' : 'block';
}

function onKeyDown(event) {
    switch(event.key.toUpperCase()) {
        case 'Y':
        case 'D': setAnswer(true);      break;
        case 'N': setAnswer(false);     break;
        case 'W': showNextImage();      break;
        case 'T': showTitle(true);      break;
        case 'B': navigateHistory(-1);  break;
        case 'F': navigateHistory(1);   break;
        case 'ARROWLEFT':
        case 'ARROWUP': moveFocus(-1);  break;
        case 'ARROWRIGHT':
        case 'ARROWDOWN': moveFocus(1); break;
        case '?':
        case 'H': openHelp();           break;
        case 'ESCAPE':
            closeHelp();
            closeResult();
            break;
        break;
    }
}

function moveFocus(step) {
    var actElem = document.activeElement;
    if (actElem == showTitleAlwaysChk) {
        actElem = actElem.parentElement;
    }

    if (actElem.tagName != 'BUTTON'
        && actElem.tagName != 'LABEL') {
        if (dalle2Btn.className.indexOf('answerPending') >= 0) {
            dalle2Btn.focus();
        } else {
            newImgBtn.focus();
        }
        return;
    }

    var elem = step > 0
        ? actElem.nextElementSibling
        : actElem.previousElementSibling;
    while (elem) {
        if (elem.tagName == 'BUTTON' || elem.tagName == 'LABEL') {
            elem.focus();
            return;
        }

        elem = step > 0
            ? elem.nextElementSibling
            : elem.previousElementSibling;
    }

    elem = actElem;
    var lastNonNullElem = elem;
    while (elem) {
        elem = step > 0
            ? elem.previousElementSibling
            : elem.nextElementSibling;

        if (elem) {
            lastNonNullElem = elem;
        }
    }
    lastNonNullElem.focus();
}

function showSwipeHelp() {
    setSwipeHelpVisibility(true);
    setTimeout(() => setSwipeHelpVisibility(false), 5000);
}

function setSwipeHelpVisibility(visible) {
    swipeHelpLeft.className = visible ? 'visible' : '';
    swipeHelpRight.className = visible ? 'visible' : '';
}

function onWindowResize() {;
    var postData = getCurrentPostData();
    if (!postData || !postData.metadataKey) {
        return;
    }

    var post = postData.post;
    var metadataKey = postData.metadataKey;
    var imgs = post.media_metadata[metadataKey].p;
    var validImgs = imgs
        .filter(imgOpt => Math.min(imgOpt.x, imgOpt.y) > mainImg.width);

    var imgUrl = getImageUrlBySize(post, metadataKey);

    mainImg.src = imgUrl;
}

function getRedditPostAHref(post) {
    return 'https://www.reddit.com' + post.permalink;
}

function getRedditUserAHref(post) {
    return 'https://www.reddit.com/u/' + post.author;
}

function htmlDecode(input) {
    // https://css-tricks.com/snippets/javascript/unescape-html-in-js/
    var e = document.createElement('div');
    e.innerHTML = input;
    return e.childNodes.length === 0 ? '' : e.childNodes[0].nodeValue;
}

/* https://gist.github.com/SleepWalker/da5636b1abcbaff48c4d */
var isFirstTouch = true;
var touchstartX = 0;
var touchstartY = 0;
var touchendX = 0;
var touchendY = 0;
const MIN_DIST_TO_SWIPE = 50;
const MIN_XY_RATIO_TO_SWIPE = 0.9;

var gesuredZone = document.body;

gesuredZone.addEventListener('touchstart', function(event) {
    if (isFirstTouch)
        showSwipeHelp();

    touchstartX = event.changedTouches[0].screenX;
    touchstartY = event.changedTouches[0].screenY;
    isFirstTouch = false;
}, false);

gesuredZone.addEventListener('touchend', function(event) {
    touchendX = event.changedTouches[0].screenX;
    touchendY = event.changedTouches[0].screenY;
    handleGesure();
}, false);

function handleGesure() {
    var swipedDistX = touchstartX - touchendX;
    var absSwipedDistX = Math.abs(swipedDistX);
    if (absSwipedDistX < MIN_DIST_TO_SWIPE)
        return;

    var absSwipedDistY = Math.abs(touchstartY - touchendY);
    if (absSwipedDistY == 0 || absSwipedDistX/absSwipedDistY < MIN_XY_RATIO_TO_SWIPE)
        return;

    var swipedLeft = (swipedDistX > 0);
    if (isAnswerPending) {
        setAnswer(swipedLeft);
        return;
    }

    navigateHistory(swipedLeft ? -1 : 1);
}
