require('dotenv').config()
const Twit = require('twit')
const CronJob = require('cron').CronJob
const Firebase = require('firebase-admin')
const serviceAccount = require("https://github.com/habil1hsan/twitter-api/blob/45e925b0fce7de49036cb3c4f402477a3e0fd8cc/ayang-zee-firebase-adminsdk-4a8v0-667e425f7d.json")

const T = new Twit({
  consumer_key: 'uDyZoj9dPAL5TVGyge37n7Z1r',
  consumer_secret: '2IpJ3IVSYCWC1i9OtotuUoRR66AnKarnOsNcZqHrT1VAd4jdGE',
  access_token: '1126042316026703872-ZmuJFHJZlSgT1m8qtqYW6P0FbrKyXg',
  access_token_secret: '5l0U4HybKjZsVkTsstz6EZtLHXh7WQwzC7te8d5LYH0xN',
  timeout_ms: 60 * 1000
})

Firebase.initializeApp({
  credential: Firebase.credential.cert(serviceAccount),
  databaseURL: 'https://ayang-zee-default-rtdb.asia-southeast1.firebasedatabase.app/'
})
const db = Firebase.database()
const ref = db.ref("/tweetData")

let tweetData = {}
ref.on("value", function (snapshot) {
  tweetData = snapshot.val()
}, function (errorObject) {
  console.log("The read failed: " + errorObject.code)
})

//Scheduled tweet
new CronJob('* * * * *', function () {
  let failedTweet = []

  const newDate = new Date()
  const hour = newDate.getHours('en-US', { timezone: 'Asia/Jakarta' })
  const minute = newDate.getMinutes('en-US', { timezone: 'Asia/Jakarta' })
  const time = `${hour}:${minute}`
  console.log('Starting auto tweet....... @' + time)

  for (let i = 0; i < tweetData.scheduledTweet.length; i++) {
    if (tweetData.scheduledTweet[i].time == time) {
      T.post('statuses/update', { status: tweetData.scheduledTweet[i].message }, function (err, data, response) {
        if (err) {
          console.error('ERROR ====> ' + err.message)
          console.log(tweetData.scheduledTweet[i])
          failedTweet.push(tweetData.scheduledTweet[i])
        } else {
          console.log('Success tweet: ' + tweetData.scheduledTweet[i].message)
        }
      })
    }
  }

  setTimeout(() => {
    failedTweet.length > 0 ? ref.child('failedTweet').set(failedTweet) : ''
  }, 1000)
}, null, true, 'Asia/Jakarta').start()

// Failed Tweet
new CronJob('*/5 * * * * *', function () {
  if (tweetData.failedTweet) {
    let failedTweet = tweetData.failedTweet
    console.log('TWEETING FAILED TWEET!!!!!!')
    for (let i = 0; i < tweetData.failedTweet; i++) {
      T.post('statuses/update', { status: tweetData.failedTweet[i].message }, function (err, data, response) {
        if (err) {
          console.error('ERROR ====> ' + err.message)
        } else {
          console.log('Success tweet: ' + tweetData.failedTweet[i].message)
          failedTweet.splice(i, 1)
        }
      })
    }

    setTimeout(() => {
      ref.child('failedTweet').set(failedTweet)
    }, 1000)
  } else {
    console.log('Failed tweet is clear :)')
  }
}, null, true, 'Asia/Jakarta').start()
