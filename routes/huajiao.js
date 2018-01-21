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

//category 根据首页导航获取直播类型 category
router.get('/', (req, res) => {
    const result = res
    superagent
    .get('http://www.huajiao.com/')
    .end(function(req, res) {
        const $ = cheerio.load(res.text)
        let category = []
        $("#doc-hd .hd-nav .item").each(function(idx, element) {
            let $element = $(element)
            category.push({
                name: $element.children('a').text(),
                category: $element.children('a').attr('href').split("/")[1],
                categoryId: $element.children('a').attr('href').split("/")[2]
            })
        })
        result.send(category)
    })
})

// hotFeeds (最热分类下)根据直播类型categoryId和type(最热/最新)获取主播roomId,uid  :nums为加载多少个
router.get('/hot/:category/:categoryId/:nums', (req, res) => {
    const result = res
    let category = req.params.category;
    let categoryId = req.params.categoryId;
    let nums = req.params.nums;
    if(category == "category"){
        // 非小视频
        superagent
            .get('http://webh.huajiao.com/live/listcategory')
            .query('cateid=' + categoryId + '&nums=' + nums)
            .end(function(req, res) {
                let list = JSON.parse(res.text).data.feeds
                let hotFeeds = []
                for(let i=0;i<list.length;i++){
                    hotFeeds.push({
                        hotRoomId: list[i].feed.relateid,
                        uid:  list[i].author.uid
                    })
                }
                result.send(hotFeeds)
            })
    }
    else if(category == "vl") {
        // 小视频
        superagent
            .get('http://webh.huajiao.com/live/listVideo')
            .query('orderby=watches&nums=' + nums)
            .end(function(req, res) {
                let list = JSON.parse(res.text).data
                let hotFeeds = []
                for(let i=0;i<list.length;i++){
                    hotFeeds.push({
                        hotRoomId: list[i].vid,
                        uid: list[i].uid
                    })
                }
                result.send(hotFeeds)
            })
    }
})


// newFeeds (最新分类下)根据直播类型categoryId获取主播roomId,uid  :nums为加载多少个
router.get('/new/:category/:categoryId/:nums', (req, res) => {
    const result = res
    let category = req.params.category;
    let categoryId = req.params.categoryId;
    let nums = req.params.nums;
    if(category == "category"){
        // 非小视频
        superagent
            .get('http://webh.huajiao.com/live/listCategoryNewest')
            .query('cateid=' + categoryId + '&nums=' + nums)
            .end(function(req, res) {
                let list = JSON.parse(res.text).data.feeds
                let newFeeds = []
                for(let i=0;i<list.length;i++){
                    newFeeds.push({
                        newRoomId: list[i].feed.relateid,
                        uid:  list[i].author.uid
                    })
                }
                result.send(newFeeds)
            })
    }
    else if(category == "vl") {
        // 小视频
        superagent
            .get('http://webh.huajiao.com/live/listVideo')
            .query('nums=' + nums)
            .end(function(req, res) {
                let list = JSON.parse(res.text).data
                let newFeeds = []
                for(let i=0;i<list.length;i++){
                    newFeeds.push({
                        newRoomId: list[i].vid,
                        uid: list[i].uid
                    })
                }
                result.send(newFeeds)
            })
    }
})

// userInfo 根据主播uid获取主播信息
router.get('/infoList/:uId', (req, res) => {
    const result = res
    let uId = req.params.uId
    superagent
    .get('http://www.huajiao.com/user/' + uId)
    .end(function(req, res) {
        const $ = cheerio.load(res.text)
        let userInfo =[]
        let tag = []
        // tag
        $('.tags span').each(function(idx, element){
            let $element = $(element)
            for(let i=0;i<$element.length;i++){
                tag.push($element.eq(i).text())
            }
        })

        $('#userInfo').each(function(idx, element) {
            let $element = $(element)
            userInfo.push({
                avatar: $element.children('.avatar').children('img').attr('src'),
                name: $element.children('.info').children('.info-box ').children('h3').children('span').eq(0).text(),
                number: $element.children('.info').children('.info-box ').children('h3').children('span.number').text(),
                location: $element.children('.info').children('.info-box ').children('h3').children('span.location').text(),
                about: $element.children('.info').children('.info-box').children('p.about').text(),
                tag: tag,
                fens: $element.children('.handle').children('.wrap').children('ul').children('li').eq(0).children('h4').text().replace(/\s+/g,""),
                vote_up: $element.children('.handle').children('.wrap').children('ul').children('li').eq(1).children('h4').text().replace(/\s+/g,""),
                get_gift: $element.children('.handle').children('.wrap').children('ul').children('li').eq(2).children('h4').text().replace(/\s+/g,""),
                send_gift: $element.children('.handle').children('.wrap').children('ul').children('li').eq(3).children('h4').text().replace(/\s+/g,"")
            })
        })
        result.send(userInfo)
    })
})

// 根据roomId进入直播房间 (榜单无法获取，貌似是flash)
router.get('/liveRoom/:roomId', (req, res) => {
    const result = res
    let roomId = req.params.roomId
    superagent
    .get('http://www.huajiao.com/l/' + roomId)
    .end(function(req, res){
        const $ = cheerio.load(res.text)

    })
})


// 花椒直播间榜单都找不到
module.exports = router
