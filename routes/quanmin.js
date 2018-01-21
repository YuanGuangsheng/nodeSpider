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

//全民tv：全部分类*************************//、
router.get('/allGroup', (req, res) => {
    const result = res
    superagent
        .get('http://www.quanmin.tv/category')
        .end(function(req, res) {
            const $ = cheerio.load(res.text)
            let allGroup = []
            $('.list_w-card_wrap a').each(function(idx, element){
                let $element = $(element)
                allGroup.push({
                    title: $element.attr('title'),
                    game_id: $element.attr('href').replace("//www.quanmin.tv/game/","")
                })
            })
            result.send(allGroup)
        })
})

// 根据 game_id 进入分类游戏列表
router.get('/moreGame/:gameId', (req, res) => {
    const result = res
    let gameId = req.params.gameId
    superagent
        .get('http://www.quanmin.tv/game/' + gameId)
        .end(function(req, res) {
            const $ = cheerio.load(res.text)
            let gameList = []
            $(".list_w-videos ul li").each(function(idx, element){
                let $element = $(element)
                gameList.push({
                    roomId: $element.children().children().children("a").attr('href').replace("//www.quanmin.tv/","")
                })
            })
            result.send(gameList)
        })
})

// 根据 roomId 进入直播间
router.get('/liveRoom/:roomId', (req, res) => {
    const result = res
    let roomId = req.params.roomId
    superagent
        .get('http://www.quanmin.tv/' + roomId)
        .end(function(req, res) {
            // do something

            const $ = cheerio.load(res.text)
            let userInfo = []
            let $sub = $(".room_w-title_sub").children()
            userInfo.push({
                avatar: $('.room_w-title_avatar').children('.room_w-title_img').attr('src'),
                name: $sub.eq(0).children("span").text(),
                number: $sub.eq(1).children("span").text(), //全民号
                renqi: $sub.eq(2).children("span").text(), //人气
                fight: $sub.eq(3).children("span").text() //战斗力
            })
            result.send(userInfo)
        })
})

// 粉丝榜
router.get('/fansRank/:roomId', (req, res) => {
    const result = res
    let roomId = req.params.roomId
    superagent
        .get('https://www.quanmin.tv/shouyin_api/public/honor/rank/' + roomId + '?debug')
        .end(function(req, res) {
            let resData = JSON.parse(res.text).data
            let fansRank = resData.list
            result.send(fansRank)
        })
})

// 周榜
router.get('/weekRank/:roomId', (req, res) => {
    const result = res
    let roomId = req.params.roomId
    superagent
        .get('https://www.quanmin.tv/shouyin_api/public/user/weekcontribute/' + roomId + '?debug')
        .end(function(req, res) {
            let resData = JSON.parse(res.text).data
            let weekRank = resData.list
            result.send(weekRank)
        })
})

// 守护

module.exports = router