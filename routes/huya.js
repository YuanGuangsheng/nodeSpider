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

//虎牙：全部分类*************************//
router.get('/allGroup', (req, res) => {
    const result = res
    superagent
        .get('http://www.huya.com/g')
        .end(function(req, res) {
            const $ = cheerio.load(res.text)
            let allGroup = []
            $("#js-game-list .game-list-item").each(function(idx, element){
                let $element = $(element)
                let report = JSON.parse($element.children('a').attr('report'))
                allGroup.push({
                    title: $element.children('a').children('.title').text(),
                    game_id: report.game_id
                })
            })
            result.send(allGroup)
        })
})

// 根据 game_id 获取游戏列表
router.get('/moreGame/:gameId/:page', (req, res) => {
    const result = res
    let gameId = req.params.gameId
    let page = req.params.page
    console.log(gameId,page)
    superagent
        .get('http://www.huya.com/cache.php?m=LiveList&do=getLiveListByPage&gameId='+ gameId +'&tagAll=0&page=' + page)
        .end(function(req, res) {
            let resData = JSON.parse(res.text).data.datas
            let gameList = []
            for(let i=0;i<resData.length;i++){
                gameList.push({
                    privateHost: resData[i].privateHost,
                    name: resData[i].nick,
                    avatar: resData[i].avatar180,
                    uid: resData[i].uid
                })
            }
            result.send(gameList)
        })
})

// 根据privateHost 进入直播房间
router.get('/liveRoom/:privateHost', (req, res) => {
    const result = res
    let privateHost = req.params.privateHost
    superagent
        .get('http://www.huya.com/' + privateHost)
        .end(function(req, res) {
            // do something

            const $ = cheerio.load(res.text)
            let userInfo = []
            $('.host-detail').each(function(idx, element){
                let $element = $(element)
                userInfo.push({
                    avatar: $("#avatar-img").attr('src'),
                    name: $element.children('.host-name').text(),
                    host_title: $(".host-title").text(),
                    live_count: $element.children('.host-spectator').children('#live-count').text()
                })
            })
            result.send(userInfo)
        })
})

// 根据uid获取直播间 粉丝团
router.get('/fansList/:uid', (req, res) => {
    const result = res
    let uid = req.params.uid
    superagent
        .get('http://www.huya.com/cache.php?m=Fans&do=getFansSupportList&profileUid=' + uid)
        .end(function(req, res) {
            let resData = JSON.parse(res.text).data
            let fansList = resData
            result.send(fansList)
        })
})

// 根据uid获取直播间 周贡榜
router.get('/weekRank/:uid', (req, res) => {
    const result = res
    let uid = req.params.uid
    superagent
        .get('http://www.huya.com/cache5min.php?m=WeekRank&do=getItemsByPid&pid=' + uid)
        .end(function(req, res) {
            let resData = JSON.parse(res.text).data
            let weekRank = resData.vWeekRankItem
            result.send(weekRank)
        })
})
module.exports = router