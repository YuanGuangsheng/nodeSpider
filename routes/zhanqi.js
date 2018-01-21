/**
 * Created by MM on 2017/6/30.
 */
const express = require('express')
const path = require('path')
const fs = require('fs')
const multer = require('multer')
// const crypto = require('crypto')

const moment = require('moment')
moment.locale('cn')
const debug = require('debug')('api')

const superagent = require('superagent')
const cheerio = require('cheerio')
const mysql = require('mysql')
import Service from '../service'


const router = express.Router()

//战旗：全部分类*************************//

router.get('/allGroup', (req, res) => {
    const result = res
    superagent
        .get('https://www.zhanqi.tv/games')
        .end(function(req, res) {
            const $ = cheerio.load(res.text)
            let allGroup = []
            $('.game-bd ul li').each(function(idx, element){
                let $element = $(element)
                allGroup.push({
                    title: $element.children("a").children('.name').text(),
                    data_id: $element.attr('data-id')
                })
            })
            result.send(allGroup)
        })
})

// 根据 data_id 获取分类游戏列表
router.get('/moreGame/:dataId/:page', (req, res) => {
    const result = res
    let dataId = req.params.dataId
    let page = req.params.page
    superagent
        .get('https://www.zhanqi.tv/api/static/v2.1/game/live/' + dataId + '/30/' + page + '.json')
        .end(function(req, res) {
            let resData = JSON.parse(res.text).data.rooms
            let gameList = []
            for(let i=0;i<resData.length;i++){
                gameList.push({
                    url: resData[i].url.replace("/",""),
                    name: resData[i].nickname,
                    avatar: resData[i].avatar,
                    online: resData[i].online,
                    uid:  resData[i].uid
                })
            }
            result.send(gameList)
        })
})

// 根据 url 进入主播房间
router.get('/liveRoom/:url/:uid', (req, res) => {
    const result = res
    let url = req.params.url
    let uid = req.params.uid
    superagent
        .get('https://www.zhanqi.tv/' + url)
        .end(function(req, res) {
            // do something
            const $ = cheerio.load(res.text)
            let userInfo = []
            let tags = []
            superagent
                .get('https://www.zhanqi.tv/api/static/anchor.tags/'+ uid +'.json')
                .end(function(req, res) {
                    let resData = JSON.parse(res.text)
                    tags = resData.data
                    userInfo.push({
                        name: $('.meat .name').text(),
                        avatar: $('.img-box').children('img').attr('src'),
                        onlineNum: $('.js-room-online-txt').text(),
                        tags: tags
                    })
                    result.send(userInfo)
                })
        })
})

// 总榜和周榜
router.get('/ranking', (req, res) => {
    const result = res
    superagent
        .get('https://www.zhanqi.tv/api/static/room.fansweekrank/46690-11.json')
        .end(function(req, res) {
            let resData = JSON.parse(res.text)
            let ranking = []
            ranking.push({
                week: resData.data.week,
                total: resData.data.total
            })
            result.send(ranking)
        })
})

module.exports = router