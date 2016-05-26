const baseUrl   = 'localhost:3000';
const ddp       = new DDPClient(`ws://${baseUrl}/websocket`);

let feedsCounter = 0;
const reconnectTime = 5000;

function startBackground() {
    let email = localStorage.getItem('email');
    let psswd = localStorage.getItem('psswd');
    let loginParams = { password: psswd, user:{ email:email } };

    if (!!email && !!psswd) {
        ddp.call('login', loginParams)
            .then(res => {
                ddp.call('whoami').then(currentUser => {
                    ddp.subscribe('Feeds', currentUser.profile.company);
                    ddp.watch('Feeds', (changedDoc, message) => {

                        if(currentUser._id === changedDoc.ownerId){
                            if (message === 'added') {
                                if (!changedDoc.seen) {
                                    feedsCounter++;
                                }
                            }

                            if (message === 'changed') {
                                if (!changedDoc.seen) {
                                    feedsCounter++;
                                } else {
                                    feedsCounter--;
                                }
                            }
                        }

                        chrome.browserAction.setBadgeText({ text: (feedsCounter) ? feedsCounter.toString() : '' });
                    });

                });
            }).catch(e => {
                console.log(e);
                setTimeout(startBackground, reconnectTime);
            });
    }else {
        setTimeout(startBackground, reconnectTime);
    }
}

ddp.connect().then(() => {
    console.log('Connected!');
    startBackground();
});

chrome.browserAction.setBadgeText({ text: (feedsCounter) ? feedsCounter.toString() : '' });
