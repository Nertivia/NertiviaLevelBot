const nertivia = require('nertivia.js');
const { default: Message } = require('nertivia.js/dist/Message');
const database = require('./database');
const client = new nertivia.Client();
require('dotenv').config();

// give XP every 60 seconds if talk
const giveXPEvery = 60 * 1000;

const getNeededXP = level => level * level * 100;

const getRank = id => {
    const rank = database.get('users')
    .sortBy('level')
    .value().reverse()
    .findIndex(u => u.id === id);
    if (rank < 0) {
        return database.get('users')
        .sortBy('level')
        .value().length
    }
    return rank + 1;
}

function createUserIfDoesntExist(id) {
    const user = database.get('users').find({id}).value();
    if (!user) {
        database.get('users').push({id, level: 1, xp: 0, lastXPDate: Date.now()}).write();
    }
}

const giveXP = id => {
    createUserIfDoesntExist(id);
    const user = database.get('users').find({id}).value();
    return (Date.now() - user.lastXPDate) > giveXPEvery;
}
const addXP = (msg) => {
    const xpToGive = Math.floor((Math.random() * 60) + 1);
    const user = database.get('users').find({id: msg.author.id}).value();
    const neededXP = getNeededXP(user.level);
    let newLevel = user.level;
    let newXP = user.xp += xpToGive;
    // level up
    if (newXP >neededXP) {
        newLevel += 1;
        newXP = newXP - neededXP;
        showLevelUpMessage(newLevel, msg)

    }
    database.get('users').find({id: msg.author.id}).assign({
        lastXPDate: Date.now(),
        xp: newXP,
        level: newLevel,
        tempUsername: msg.author.username
    }).write();
}

client.on("ready", () => {
    console.log("ready")
    client.user.setActivity('/profile')
});

client.on("message", msg => {
    if (msg.author.bot) return;
    if (!process.env.DEVELOPMENT && giveXP(msg.author.id)) {
        addXP(msg)
    }
    commands(msg);
})

/**
 * @param {Message} msg
 */
function commands(msg) {
    const PREFIX = process.env.DEVELOPMENT ? 'd/' :"/"
    if (!msg.content) return;
    const [command, ...args] = msg.content.split(' ');
    if (command === PREFIX + "profile") return profileCommand(msg);
    if (command === PREFIX +"rep") return repCommand(msg);
    if (command === PREFIX +"bg") return backgroundCommand(msg, args);
    if (command === PREFIX +"leaderboard") return leaderboardCommand(msg);
} 
/**
 * @param {Message} msg
 * @param {Array<String>} args
 */
function backgroundCommand(msg, args) {
    createUserIfDoesntExist(msg.author.id);
    if (args?.[0] === "color") {
        database.get('users').find({id: msg.author.id}).assign({
            bgColor: args[1],
            bgUrl: undefined
        }).write();
        profileCommand(msg);
        return
    } 
    if (args?.[0] === "url") {
        database.get('users').find({id: msg.author.id}).assign({
            bgColor: undefined,
            bgUrl: args[1],
        }).write();
        profileCommand(msg);
        return
    } 
    msg.send("Usage:\n/bg color red\n/bg url https://example.com/owo.png")
}
/**
 * @param {Message} msg
 */
function repCommand(msg) {
    if (!msg.mentions.members.first()) {
        msg.send("Usage: /rep @username")
        return;
    }
    const user = msg.mentions.users.first();
    if (user.id === msg.author.id) {
        msg.send("You cannot rep yourself.")
        return;
    }
    const selfUserDb = database.get('users').find({id: msg.author.id}).value();
    const otherUserDb = database.get('users').find({id: user.id}).value();

    const oneday = 86400000;
    const lastRepDate = selfUserDb?.lastRepDate || 0;
    const rep = otherUserDb?.rep || 0;
    const timePassed =  Date.now() - lastRepDate;

    var hours = (timePassed / (1000 * 60 * 60)).toFixed(1);
    if (hours < 24) {
        msg.reply("You may rep again in " + timeConversion(oneday - timePassed))
        return;
    }
    createUserIfDoesntExist(msg.author.id);
    createUserIfDoesntExist(user.id);
    database.get('users').find({id: msg.author.id}).assign({
        lastRepDate: Date.now(),
    }).write();


    database.get('users').find({id: user.id}).assign({
        rep: rep + 1
    }).write();
    msg.send(user + ", you have been repped by " + msg.author+". You now have " + (rep + 1) + " rep points." )
    
    
}
/**
 * @param {Message} msg
 */
function profileCommand(msg) {
    let user = msg.author;
    if (msg.mentions.users.first()) {
        user = msg.mentions.users.first();
    }
    const dbUser = database.get('users').find({id: user.id}).value();
    const bg = {}
    if (dbUser?.bgColor) {
        bg.backgroundColor =  dbUser?.bgColor
    }
    if (dbUser?.bgUrl) {
        bg.backgroundImage= dbUser?.bgUrl
        bg.backgroundPosition= "center"
        bg.backgroundSize= "cover"
    }
    msg.send(`${user.username} Profile`, {
        htmlEmbed: {
            tag: 'div',
            content: {
                tag: 'div',
                content: [
                    ProfileHTMLBuilder(user.avatarURL),
                    RepPoints(dbUser),
                    NameBuilter(user),
                    LevelBuilter(dbUser),
                    XPBarBuilder(dbUser),
                    RankBuilder(getRank(user.id)),
                ],
                styles: {
                    display: "flex",
                    flexDirection: 'column',
                    justifyContent: "center",
                    alignItems: 'center',
                    alignContent: 'center',
                    width: '100%',
                    backgroundColor: "rgba(0,0,0,0.4)",
                }
            },
            styles: {
                display: "flex",
                position: "relative",
                width: '400px',
                borderRadius: "4px",
                overflow: "hidden",
                ...bg
            }
        }
    }).catch(err => console.log(err));
} 
/**
 * @param {Message} msg
 */
