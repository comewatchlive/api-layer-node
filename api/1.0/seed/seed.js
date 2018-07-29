require('dotenv').config()

const mongoose = require('mongoose');
const slugify = require('slugify');
const UserModel = require("../resources/users/users.model");
const BroadcasterModel = require("../resources/broadcasters/broadcasters.model")
const ChatroomModel = require("../resources/chatrooms/chatrooms.model")
const SystemModel = require("../resources/system/system.model");
const org_tags = ["abc","def","hij","klm","nop","qrs","tuv","wxy","z"];
const counts = {
    user: 10,
    admin: 3,
    broadcaster: 200,
    onlineBroadcaster: 50
};
const totals = {
    user: 10,
    admin: 3,
    broadcaster: 200,
    onlineBroadcaster: 50
}
const createMethods = {
    user (usr, type, methodType, num, offset, resolve) {
        usr.then((user) => {
            console.log(`${user.username}  saved.`)
            recNext(resolve, type, methodType, offset);
        })
        .catch((err) => {
            console.log(`${type} ${num} not saved.`);
            console.log(err);
            console.log('');
            recNext(resolve, type, methodType, offset);
        })
    },
    broadcaster (usr, type, methodType, num, offset, resolve) {
        usr.then((user) => {
            console.log(`${user.username}  saved.`)
            return new BroadcasterModel(new Broadcaster(user.username)).save()
        })
        .then((broadcaster) => recNext(resolve, type, methodType, offset))
        .catch((err) => {
            console.log(`${type} ${num} not saved.`);
            console.log(err);
            console.log('');
            recNext(resolve, type, methodType, offset);
        })
    },
    onlineBroadcaster (usr, type, methodType, num, offset, resolve) {
        usr.then((user) => {
            console.log(`${user.username} user saved.`)
            let broadcaster = new BroadcasterModel(new Broadcaster(user.username, true))
            let chatroom = new ChatroomModel({
                slug: broadcaster.slug,
                broadcasterID: broadcaster._id,
                socket: 'crecercercercre',
                username: broadcaster.username,
                topic: 'Chatroom Topic Goes Here',
                images: broadcaster.images,
                tags: broadcaster.tags,
                viewers: rando(2000),
                xp: rando()
            })

            // add chatroom broadcaster is in to broadcaster
            broadcaster.room = chatroom._id

            return {broadcaster, chatroom}
        })
        .then(({broadcaster, chatroom}) => {
            return new Promise ((resolve, reject) => {
                broadcaster.save()
                    .then((caster) => resolve(chatroom))
                    .catch((err) => {
                        console.log(`${type} ${num} broadcaster not saved.`);
                        console.log(err);
                        console.log('');
                        recNext(resolve, type, methodType, offset);
                    })
            })
        })
        .then ((chatroom) => {
            return new Promise ((resolve, reject) => {
                chatroom.save()
                    .then((chatroom) => {
                        console.log(`chatroom saved.`)
                        recNext(resolve, type, methodType, offset);
                    } )
                    .catch((err) => {
                        console.log(`${type} ${num} not saved.`);
                        console.log(err);
                        console.log('');
                        recNext(resolve, type, methodType, offset);
                    })
            })
        })
        .catch((err) => {
            console.log(`${type} ${num} not saved.`);
            console.log(err);
            console.log('');
            recNext(resolve, type, methodType, offset);
        })
    }
}

createMethods.admin = createMethods.user;

let tags = org_tags.join(',').split(',');

console.log(process.env.DB_CONNECT);

for (let i = 0; i < 10; i ++) {
    for (let tag in org_tags) {
        let newTag = org_tags[tag] + i
        tags.push(newTag)
    }
}

const rando = (max = 100000) => Math.floor(Math.random() * max) + 1

class User {
    constructor (
        username,
        password = "royalties",
        roles,
        isLoggedIn
    ) {
        this._id = new mongoose.Types.ObjectId();
        this.username = username;
        this.usernameLower = username.toLowerCase()
        this.slug = slugify(username, {lower: true});
        this.email = this.slug + '@a.com';
        this.password = password;
        if (isLoggedIn) this.isLoggedIn = isLoggedIn;
        if (roles) this.roles = roles;
    }
}
class Broadcaster {

    constructor (
        username,
        isOnline = false
    ) {

        const approvalDate = this.randomDate(new Date(2012, 0, 1), new Date());
        const approvalTime = approvalDate.getTime();
        const newCutOff = Date.now() - 12096e5 - 12096e5;
        const isNew = newCutOff < approvalDate;

        this._id = new mongoose.Types.ObjectId();
        this.isOnline = isOnline;
        this.slug = slugify(username, {lower: true});
        this.username = username;
        this.tags = this.createTags();
        if (isNew) this.tags.push('new');
        this.approved = approvalDate;
        this.images = {
            broadcasterGrid: "https://s3-us-west-2.amazonaws.com/s.cdpn.io/70390/show-" + rando(19) +  ".jpg"
        }
        this.xp = rando()
    }

    randomDate(start, end) {
        return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
    }

    createTags () {
        let tag_list = [];
        const _loop = this.randomIndex(8, 1);
        for (let i = 0; i < _loop; i++){
            const _index = this.randomIndex(tags.length, 0);
            let tag = tags[_index]
            if (tag_list.indexOf(tag) === -1) tag_list.push(tag);
        }
        return tag_list;
    }

    randomIndex (max, min) {
        return (Math.floor(Math.random() * max) + min);
    }
}

mongoose.connect(process.env.DB_CONNECT);

const objectsave = (err) => {
    if (err) {
        console.log(err)
    }
}

const recNext = (resolve, type, methodType, offset) => {
    if (counts[methodType]) {
        counts[methodType]--
        recordsLoop(resolve, type, methodType, offset);
    }
}

const recordsLoop = (resolve, type, methodType, offset) => {
    if (counts[methodType]) {
        const num = totals[methodType] - counts[methodType];
        const numTtl = num + offset;
        const usr = new UserModel(new User(`${type} ${numTtl}`, 'royalties', [type])).save();
        createMethods[methodType](usr, type, methodType, num, offset, resolve)
    } else {
        console.log('complete')
        resolve()
    }
}

const recsStart = (type, methodType, offset = 0) => {
    return new Promise(resolve => {
       recordsLoop(resolve, type, methodType, offset)
    })
}

const disconnect = () => {
    process.exit();
}

for (let mod of [BroadcasterModel, ChatroomModel, SystemModel, UserModel]){
    mod.remove((err) => { console.log(err); });
}

new SystemModel()
    .save()
    .then(() => recsStart('admin','admin'))
    .then(() => recsStart('user','user'))
    .then(() => recsStart('broadcaster','broadcaster'))
    .then(() => recsStart('broadcaster','onlineBroadcaster', 200))
    .then(() => disconnect())
    .catch((err) => {
        console.log(err.message);
        disconnect();
    })