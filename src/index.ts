import "reflect-metadata";
import {createConnection, BeforeUpdate, ManyToMany} from "typeorm";
import * as request from "request"
import * as Config from './json/config.json'
import * as Discord from "discord.js"
import * as cheerio from 'cheerio'
import io from 'socket.io-client'
import {User} from "./entity/User";
import { isNumber } from "util";
const isUpdating: boolean = true;
const Bot = new Discord.Client()
const prefix = ";"
//const Socket = io('http://localhost:3001')
const commands = {
    ";execute" : ["target", "command"]
}
const recipe: MinecraftRecipe = {
    목재 : ["wood", "gif"],
    막대기 : ["stick"],
    횃불 : ["torch"],
    작업대 : ["workbench"],
    화로 : ["furnace"],
    상자 : ["chest"],

}

const rank = {
    'NORMAL' : [1.0, 0xB3B3B3],
    'VIP' : [1.5, 0x28FF00],
    'VIP+' : [2.1, 0x4CFFA7],
    'MVP' : [2.8, 0x10FFFD],
    'MVP+' : [3.4, 0x266BF8],
    'MVP++' : [4.5, 0xF5910A],
    'OP' : [10.0, 0xA40AF5]
}
function normalItemInit(rare:Minecraft.itemRares):Minecraft.normalItem {
    return {num : 0, rare : rare}
}
function decoEmbed(text:string):string {
    return "`" + text + "`"
}
function embed(text:string):string {
    return "```fix\n" + text + "```"
}
function dice(start:number, end:number):number{
    return Math.floor((Math.random() * (end-start+1)) + start);
}
function getFromMention(mention:string):Discord.User{
	if (!mention) return;

	if (mention.startsWith('<@') && mention.endsWith('>')) {
		mention = mention.slice(2, -1);

		if (mention.startsWith('!')) {
			mention = mention.slice(1);
		}

		return Bot.users.cache.get(mention);
	}
}
abstract class Lang {
    private static INVENTORY_TABLE = {
        iron : '철',
        gold : '금',
        num : '개수',
        rare : '희귀도',
        diamond_sword : '다이아몬드 검',
        durability : '내구도',
        damage : '공격 피해',
        enchant : '마법 부여'
    }
    public static Inventory(text:string): string {
        return Lang.INVENTORY_TABLE[text]
    }
}
createConnection().then(async connection => {
    Bot.on("ready", () => {
        console.log("준비 완료")
        let currentPre = 1
        setInterval(() => {
            Bot.user.setPresence({
                activity : {
                    name : currentPre == 1 ? ';등록' : '업데이트 중에는 명령어 사용이 원활하지 않을 수 있습니다.'
                }
            })
            currentPre = currentPre == 1 ? 0 : 1
        },5000)
    })
    Bot.on("message", async message => {
        /*Socket.on('cplResponse', (cpl:CPLMinifyObject) => {
            let cplObject = cpl[0]
            let getDataOK = {
                title : `접속자 목록 (${Object.keys(cplObject[0]).length})`,
                fields : [],
                color : 0x00ff00
            }
            for(let key in cplObject){
                getDataOK.fields.push({
                    name : cplObject[key].name,
                    value : `:star:레벨 ${cplObject[key].lv}\n:date:접속 날짜 ${cplObject[key].date}\n:id:식별자 ${key}\n:crown:권한 ${cplObject[key].permission}`
                })
            }
            react(getDataOK)
        })*/
        const command = message.content     
        function react(value : string | Util.Loose<Discord.MessageEmbed>): Promise<Discord.Message> {
                return message.channel.send(typeof value == "string" ? value : {embed : value}) as Promise<Discord.Message>
        }
        function Counter(text:string):boolean {
            let origin = command.replace(";","")
            if(command != text) return false;
            if(commands[origin]){
                if(commands[origin].length + 1 != origin.split(" ").length){
                    react(`오류 : 이 커맨드에는 ${commands[origin.split(" ").length + (commands[origin].length + 1 - origin.split(" ").length)]} 값이 필요합니다!`)
                }
            }else {
                return false;
            }
        }
        if(message.content == ";등록"){
          if(await User.findOne({userid : message.author.id})){
                let RegisterFail = {
                    title : "또 오시려고요?",
                    color : 0xff0000,
                    fields : [
                        {
                            name : "이미 있음",
                            value : "이미 등록되어 있는 유저입니다."
                        }
                    ]
                }
                react(RegisterFail)
        } else {
            let user = new User()
            user.date = new Date()
            user.userid = message.author.id
            user.name = message.author.username
            user.iron = 0
            user.gold = 0
            user.lv = 1
            user.lastMinig = '0'
            user.lor = 1500
            user.inventory = {
                iron : normalItemInit('common'),
                gold : normalItemInit('common')
            }
            user.exp = 0
            user.rank = 'NORMAL'
            await user.save()
            let RegisterOK = {
                title : "등록 완료",
                color : 0x00ff00,
                fields : [
                    {
                        name : "성공!",
                        value : "등록이 완료되었습니다."
                    }
                ]
            }
            react(RegisterOK)
        } 
    }
    if(message.content.startsWith("$get")){
        let args = message.content.split(' ')[1]
        request.get(`http://${args}/servers`, (err, res, body) => {
            if(err){
                let requestError = {
                    color : 0xff0000,
                    title : "오류",
                    fields : [
                        {
                            name : "Error : ENOTFOUND",
                            value : "도메인이 올바르지 않거나 사용할 수 없습니다. (서버가 닫혀 있습니다.)"
                        }
                    ]
                }
                react(requestError)
            }else {
                let requestOK = {
                    color : 0x00ff00,
                    title : "접속자 확인",
                    fields : [
                        {
                            name : args,
                            value : `${JSON.parse(body).list[0]} 명 접속 중`
                        }
                    ]
                }
                message.channel.send({embed : requestOK})
            }
        })
    }
    if(message.content.startsWith(';lolp')){
        let summonerName = message.content.substring(message.content.indexOf(' ') + 1, message.content.length)
        request.get({url : `https://www.op.gg/summoner/userName=${encodeURI(summonerName)}/`}, (err, res, body) => {
            if(err) throw err;
            let $ = cheerio.load(body)
            let summonerLv = $('.Face').children('.ProfileIcon').children('.Level').text()
            let summonerImg = `http:${$('.Face').children('.ProfileIcon').children('.ProfileImage').attr('src')}`
            let TierImg = `http:${$('.TierBox').children('.SummonerRatingMedium').children('.Medal').children('.Image').attr('src')}`
            let Tier = $('.TierBox').children('.SummonerRatingMedium').children('.TierRankInfo').children('.TierRank').text()
            let Summoner = {
                color : 0x00ff00,
                title : summonerName,
                thumbnail : {
                    url : summonerImg
                },
                image : {
                 url : TierImg
                },
                fields : [
                    {
                        name : '레벨',
                        value : summonerLv
                    },
                    {
                        name : '솔로 랭크',
                        value : Tier
                    }
                ]
            }
            react(Summoner)
        })
    }
    if(message.content.startsWith('> ')){
        let res;
        try {
        res = eval(message.content.substring(message.content.indexOf(' ') + 1, message.content.length))
        } catch(e){
            react({
                title : 'JSRun',
                color : 0xff0000,
                description : e
            })
        }
        let runJSOK = {
            color : 0x00ff00,
            title : 'JSRun',
            description : res
        }
        react(runJSOK)
    }
    if(message.content == "$hypixel:online"){
        request.get("https://api.minetools.eu/ping/hypixel.net", (err, res, body) => {
            let requestOK = {
                color : 0x00ff00,
                title : "Hypixel 접속자 확인",
                fields : [
                    {
                        name : "현재 접속 중 : ",
                        value: `${JSON.parse(body).players.online} 명`
                    }
                ]
            }
            react(requestOK)
        })
    }
    if(command.startsWith(";dungeon start")){
        if(!await User.findOne({userid : message.author.id})){
            react({
                title : "던전",
                color : 0xff0000,
                fields : [
                    {
                        name : "경고",
                        value : "탐험을 시작하기 전에 등록을 진행해야 합니다."
                    }
                ]
            })
        }

    }
    if(command == ";db delete"){
        await (await User.findOne({userid : message.author.id})).remove()
        react("삭제 완료")
    }
    if(command.startsWith(";execute")){
        let arr1 = commands[command.split(" ")[0]]
        let arr2 = command.split(" ").slice(1)
        let counter = []
        arr1.forEach((e, i) => {
            if(!arr2[i]) counter.push(e) //비교 대상 배열 k의 반복문에서
            // 사용자가 준 인자 배열의 인덱스가 undefined이면 count한다.
        })
        react({
            title : '오류',
            color : 0xff0000,
            fields : [
                {
                    name : "인자 없음",
                    value : `${decoEmbed(command.split(" ")[0])} 명령어를 수행하려면 ${decoEmbed(counter.join(", "))} 인자가 필요합니다.`
                }
            ]
        })
    }
    if(command == ';get cpl'){
        //Socket.emit('cpl')
    }
    if(command.startsWith(";조합법")){
        let target = message.content.substring(message.content.indexOf(' ') + 1, message.content.length)
        if(!recipe[target]) return react(`"${target}" 의 조합법은 아직 추가되지 않았거나 없는 대상입니다.`)
        react({
            title : target,
            image : {
                url : `https://www.minecraftcrafting.info/imgs/craft_${recipe[target][0]}.${recipe[target][1] || "png"}`
            },
            color : 0x00ff00
        })
    }
    if(command == ';채광'){

        if(!await User.findOne({userid : message.author.id})){
            react({
                title : '누구세요?',
                color : 0xff0000,
                description : '등록되지 않은 유저입니다. ``;등록`` 을 사용하여 먼저 등록을 진행해 주세요.'
            })
        }else {
            let my = await User.findOne({userid : message.author.id})
            let now = Date.now()
            if((now - Number(my.lastMinig)) / 1000 <= 45){
                return react({
                    title : '서두르지 마세요!',
                    color : 0xff0000,
                    fields : [
                        {
                            name : '이미 최근에 채광을 시도했습니다.',
                            value : `${Math.ceil(45 - ((now - Number(my.lastMinig)) / 1000))} 초 후에 다시 시도해 주세요.`
                        }
                    ]
                })
            }
            let got = dice(1,2)
            let goldGot = dice(1,5)
            let expNum = dice(1, my.lv * 15)
            let ironNum:string|number = dice(1, my.lv * 2)
            let goldNum:string|number = dice(1, 2)

           // if(got == 1) my.iron += ironNum = ironNum + Math.round(ironNum * rank[my.rank][0])
            if(got == 1) my.inventory.iron.num += ironNum = ironNum + Math.round(ironNum * rank[my.rank][0])
            else ironNum = '철을 얻지 못하였습니다.'
            if(goldGot == 1) my.inventory.gold.num += goldNum = goldNum + Math.round(goldNum * rank[my.rank][0])
            else goldNum = '금을 얻지 못하였습니다.'

            my.lastMinig = Date.now().toString()
            await my.save()
            react({
                title : '채광 결과',
                color : 0x00ffff,
                thumbnail : {
                    url : 'https://ww.namu.la/s/e210b023ba310ba11c2c387963513e700fb171d398f7081f9d9ca63666ce1c2ad3c99b37de096eb62e437af045d0f82b0120625e4cc2114e402e193c0148aa11ddf45e357b03c778ac00f249f06efe2b780eb432ee98c6164d61f14aef6905f7'
                },
                fields : [
                    {
                        name : '철',
                        value : embed(`${!isNumber(ironNum) ? '' : '+ '}${ironNum}`)
                    },
                    {
                        name : '금',
                        value : embed(`${!isNumber(goldNum) ? '' : '+ '}${goldNum}`)
                    }
                ]
            })
            
        }
    }

   /* if(command == ';벌목'){

        if(!await User.findOne({userid : message.author.id})){
            react({
                title : '누구세요?',
                color : 0xff0000,
                description : '등록되지 않은 유저입니다. ``;등록`` 을 사용하여 먼저 등록을 진행해 주세요.'
            })
        }else {
            let my = await User.findOne({userid : message.author.id})
            let now = Date.now()
            if((now - Number(my.lastMinig)) / 1000 <= 30){
                return react({
                    title : '서두르지 마세요!',
                    color : 0xff0000,
                    fields : [
                        {
                            name : '이미 최근에 벌목을 시도했습니다.',
                            value : `${Math.ceil(30 - ((now - Number(my.lastMinig)) / 1000))} 초 후에 다시 시도해 주세요.`
                        }
                    ]
                })
            }
            let woodNum;
            my.gold += goldNum = dice(1, 2)

            my.lastMinig = Date.now().toString()
            await my.save()

            react({
                title : '채광 결과',
                color : 0x00ffff,
                thumbnail : {
                    url : 'https://ww.namu.la/s/e210b023ba310ba11c2c387963513e700fb171d398f7081f9d9ca63666ce1c2ad3c99b37de096eb62e437af045d0f82b0120625e4cc2114e402e193c0148aa11ddf45e357b03c778ac00f249f06efe2b780eb432ee98c6164d61f14aef6905f7'
                },
                fields : [
                    {
                        name : '철',
                        value : embed(`${isNaN(ironNum) ? '' : '+ '}${ironNum}`)
                    },
                    {
                        name : '금',
                        value : embed(`${isNaN(goldNum) ? '' : '+ '}${goldNum}`)
                    }
                ]
            })
            
        }
    }*/

    if(command.startsWith(';인벤토리')){
        let mentionArg = command.slice(1).split(/ +/)[1]
        if(mentionArg){
            let target = getFromMention(mentionArg)
            if(!await User.findOne({userid : target.id})){
                return react({
                    title : '그 분은 또 누구신지',
                    color : 0xff0000,
                    description : '그 분은 등록되지 않은 유저입니다. ``;등록`` 을 사용하여 등록을 진행해 달라고 전해 주세요.'
                })
            }
            let my = await User.findOne({userid : target.id})
            react({
                title : `${my.rank != 'NORMAL' ? `[${my.rank}]` : ''}${target.username} 님의 인벤토리`,
                color : 0x9900ff,
                fields : [
                    {
                        name : '철',
                        value : embed(my.inventory.iron.num.toString())
                    },
                    {
                        name : '금',
                        value : embed(my.inventory.gold.num.toString())
                    }
                ]
            })
        }else {
        if(!await User.findOne({userid : message.author.id})){
            return react({
                title : '누구세요?',
                color : 0xff0000,
                description : '등록되지 않은 유저입니다. ``;등록`` 을 사용하여 먼저 등록을 진행해 주세요.'
            })
        }
        let my = await User.findOne({userid : message.author.id})
        react({
            title : '내 인벤토리',
            color : 0x9900ff,
            fields : [
                {
                    name : '철',
                    value : embed(my.inventory.iron.num.toString())
                },
                {
                    name : '금',
                    value : embed(my.inventory.gold.num.toString())
                }
            ]
        })
    }
    }


    if(command.startsWith(';스탯')){
        let mentionArg = command.slice(1).split(/ +/)[1]
        if(mentionArg){
            let target = getFromMention(mentionArg)
            if(!await User.findOne({userid : target.id})){
                return react({
                    title : '그 분은 또 누구신지',
                    color : 0xff0000,
                    description : '그 분은 등록되지 않은 유저입니다. ``;등록`` 을 사용하여 등록을 진행해 달라고 전해 주세요.'
                })
            }
            let my = await User.findOne({userid : target.id})
            react({
                title : `${my.rank != 'NORMAL' ? `[${my.rank}]` : ''}${target.username} 님의 스탯`,
                color : rank[my.rank][1],
                thumbnail : {
                    url : target.avatarURL()
                },
                fields : [
                    {
                        name : '랭크',
                        value : embed(my.rank)
                    },
                    {
                        name : '레벨',
                        value : embed(my.lv.toString())
                    },
                    {
                        name : '로어',
                        value : embed(my.lor.toString())
                    }
                ]
            })
        }else {
        if(!await User.findOne({userid : message.author.id})){
            return react({
                title : '누구세요?',
                color : 0xff0000,
                description : '등록되지 않은 유저입니다. ``;등록`` 을 사용하여 먼저 등록을 진행해 주세요.'
            })
        }
        let my = await User.findOne({userid : message.author.id})
        react({
            title : '내 스탯',
            color : rank[my.rank][1],
            thumbnail : {
                url : message.author.avatarURL()
            },
            fields : [
                {
                    name : '랭크',
                    value : embed(my.rank)
                },
                {
                    name : '레벨',
                    value : embed(my.lv.toString())
                },
                {
                    name : '로어',
                    value : embed(my.lor.toString())
                }
            ]
        })
    }
    }
    if(command == ';않 임니다.'){
        if(!await User.findOne({userid : message.author.id})){
            return react({
                title : '누구세요?',
                color : 0xff0000,
                description : '등록되지 않은 유저입니다. ``;등록`` 을 사용하여 먼저 등록을 진행해 주세요.'
            })
        }
        let my = await User.findOne({userid : message.author.id})
        react('bn 쿨타임을 초기화 함니다.')
        my.lastMinig = '0'
        await my.save()

    }
    if(command.startsWith(';랭크신청')){
        let rankArg = command.slice(1).split(/ +/)[1]
        if(!rankArg) return react('형식이 잘못되었습니다.')
        if(!await User.findOne({userid : message.author.id})){
            return react({
                title : '누구세요?',
                color : 0xff0000,
                description : '등록되지 않은 유저입니다. ``;등록`` 을 사용하여 먼저 등록을 진행해 주세요.'
            })
        }
        let my = await User.findOne({userid : message.author.id});
        (await Bot.users.fetch('371938007600726026')).send({
            title : '랭크 신청',
            description : `${my.name}(${my.userid}) 님이 ${rankArg} 랭크를 신청하셨습니다.`
        })
    }
    if(command.startsWith(';신청수락')){
        let targetArg = command.slice(1).split(/ +/)[1]
        if(!targetArg) return react('형식이 잘못되었습니다.')
        if(!await User.findOne({userid : targetArg})){
            return react({
                title : '그 분은 또 누구신지',
                color : 0xff0000,
                description : '그 분은 등록되지 않은 유저입니다. ``;등록`` 을 사용하여 먼저 등록을 진행해 달라고 전해주세요.'
            })
        }
        
    }
    if(command == ';inventory-beta'){
        let my = await User.findOne({userid : message.author.id})
        let renderObject = {
            title : '내 인벤토리',
            color : 0x9900ff,
            fields : []
        }
        let invenField = ''
        for(let i in my.inventory){
            for(let key in my.inventory[i]){
                invenField += `${Lang.Inventory(key)} : ${ my.inventory[i][key] instanceof Array ? my.inventory[i][key].toString().replace(',', ' / ') : my.inventory[i][key]}\n`
            }
            renderObject.fields.push({
                name : Lang.Inventory(i),
                value : embed(invenField)
            })
            invenField = ''
        }
        react(renderObject)
    }
    if(command == ';del'){
        let my = await User.findOne({userid : message.author.id})
        await User.remove(my)
    }
    if(command.startsWith(';한영번역')){
        let hangulTarget = command.substr(command.indexOf(' ') + 1)
        const options = {
            url: 'https://openapi.naver.com/v1/papago/n2mt',
            form: {'source':'ko', 'target':'en', 'text':hangulTarget},
            headers: {'X-Naver-Client-Id':'ezZ_GVEX4I_ZcK3ho8WP', 'X-Naver-Client-Secret': 'N5wduCuAgE'}
         };
        request.post(options, (err, res, body) => {
            if(err) throw err;
            react({
                title : '번역',
                color : 0x9900ff,
                description : JSON.parse(body)["message"]["result"]["translatedText"]
            })
        })
    }
    if(command == ';give @s diamond_sword'){
        let my = await User.findOne({userid : message.author.id})
        my.inventory.diamond_sword = {
            durability : [500, 500],
            enchant : {},
            rare : 'epic',
            damage : 7
        }
        await my.save()
        react('다이아몬드 검 1개가 지급되었습니다.')
    }
    })
    Bot.login(Config.token)

}).catch(error => console.log(error));