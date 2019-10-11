const connectivity = require('connectivity');
const https = require('https');
const convert = require('xml-js');
const fs = require('fs');
const Discord = require('discord.js');
const SaintMinou = new Discord.Client();

SaintMinou.on('ready', () => {
    console.log(`Connecté en tant que ${SaintMinou.user.tag}`);

    // Statut aléatoire
    randomActivity();

    // RSS Feed
    rssRequest('https://store.steampowered.com/feeds/daily_deals.xml', './data/steam_daily_deals.json', 'steamDailyDeals');
    rssRequest('https://blog.humblebundle.com/rss', './data/humble_game_bundle.json', 'humbleGameBundle');
    rssRequest('https://itch.io/feed/sales.xml', './data/itch_io_sales.json', 'itchIOSales');
    rssRequest('https://itch.io/games/free.xml', './data/itch_io_free.json', 'itchIOFree');
    
    setInterval(function () {
        // Vérification de la connexion toutes les 5 minutes
        connectivity(function (online) {
            if (online) {
                console.log('Connexion à internet: OK');

                // Statut aléatoire toutes les 5 minutes
                randomActivity();

                // RSS Feed toutes les 5 minutes
                rssRequest('https://store.steampowered.com/feeds/daily_deals.xml', './data/steam_daily_deals.json', 'steamDailyDeals');
                rssRequest('https://blog.humblebundle.com/rss', './data/humble_game_bundle.json', 'humbleGameBundle');
                rssRequest('https://itch.io/feed/sales.xml', './data/itch_io_sales.json', 'itchIOSales');
                rssRequest('https://itch.io/games/free.xml', './data/itch_io_free.json', 'itchIOFree');
            } else {
                console.log('Connexion à internet: KO');
            }
        });
    }, 300000);
});

SaintMinou.on('message', msg => {
    // msg.content = msg.content.replace(/[\u200B-\u200D\uFEFF]/g, ''); // Supprimer les zero-width characters
    
    // Test du ping
    if (msg.content === 'Ping') {
        msg.reply('Pong !');
    }

    // Reply
    let mots = [
        'minou',
        'chat',
        'chaton',
        'chatounet',
        'miaou', 
        'ron-ron',
        'meow',
        'miaow',
        'mew',
        'purr',
        'nyaa'
    ];
    if (messageContient(msg, mots) && msg.author.username !== 'Saint-Minou') {
        msg.reply('Meow !');
    }

    // Supprimer les messages d'un channel
    if (msg.content == "!clean") {
        if (msg.member.hasPermission("MANAGE_MESSAGES")) {
            msg.channel.fetchMessages()
                .then(function (list) {
                    msg.channel.bulkDelete(list);
                }, function (err) { msg.channel.send("ERROR: ERROR CLEARING CHANNEL.") })
        }
    }
});

// Message de bienvenue aux nouveaux membres sur le canal #general
SaintMinou.on('guildMemberAdd', member => {
    const generalChannel = member.guild.channels.find(ch => ch.name === 'discussions');
    if (!generalChannel) { return; }

    let embed = new Discord.RichEmbed()
        .setColor('#FFF2CC')
        .setDescription(`Bienvenue chez les détendus <@${member.user.id}> ! :slt: Le Saint-Minou veille sur toi. ~ Meow`);
    return generalChannel.send({ embed });
});

// Message pour avertir les autres membres du départ de l'un d'entre eux sur le canal #general
SaintMinou.on('guildMemberRemove', member => {
    const generalChannel = member.guild.channels.find(ch => ch.name === 'discussions');
    if (!generalChannel) { return; }

    let embed = new Discord.RichEmbed()
        .setColor('#FFF2CC')
        .setDescription(`<@${member.user.id}> ne croit plus en le Saint-Minou... :du:`);
    return generalChannel.send({ embed });

});

SaintMinou.login('NjMxMDMzNTYyMzA4NTQyNDc1.XZxAWA.nMpvcrzoZXXBwM41Z28XkpVGqqk');

