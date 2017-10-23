var fs = require("fs")
var readline = require("readline")

const BOT_LOOP = 60 * 1000
var botPortal = "./portal.json"
var dataPath = "/home/cblgh/dats/rotonde-scraped/scraped.txt"
var portalPath = "/home/cblgh/dats/rotonde-scraped/network.txt"
var history = {}
var writeQueue = []
var bot // contains the bot's portal
var greeting = /h.+llo|hi+|greetings|he+ya*|sup/i

function findMentions() {
    var reader = createReader(dataPath)

    reader.on("line", (line) => {
        try {
            var msg = JSON.parse(line)
            if (msg.target && msg.target === bot.dat && !history[msg.timestamp+msg.source] && msg.message.search(greeting) >= 0) {
                // remember that we replied to this message
                history[msg.timestamp+msg.source] = true 
                reply(msg.source)
                follow(msg.source)
            }
        } catch (e) { console.error(e) }
    })
    // the bot has finished reading the scraped data
    reader.on("close", () => {
        saveFeed()
    })
}

function reply(target) {
    var greeting = `Hi!`
    console.log("i said hi to someone!")
    writeToFeed(greeting, target)
}

function follow(target) {
    if (bot.port.indexOf(target) < 0) {
        bot.port.push(target)
    }
}

function writeToFeed(content, target) {
    var msg = {message: content, whisper: true, timestamp: Date.now()}
    if (target) { msg.target = target}
    bot.feed.push(msg)
}

function saveFeed() {
    fs.readFile(botPortal, (e, data) => {
        if (e) { console.error("Error reading bot's portal.json", e); return }
        try {
            fs.writeFile(botPortal, JSON.stringify(bot, null, 2), (e) => {
                if (e) { console.error("Error writing bot's portal.json", e); return }
                writeQueue = [] // clear queue
                saveHistory()
            })
        } catch (e) { console.error("Error parsing bot's portal.json", e); return }
    })
}

function saveHistory() {
    fs.writeFile("./history", JSON.stringify(history), (e) => {
        if (e) { console.error("Failed to write history", e) }
    })
}

function createReader(path) {
    var reader = readline.createInterface({
        input: fs.createReadStream(dataPath)
    })
    return reader
}

fs.readFile("./history", (e, data) => {
    if (e) {
        console.error(e)
    } else {
        history = JSON.parse(data.toString())
    }
    fs.readFile(botPortal, (e, data) => {
        try {
            bot = JSON.parse(data.toString())
        } catch (e) { console.error(e); return }
        findMentions()
        setInterval(findMentions, BOT_LOOP)
    })
})