function leaderboardCommand(msg) {
    const bg = {}


    const top10Users =  database.get('users')
    .sortBy('level')
    .value().reverse().slice(0, 10)
    const content = [];
    for (let i = 0; i < top10Users.length; i++) {
        const user = top10Users[i];
        content.push(leaderboardItemTemplate(user, i + 1))
        if (i >= 9) break;
    }
    if (top10Users[0].bgColor) {
        bg.backgroundColor =  top10Users[0].bgColor
    }
    if (top10Users[0].bgUrl) {
        bg.backgroundImage= top10Users[0].bgUrl
        bg.backgroundPosition= "center"
        bg.backgroundSize= "cover"
    }

    msg.send(`Leaderboard`, {
        htmlEmbed: {
            tag: 'div',
            content: {
                tag: 'div',
                content,
                styles: {
                    display: "flex",
                    flexDirection: 'column',
                    justifyContent: "center",
                    alignItems: 'center',
                    alignContent: 'center',
                    width: '100%',
                    backgroundColor: "rgba(0,0,0,0.2)",
                    backdropFilter: "blur(10px)",
                    paddingTop: "10px",
                    paddingBottom: "10px",
                    paddingLeft: "10px",
                    paddingRight: "10px"
                }
            },
            styles: {
                display: "flex",
                width: '100%',
                borderRadius: "4px",
                overflow: "hidden",
                ...bg
            }
        }
    }).catch(err => console.log(err));
} 

function leaderboardItemTemplate(dbUser, rank) {
    let string = `#${rank} - ${dbUser.tempUsername} - Level ${dbUser.level}`;
    if (rank === 1){
        string += " :crown:"
    }
    // const bg = {}
    // if (dbUser?.bgColor) {
    //     bg.backgroundColor =  dbUser?.bgColor
    // } else if (dbUser?.bgUrl) {
    //     bg.backgroundImage= dbUser?.bgUrl
    //     bg.backgroundPosition= "center"
    //     bg.backgroundSize= "cover"
    // }

    return {
        tag: 'div',
        content: {
            tag: 'div',
            content: string,
            styles: {
                backgroundColor: "rgba(0,0,0,0.5)",
                paddingLeft: "5px",
                paddingTop: "10px",
                paddingBottom: "10px",
                width: "100%",
                borderRadius: "4px",
                paddingLeft: "10px",
            }
        },
        styles: {
            display: "flex",
            width: "70%",
            overflow: "hidden",
            borderRadius: "4px",
            marginBottom: "1px",

        }
    }
}

/**
 * @param {Message} msg
 */
function showLevelUpMessage(level, msg) {
    msg.send(msg.author +  ", You have leveled up to level " + level+". To see your profile, use the /profile command.")
}

client.on("error", () => {})

function ProfileHTMLBuilder(url) {
    return {
        tag: 'img',
        attributes: {
            src: url,
        },
        styles: {
            borderRadius: "50%",
            width: "80px",
            height: "80px",
            marginBottom: "10px",
            marginTop: "10px"
        }
    }
}
function RepPoints(dbUser) {
    return {
        tag: 'div',
        content: `${dbUser?.rep || 0} Reps`,
        styles: {
            marginTop: "-20px",
            backgroundColor: "var(--primary-color)",
            borderRadius: "10px",
            padding: "4px",
            fontSize: "14px",
        }
    }
}
function NameBuilter(user) {
    return {
        tag: 'strong',
        content: user.username,
        styles: {
            marginTop: "5px"
        }

    }
}
function LevelBuilter(dbUser) {
    return {
        tag: 'div',
        content: `Level ${dbUser?.level || 1}`,
        styles: {
            marginTop: "4px",
            border: "solid 1px var(--primary-color)",
            backgroundColor: 'rgba(0,0,0,0.4)',
            backdropFilter: "blur(8px)",
            borderRadius: "4px",
            padding: "4px",
            fontSize: "14px",
        }
    }
}
function XPBarBuilder(dbUser) {
    const XPNeeded = getNeededXP(dbUser?.level || 1);
    const XPNow = dbUser?.xp || 0;
    const percentFull = XPNow/XPNeeded*100
    return {
        tag: 'div',
        content: [
            {
                tag: 'div',
                content: `${XPNow}/${XPNeeded}`,
                styles: {
                    display: "flex",
                    position: 'absolute',
                    left: "0",
                    right: "0",
                    justifyContent: "center",
                    lineHeight: "1.4"
                }
            },
            {
                tag: 'div',
                styles: {
                    backgroundColor: 'var(--primary-color)',
                    height: "100%",
                    width: percentFull +"%",
                }
            }
        ],
        styles: {
            backgroundColor: 'rgba(0,0,0,0.4)',
            backdropFilter: "blur(8px)",
            height: "20px",
            width: "140px",
            borderRadius: "4px",
            overflow: "hidden",
            marginTop: "10px",
            position: 'relative',
            marginBottom: "10px"
        }
    }
}
function RankBuilder(rank) {
    return {
        tag: 'div',
        content: "#" + rank,
        styles: {
            position: "absolute",
            top: "10px",
            right: "10px"

        }
    }
}


function timeConversion(millisec) {
    var seconds = (millisec / 1000).toFixed(1);
    var minutes = (millisec / (1000 * 60)).toFixed(1);
    var hours = (millisec / (1000 * 60 * 60)).toFixed(1);


    if (seconds < 60) {
        return seconds + " seconds";
    } else if (minutes < 60) {
        return minutes + " minutes";
    } else {
        return hours + " hours";
    }
}


client.login(process.env.TOKEN)