// Fonctions
function randomActivity() {
    let activities = [
        [
            'Les Aristochats',
            'WATCHING'
        ],
        [
            'Cat Simulator',
            'PLAYING'
        ],
        [
            'Goat Simulator',
            'PLAYING'
        ],
        [
            'Music for Cats',
            'LISTENING'
        ],
        [
            'des papillons',
            'WATCHING'
        ],
        [
            'observer les oiseaux',
            'PLAYING'
        ],
        [
            'chat',
            'PLAYING'
        ],
    ];

    let noActivity = Math.floor(Math.random() * (activities.length));
    setActivity(activities[noActivity]);
}

function setActivity (activity) {
    SaintMinou.user.setActivity(activity[0], { type: activity[1] })
        .then(presence => console.log(`Activity set to ${presence.game ? presence.game.name : 'none'}`))
        .catch(console.error);
}

function rssRequest (url, dataPath, dataParseFunction) {
    const options = {
        headers: { 'User-Agent': 'Mozilla/5.0' }
    };

    https.get(url, options, (resp) => {
        let data_request = '';

        // A chunk of data has been recieved.
        resp.on('data', (chunk) => {
            data_request += chunk;
        });

        // The whole response has been received. Print out the result.
        let readObj = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

        resp.on('end', () => {
            let xml = data_request;
            result = convert.xml2js(xml, { compact: true, spaces: 4 });

            readObj = dataParse[dataParseFunction](readObj, result);

            let json = JSON.stringify(readObj);
            fs.writeFile(dataPath, json, 'utf8', (err) => {
                if (err) throw err;
                console.log('Les url ont bien été enregistrées.');
            });
        });
    }).on("error", (err) => {
        console.log("Error: " + err.message);
    });
}

function messageContient (msg, mots) {
    let reponse = false;
    for (let noMot in mots) {
        reponse |= msg.content.toLowerCase().includes(mots[noMot]);
    }
    
    return reponse;
}

const dataParse = {
    steamDailyDeals: function (readObj, result) {
        let items = result['rdf:RDF'].item;
        for (let noItem in items) {
            let titre = items[noItem].title._cdata;
            let url = items[noItem].link._cdata;

            if (readObj.length <= 0 || !readObj.includes(url)) {
                readObj.push(url);

                SaintMinou.channels.get('631186598662504460').send(`${titre}: ${url}`);
            }
        }

        return readObj;
    },

    humbleGameBundle: function (readObj, result) {
        let items = result.rss.channel.item;
        for (let noItem in items) {
            let titre = items[noItem].title._text;
            let url = items[noItem].link._text;

            let categoriesOriginales = items[noItem].category;
            let categories = [];
            for (let noCat in categoriesOriginales) {
                categories.push(categoriesOriginales[noCat]._text);
            }

            if (categories.length > 0 && categories.includes('humble game bundle') && (readObj.length <= 0 || !readObj.includes(url))) {
                readObj.push(url);

                SaintMinou.channels.get('631186956839026708').send(`${titre}: ${url}`);
            }
        }

        return readObj;
    },

    itchIOSales: function (readObj, result) {
        let items = result.rss.channel.item;
        for (let noItem in items) {
            let titre = items[noItem].title._text;
            let url = items[noItem].link._text;
            
            if (readObj.length <= 0 || !readObj.includes(url)) {
                readObj.push(url);

                SaintMinou.channels.get('631187088292839435').send(`${titre}: ${url}`);
            }
        }

        return readObj;
    },

    itchIOFree: function (readObj, result) {
        let items = result.rss.channel.item;
        for (let noItem in items) {
            let titre = items[noItem].title._text;
            let url = items[noItem].link._text;

            if (readObj.length <= 0 || !readObj.includes(url)) {
                readObj.push(url);

                SaintMinou.channels.get('631187166516740106').send(`${titre}: ${url}`);
            }
        }

        return readObj;
    }
};
